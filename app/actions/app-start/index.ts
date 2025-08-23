"use server";

import { getMessages, getNumMessagesToday } from "../message/get-message";
import { getPages } from "../page/get-page";
import { getStripeCustomerSubscriptionStatus } from "../stripe";
import { getTool, getTools } from "../tool/get-tools";
import { getWorkspaceByUserId } from "../workspace";
import {
  getDatabasesInWorkspace,
  getWorkspaceDatabase,
  updateTableSchema,
} from "../workspace/workspace-databases";
import { getToolPagesInWorkspace } from "../workspace/workspace-toolpages";
import { createPrismaServerClient } from "@/clients/prisma-server-client";
import { getUserFromServer } from "@/clients/supabase-server-client";
import { TemplateId, workspace_database } from "@/lib/generated/prisma";
import { codeArtifactSchema } from "@/lib/schema";
import { parseNavPagesFromCodeArtifact } from "@/lib/utils";
import {
  validateDbConnection,
  ValidationResult,
} from "@/lib/validateDbConnection";
import { AppStartData } from "@/types/app-start-data";
import { DbType } from "@/types/database-type";
import { ToolPageStartData } from "@/types/tool-page-start-data";
import {
  WorkspaceToTools,
  WorkspaceToWsDbs,
  WorkspaceToToolPages,
} from "@/types/workspace";

const prisma = createPrismaServerClient();

export async function getAppStartData(): Promise<AppStartData> {
  console.log("getAppStartData");
  const user = await getUserFromServer();
  if (!user) {
    return null;
  }

  const [subscription_status, num_tool_message_used, profile] =
    await Promise.all([
      getStripeCustomerSubscriptionStatus(),
      getNumMessagesToday(),
      prisma.profile.findFirst({
        where: {
          id: user.id,
        },
      }),
    ]);

  // If the user is not found, return null
  if (!profile) {
    return null;
  }

  const workspaces = await getWorkspaceByUserId(user.id);

  // Get the tools for each workspace
  const workspace_to_tools: WorkspaceToTools = {};
  const workspace_to_wsdbs: WorkspaceToWsDbs = {};
  const workspace_to_toolpages: WorkspaceToToolPages = {};
  const tool_to_navpages: Record<string, string[]> = {};
  for (const workspace of workspaces || []) {
    const [tools, workspace_dbs, toolpages] = await Promise.all([
      getTools(workspace.id),
      getDatabasesInWorkspace(workspace.id),
      getToolPagesInWorkspace(workspace.id),
    ]);
    workspace_to_tools[workspace.id] = tools;
    workspace_to_wsdbs[workspace.id] = workspace_dbs;
    workspace_to_toolpages[workspace.id] = toolpages;
    // create a mapping of tool_id to nav pages
    for (const tool of tools) {
      if (tool.latest_code_artifact) {
        const codeArtifact = codeArtifactSchema.parse(
          tool.latest_code_artifact
        );
        tool_to_navpages[tool.id] = parseNavPagesFromCodeArtifact(
          tool.template_id as TemplateId,
          codeArtifact
        );
      }
    }
  }

  return {
    user,
    profile,
    workspaces,
    workspace_to_tools,
    workspace_to_wsdbs,
    subscription_status,
    num_tool_message_used,
    workspace_to_toolpages,
    tool_to_navpages,
  };
}

export async function getToolPageStartData(
  toolId: string
): Promise<ToolPageStartData> {
  const user = await getUserFromServer();
  if (!user) {
    return {} as ToolPageStartData;
  }
  const current_tool = await getTool(toolId);
  if (!current_tool) {
    return {} as ToolPageStartData;
  }
  // initialize tool data
  const tool_messages = await getMessages(toolId);

  // check if tool has a db selected
  const workspace_db = current_tool.database_id
    ? ((await getWorkspaceDatabase(current_tool.database_id)) ?? null)
    : null;

  // if tool has a db selected, verify its connection and refresh cached collection if > 24hr
  let db_connected = true;
  if (
    workspace_db &&
    (requiresRefresh(workspace_db) || !workspace_db.table_sample)
  ) {
    const result: ValidationResult = await validateDbConnection(
      user?.id,
      workspace_db
    );
    if (result.success && result.schema) {
      updateTableSchema(workspace_db.id, result.schema);
      workspace_db.table_sample = result.schema;
      db_connected = result.success;
    }
  }

  return {
    current_tool,
    tool_messages,
    workspace_db,
    db_connected,
  };
}

const requiresRefresh = (workspace_db: workspace_database) => {
  if (!workspace_db || workspace_db.db_type == DbType.None) {
    return false;
  }
  // if it has been 24 hrs since user last refreshed
  const updatedAtMs = workspace_db.updated_at.getTime();
  const nowMs = Date.now();

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return nowMs - updatedAtMs > TWENTY_FOUR_HOURS_MS;
};
