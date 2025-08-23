"use server";

import { JsonValue } from "@/lib/generated/prisma/runtime/library";
import {
  buildCodingAgentSystemPrompt,
  getUserIntentSystemPrompt,
} from "@/lib/prompt/prompt";
import { codeArtifactSchema } from "@/lib/schema";
import { CodeTemplate } from "@/types/code-template";
import { LanguageModel, CoreMessage, generateText, streamObject } from "ai";
import { createWebSearchTool } from "./tools";

type UserSettings = { webSearchEnabled: boolean };

async function getUserSettings(): Promise<UserSettings> {
  return { webSearchEnabled: true }; // default off
}

export async function runUserIntentAgent(
  messages: CoreMessage[],
  template: CodeTemplate,
  modelClient: LanguageModel,
  databaseSchema?: JsonValue,
  projectId?: string
): Promise<string> {
  const settings = await getUserSettings();
  const tools: Record<string, any> = {};

  if (settings.webSearchEnabled) {
    tools.webSearch = createWebSearchTool({ enabled: true });
  }
  const systemPrompt = getUserIntentSystemPrompt(
    template,
    projectId,
    databaseSchema
  );
  const { text } = await generateText({
    model: modelClient,
    system: systemPrompt,
    tools,
    maxSteps: 3,
    messages: messages,
  });

  return text;
}

/**
 *
 * @param template the framework to use e.g. NextJS 14
 * @param modelClient the ai model client to use for generating the code
 * @param messages the historical messages in the conversation
 * @returns
 */
export async function runCodingAgentStream(
  template: CodeTemplate,
  modelClient: LanguageModel,
  messages: CoreMessage[],
  projectId?: string
) {
  const result = await streamObject({
    model: modelClient,
    schema: codeArtifactSchema,
    system: buildCodingAgentSystemPrompt(template, projectId),
    messages,
  });
  return result;
}
