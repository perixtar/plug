"use server";

// import { addEnvVariablesToVercelProject, createAndGetProject } from ".";
import {
  cleanLocallySavedFiles,
  downloadFilesFromSandbox,
  getProjectDownloadDir,
  runCodeAndCommandsInSandbox,
} from "../e2b";
// import { decryptConfig } from "@/lib/encryption";
import { TemplateId, workspace_database } from "@/lib/generated/prisma";
import { CodeArtifact } from "@/lib/schema";
import { DeploymentResult } from "@/lib/types";
// import { DbType } from "@/types/database-type";
import { Vercel } from "@vercel/sdk";
// import { GetDeploymentResponseBodyStatus } from "@vercel/sdk/models/getdeploymentop.js";
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});

/**
 * Interface for Vercel deployment file object
 */
interface VercelFileObject {
  /** Relative path of the file from project root */
  file: string;
  /** Base64 encoded file content */
  data: string;
  /** Encoding type - always 'base64' for our use case */
  encoding: "base64";
  /** SHA1 hash of the file content for deduplication */
  sha: string;
}

export async function deployThroughFiles(
  codeArtifact: CodeArtifact,
  toolDbs: workspace_database[],
  userID: string,
  projectName: string,
  templateId: TemplateId,
  deploymentId?: string // use deploymentId for redeployment purpose
): Promise<DeploymentResult> {
  try {
    // 1. run code in sandbox
    const sandboxResult = await runCodeAndCommandsInSandbox(
      codeArtifact,
      toolDbs,
      userID
    );
    const sandboxId = sandboxResult.sandboxId;

    // 2. Download files from sandbox
    await cleanLocallySavedFiles(projectName);
    await downloadFilesFromSandbox(sandboxId, projectName, templateId);
    const projectPath = await getProjectDownloadDir(projectName, templateId);
    const gitignorePath = path.join(projectPath, ".gitignore");

    // 3. parse .gitignore
    console.log("📋 Parsing .gitignore...");
    const ignorePatterns = await parseGitignore(gitignorePath);

    console.log("\n📁 Scanning project files...");
    const files = await createFileObjectsRespectingGitignore(
      projectPath,
      ignorePatterns,
      projectPath
    );

    // console.log(`\n🚀 Deploying ${files.length} files to Vercel...`);
    // const project = await createAndGetProject(projectName);

    // const deployment = await vercel.deployments.createDeployment({
    //   skipAutoDetectionConfirmation: "1",
    //   requestBody: {
    //     name: projectName,
    //     target: "production",
    //     project: project.id,
    //     files: files,
    //     deploymentId: deploymentId,
    //     projectSettings: {
    //       framework: "nextjs",
    //       buildCommand: "npm run build",
    //       devCommand: "npm run dev",
    //       installCommand: "npm install",
    //       outputDirectory: ".next",
    //     },
    //     meta: {
    //       projectName: projectName,
    //       deployedFrom: "local-files",
    //       totalFiles: files.length.toString(),
    //       deploymentTime: new Date().toISOString(),
    //     },
    //   },
    // });

    // // create project env variables
    // const encryptedCred = toolDb.credential_zipped;
    // if (encryptedCred) {
    //   const dbConfig = await decryptConfig(DbType.Firestore, encryptedCred);
    //   if (dbConfig.type == DbType.Firestore) {
    //     await addEnvVariablesToVercelProject(
    //       {
    //         FIREBASE_PROJECT_ID: dbConfig.config.projectId,
    //         FIREBASE_ADMIN_CLIENT_EMAIL: dbConfig.config.clientEmail,
    //         FIREBASE_ADMIN_PRIVATE_KEY: dbConfig.config.privateKey,
    //         NEXT_PUBLIC_APP_URL: deployment.url,
    //       },
    //       project.id
    //     );
    //   }
    //     }

    //     console.log("\n🎉 Deployment successful!");
    //     console.log("🔗 URL:", deployment.url);
    //     console.log("📋 ID:", deployment.id);
    //     console.log("📊 Files deployed:", files.length);

    return {
      sbxId: sandboxId,
      sbxUrl: sandboxResult.sandboxUrl,
      vercelDeploymentId: sandboxId, // NOT RELEVANT FOR DEMO
      vercelPreviewUrl: sandboxResult.sandboxUrl,
    };
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// export async function checkDeploymentStatus(deploymentId: string) {
//   try {
//     let status: GetDeploymentResponseBodyStatus;
//     do {
//       // Fetch the latest deployment info
//       const { status: currentStatus } = await vercel.deployments.getDeployment({
//         idOrUrl: deploymentId,
//         withGitRepoInfo: "true",
//       });
//       status = currentStatus;
//       console.log(`Deployment status: ${status}`);

//       // If still building or initializing or queued, wait and retry
//       if (
//         status === "INITIALIZING" ||
//         status === "BUILDING" ||
//         status === "QUEUED"
//       ) {
//         await new Promise((r) => setTimeout(r, 5000));
//       } else {
//         break;
//       }
//     } while (true);
//     return status;
//   } catch (error) {
//     console.error("❌ Error fetching deployment status:", error);
//     throw error;
//   }
// }

export async function parseGitignore(gitignorePath: string): Promise<string[]> {
  try {
    await fs.access(gitignorePath);
  } catch {
    console.log("No .gitignore found, using default exclusions");
    return [
      "node_modules/**",
      ".next/**",
      ".vercel/**",
      "dist/**",
      "build/**",
      "*.log",
      ".env*",
      "!.env.example",
    ];
  }

  console.log(`📄 Reading .gitignore from: ${gitignorePath}`);

  const gitignoreContent = await fs.readFile(gitignorePath, "utf8");
  console.log("📋 Parsing .gitignore content...");

  return gitignoreContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((pattern) => {
      let normalizedPattern = pattern.startsWith("/")
        ? pattern.slice(1)
        : pattern;

      if (normalizedPattern.endsWith("/")) {
        return normalizedPattern.slice(0, -1);
      } else if (isLikelyDirectory(normalizedPattern)) {
        return normalizedPattern;
      }

      return normalizedPattern;
    });
}

function isLikelyDirectory(pattern: string): boolean {
  // Common directory patterns that don't end with /
  const knownDirs = [
    "node_modules",
    ".pnp",
    "coverage",
    "out",
    "build",
    ".vercel",
  ];

  // Check if it's a known directory or doesn't have a file extension
  return (
    knownDirs.includes(pattern) ||
    (!pattern.includes("*") && !pattern.includes(".") && !pattern.includes("!"))
  );
}

/**
 * Check if a file path should be ignored based on gitignore patterns
 */
export async function shouldIgnore(
  filePath: string,
  ignorePatterns: string[]
): Promise<boolean> {
  const normalizedPath = filePath.replace(/\\/g, "/");

  for (const pattern of ignorePatterns) {
    // Handle negation patterns (starting with !)
    if (pattern.startsWith("!")) {
      const positivePattern = pattern.slice(1);
      if (await matchesPattern(normalizedPath, positivePattern)) {
        return false; // Don't ignore this file
      }
      continue;
    }

    if (await matchesPattern(normalizedPath, pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple pattern matching for gitignore-style patterns
 */
async function matchesPattern(
  filePath: string,
  pattern: string
): Promise<boolean> {
  // Convert pattern to regex
  let regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");

  // Handle directory patterns
  if (pattern.includes("/")) {
    regexPattern = "^" + regexPattern;
  } else {
    // Pattern can match anywhere in the path
    regexPattern = "(^|/)" + regexPattern;
  }

  regexPattern += "(/.*)?$";

  const regex = new RegExp(regexPattern);
  return regex.test(filePath);
}

/**
 * Recursively scan directory and create file objects for deployment,
 * respecting gitignore patterns in a single pass
 */
export async function createFileObjectsRespectingGitignore(
  dirPath: string,
  ignorePatterns: string[],
  basePath: string,
  fileObjects: VercelFileObject[] = []
): Promise<VercelFileObject[]> {
  const items = await fs.readdir(dirPath);

  await Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(basePath, fullPath);

      // Skip if this path matches any ignore pattern
      if (await shouldIgnore(relativePath, ignorePatterns)) {
        console.log(`🚫 Ignoring: ${relativePath}`);
        return;
      }

      const fsStat = await fs.stat(fullPath);
      if (fsStat.isDirectory()) {
        // Recursively process directory
        await createFileObjectsRespectingGitignore(
          fullPath,
          ignorePatterns,
          basePath,
          fileObjects
        );
      } else {
        // Create file object directly
        try {
          const fileContent = await fs.readFile(fullPath);
          const hash = createHash("sha1").update(fileContent).digest("hex");

          const fileObject: VercelFileObject = {
            file: relativePath,
            data: fileContent.toString("base64"),
            encoding: "base64",
            sha: hash,
          };

          fileObjects.push(fileObject);
          console.log(`✅ Including: ${relativePath}`);
        } catch (error) {
          console.warn(`⚠️  Failed to read file: ${fullPath}`, error);
        }
      }
    })
  );

  return fileObjects;
}
