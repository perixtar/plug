import templates from "./templates.json";
import { CodeTemplate, CodeTemplateMap } from "@/types/code-template";

export default templates;
export type Templates = typeof templates;
export type TemplateId = keyof typeof templates;

export function templatesToPrompt(templates: CodeTemplateMap) {
  return `${Object.entries(templates)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || "none"}. Dependencies installed: ${t.lib.join(", ")}. Port: ${t.port || "none"}. Available environment variables: ${t.envs.join(", ")}.`
    )
    .join("\n")}`;
}

export function templateToPrompt(template: CodeTemplate) {
  return `Template: "${template.instructions}". File: ${template.file || "none"}. Dependencies installed: ${template.lib.join(", ")}. Port: ${template.port || "none"}. Available environment variables: ${template.envs.join(", ")}.`;
}
