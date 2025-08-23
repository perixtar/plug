import { getDatabaseFromTool } from "@/app/actions/tool/get-tools";
import { getAIModelById } from "@/lib/models";
import { generateText, tool, LanguageModel } from "ai";
import { z } from "zod";
import Exa from "exa-js";

export const exa = new Exa(process.env.EXA_API_KEY);

const logToConsoleTool = tool({
  description: "Logs a message to the console",
  parameters: z.object({
    message: z.string().describe("The message to log to the console"),
  }),
  execute: async ({ message }) => {
    console.log("Tool log:", message);
    return `Logged to console: ${message}`;
  },
});

const qnaTool = tool({
  description: "Answer question based on the provided context",
  parameters: z.object({
    question: z.string().describe("The question to answer"),
    context: z
      .string()
      .optional()
      .describe("Optional context to help answer the question"),
  }),
  execute: async ({ question, context }) => {
    const model = getAIModelById("claude-3-5-sonnet-latest");
    // call LLM to generate an answer based on the question
    await generateText({
      model: model as LanguageModel,
      prompt: `Question: ${question}\nContext: ${context || ""}\nAnswer:`,
    });
  },
});

const findRelevantTables = tool({
  description:
    "Find relevant database tables or collections based on user message",
  parameters: z.object({
    currentProjectId: z.string().describe("Current project ID"),
    message: z.string().describe("User message to find relevant collections"),
  }),
  execute: async ({ currentProjectId, message }) => {
    console.log("Finding relevant tables for project:", currentProjectId);
    return await getDatabaseFromTool(currentProjectId);
  },
});

const findRelevantFiles = tool({
  description:
    "Given a user message, find all the relevant files for the coding agent",
  parameters: z.object({
    currentProjectId: z.string().describe("Current project ID"),
    message: z.string().describe("User message to find relevant files"),
  }),
  execute: async ({ currentProjectId, message }) => {
    const model = getAIModelById("claude-3-5-sonnet-latest");
    // call LLM to find relevant files
  },
});

export function createWebSearchTool({ enabled }: { enabled: boolean }) {
  return tool({
    description: "Search the web for up-to-date information",
    parameters: z.object({
      query: z.string().min(1).max(100).describe("The search query"),
    }),
    execute: async ({ query }) => {
      if (!enabled) {
        // Hard stop: prevents accidental use if the tool is ever registered.
        throw new Error("Web search is disabled by user settings.");
      }

      const { results } = await exa.searchAndContents(query, {
        livecrawl: "always",
        numResults: 3,
      });

      return results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.text.slice(0, 2000),
        publishedDate: r.publishedDate,
      }));
    },
  });
}

type NormalizedImage = {
  id: string;
  src: string; // full/regular size URL
  thumb: string; // small/thumbnail URL
  width: number;
  height: number;
  alt: string;
  authorName?: string;
  authorUrl?: string;
  attribution?: string; // e.g., "Photo by X on Unsplash"
  source: "unsplash" | "pexels";
};

async function searchUnsplash(
  query: string,
  count: number,
  orientation?: string,
  color?: string
): Promise<NormalizedImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY is not set");

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(count));
  if (orientation) url.searchParams.set("orientation", orientation);
  if (color) url.searchParams.set("color", color);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`Unsplash error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  return (data.results ?? []).map(
    (p: any): NormalizedImage => ({
      id: String(p.id),
      src: p.urls?.regular ?? p.urls?.full ?? "",
      thumb: p.urls?.small ?? p.urls?.thumb ?? "",
      width: p.width,
      height: p.height,
      alt: p.alt_description ?? p.description ?? "Unsplash image",
      authorName: p.user?.name,
      authorUrl: p.user?.links?.html,
      attribution: p.user?.name
        ? `Photo by ${p.user.name} on Unsplash`
        : "Unsplash",
      source: "unsplash",
    })
  );
}

export const imageSearch = tool({
  description:
    "Find beautiful, relevant stock images for UI (Unsplash default).",
  parameters: z.object({
    query: z
      .string()
      .min(1)
      .max(100)
      .describe(
        'Search keywords to find images, e.g. "modern SaaS dashboard background"'
      ),
    count: z
      .number()
      .int()
      .min(1)
      .max(12)
      .default(6)
      .describe("How many images to return"),
    orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
    color: z
      .string()
      .optional()
      .describe('Unsplash color hint, e.g. "blue", "black", "teal"'),
    provider: z.enum(["unsplash", "pexels"]).default("unsplash"),
  }),
  execute: async ({ query, count, orientation, color, provider }) => {
    // default to Unsplash
    return await searchUnsplash(query, count, orientation, color);
  },
});
