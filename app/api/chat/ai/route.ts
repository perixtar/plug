import { runCodingAgentStream, runUserIntentAgent } from "../__utils__";
import { getDatabaseFromTool } from "@/app/actions/tool/get-tools";
import { isQAResponse } from "@/lib/chat-utils";
import { JsonValue } from "@/lib/generated/prisma/runtime/library";
import { getAIModelById } from "@/lib/models";
import { LLMModel } from "@/lib/models";
import { CodeArtifact } from "@/lib/schema";
import { CodeTemplate } from "@/types/code-template";
import { LanguageModel, CoreMessage } from "ai";
import { NextResponse } from "next/server";
import { getWorkspaceDatabase } from "@/app/actions/workspace/workspace-databases";

export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    messages,
    userID,
    model,
    template,
    projectId,
  }: {
    messages: CoreMessage[];
    userID: string;
    model: LLMModel;
    template: CodeTemplate;
    projectId?: string;
  } = await req.json();

  const modelClient = getAIModelById(model.id);
  let databaseSamples: JsonValue[] = [];
  let databaseConnectionEnvs: string[][] = [];

  const database = await getDatabaseFromTool(projectId!);
  if (database?.table_sample) {
    databaseSamples.push(database?.table_sample);
    databaseConnectionEnvs.push(database?.connection_envs);
  }

  const excelToolDb = await getWorkspaceDatabase(
    "8eef4a77-6a46-4886-ae1d-f05f29112ddf"
  );

  if (excelToolDb) {
    databaseSamples.push(excelToolDb?.table_sample);
    databaseConnectionEnvs.push(excelToolDb?.connection_envs);
  }

  const genCode = await runUserIntentAgent(
    messages,
    template,
    modelClient as LanguageModel,
    databaseSamples,
    databaseConnectionEnvs
  );

  console.log("Generated Code:", genCode);
  if (isQAResponse(genCode)) {
    const codeArtifact = {
      commentary: genCode,
    } as CodeArtifact;
    return NextResponse.json(codeArtifact);
  }

  // Stream the coding step
  const result = await runCodingAgentStream(
    template,
    modelClient as LanguageModel,
    [{ role: "user", content: genCode }],
    projectId
  );

  return result.toTextStreamResponse();
}
