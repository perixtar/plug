import { DatabaseConfig } from "@/components/database-configs";
import { DbType } from "@/types/database-type";
import { Sandbox } from "@e2b/code-interpreter";

// Define an async function to copy the .env file into the sandbox.
export async function copyEnvFileToSandbox(
  sbx: Sandbox,
  dbConfig: DatabaseConfig,
  connection_envs: string[]
) {
  // Define the path to the local .env file.
  if (dbConfig.type != DbType.Firestore) {
    // db not supported yet
    return;
  }
  const isExcel = connection_envs.some((env) => env.includes("EXCEL"));
  let envVars;
  try {
    if (isExcel) {
      envVars = {
        EXCEL_FIREBASE_PROJECT_ID: dbConfig.config.projectId,
        EXCEL_FIREBASE_ADMIN_CLIENT_EMAIL: dbConfig.config.clientEmail,
        EXCEL_FIREBASE_ADMIN_PRIVATE_KEY: dbConfig.config.privateKey,
        EXCEL_NEXT_PUBLIC_APP_URL: "http://localhost:3000", // TODO: replace this with actual env for both sandbox and vercel
      };
    } else {
      envVars = {
        FIREBASE_PROJECT_ID: dbConfig.config.projectId,
        FIREBASE_ADMIN_CLIENT_EMAIL: dbConfig.config.clientEmail,
        FIREBASE_ADMIN_PRIVATE_KEY: dbConfig.config.privateKey,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000", // TODO: replace this with actual env for both sandbox and vercel
      };
    }
    const existing = await sbx.files.read(".env").catch(() => "");
    const fileContent = Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join("\n");

    const newContent = [existing.trim(), fileContent]
      .filter(Boolean)
      .join("\n");

    await sbx.files.write(".env", newContent);
  } catch (error) {
    console.error("Error writing .env content to sandbox:", error);
  }
}
