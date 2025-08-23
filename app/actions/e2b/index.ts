"use server";

import { parseAndGetLogsSince } from "@/lib/e2b";
import { decryptConfig } from "@/lib/encryption";
import { TemplateId, workspace_database } from "@/lib/generated/prisma";
import { copyEnvFileToSandbox } from "@/lib/sandbox-utils";
import { CodeArtifact } from "@/lib/schema";
import { DbType } from "@/types/database-type";
import { StdLogEntry } from "@/types/std-log-entry";
import { Sandbox } from "@e2b/code-interpreter";
import fs from "fs/promises";
import path from "path";

const sandboxRequestTimeout = 30 * 60 * 100; // 3 minutes in ms

export async function runCodeAndCommandsInSandbox(
  codeArtifact: CodeArtifact,
  toolDbs: workspace_database[],
  userID: string,
  sandboxId?: string // use sandboxId for redeployment purpose
) {
  let sbx: Sandbox;
  if (sandboxId) {
    sbx = await Sandbox.connect(sandboxId);
  } else {
    sbx = await Sandbox.create("nextjs15-v1", {
      metadata: { template: "nextjs15-v1", userID: userID },
      requestTimeoutMs: sandboxRequestTimeout,
    });
  }

  // Install packages
  if (
    codeArtifact.has_additional_dependencies &&
    codeArtifact.install_dependencies_command
  ) {
    await sbx.commands.run(codeArtifact.install_dependencies_command, {
      requestTimeoutMs: sandboxRequestTimeout,
    });
  }

  // Copy code to fs
  if (codeArtifact.code && Array.isArray(codeArtifact.code)) {
    const filesToWrite = codeArtifact.code.map((file) => ({
      path: file.file_path,
      data: file.file_content,
    }));
    await sbx.files.write(filesToWrite, {
      requestTimeoutMs: sandboxRequestTimeout,
    });
  } else {
  }
  for (const toolDb of toolDbs) {
    const encryptedCred = toolDb.credential_zipped;
    console.log("ready to copy env file to sandbox", sbx.sandboxId);
    if (encryptedCred) {
      const dbConfig = await decryptConfig(DbType.Firestore, encryptedCred);
      await copyEnvFileToSandbox(sbx, dbConfig, toolDb.connection_envs);
    }
  }

  return {
    sandboxId: sbx.sandboxId,
    sandboxUrl: `https://${sbx?.getHost(3000)}`,
  };
}

export async function getStdoutAndStderrFromSandbox(
  sandbox_id: string,
  afterTime: Date
): Promise<{ stdout: StdLogEntry[]; stderr: StdLogEntry[] }> {
  const sbx = await Sandbox.connect(sandbox_id);

  // Sleep for 10 seconds to make sure the logs in console is written to next.stderr.log and next.stdout.log
  await new Promise((resolve) => setTimeout(resolve, 10000));
  // Read stderr and stdout logs
  let stderrFileContent = "";
  try {
    stderrFileContent = await sbx.files.read("next.stderr.log");
  } catch (error) {
    console.warn(
      `Sandbox ${sandbox_id} does not have next.stderr.log file. It might be a new sandbox or the file was not created.`
    );
  }
  let stdoutFileContent = "";
  try {
    stdoutFileContent = await sbx.files.read("next.stdout.log");
  } catch (error) {
    console.warn(
      `Sandbox ${sandbox_id} does not have next.stdout.log file. It might be a new sandbox or the file was not created.`
    );
  }
  const stderr = parseAndGetLogsSince(stderrFileContent, afterTime);
  const stdout = parseAndGetLogsSince(stdoutFileContent, afterTime);

  return {
    stderr: stderr,
    stdout: stdout,
  };
}

/**
 * Download files of the project from sandbox and save them to a temporary directory (/tmp/{sandbox_id}/<file_path>).
 * @param sandbox_id
 * @param sandbox_path
 */
export async function downloadFilesFromSandbox(
  sandbox_id: string,
  tool_id: string,
  templateId: TemplateId,
  sandbox_path: string = "/home/user"
): Promise<void> {
  const sbx = await Sandbox.connect(sandbox_id);
  const download_dir = await getProjectDownloadDir(tool_id, templateId);

  // Download all dirs/files from the sandbox
  const files = await sbx.files.list(sandbox_path);

  for (const file of files) {
    if (
      file.name === "node_modules" ||
      file.name === ".next" ||
      file.name === ".npm" ||
      file.name === ".git" ||
      file.name === ".bash_logout" ||
      file.name === ".bashrc" ||
      file.name === ".profile"
    ) {
      continue;
    }
    const new_sandbox_path = path.join(sandbox_path, file.name);
    if (String(file.type) == "dir") {
      await downloadFilesFromSandbox(
        sandbox_id,
        tool_id,
        templateId,
        new_sandbox_path
      );
    } else if (String(file.type) == "file") {
      // create new file path by spliting by "/" and remove the last element
      const file_path_parts = file.path.split("/");
      // remove the first 2 elements since they are "["", "home", "user"]"
      file_path_parts.splice(0, 3); // remove "/home/user"
      const file_path = file_path_parts.join("/");
      file_path_parts.pop(); // remove the last element (file name)
      // create the directory if it doesn't exist
      const download_directory_path = path.join(
        download_dir,
        file_path_parts.join("/")
      );
      await fs.mkdir(download_directory_path, { recursive: true });
      // read content from file
      const content = await sbx.files.read(file.path);
      // save the file to download path
      const file_download_path = path.join(download_dir, file_path);
      //   console.log('Writing file to path: ', download_directory_path)
      fs.writeFile(file_download_path, Buffer.from(content));
    }
  }
}

/**
 * Remove the files that is saved locally in /tmp/{sandbox_id}/ if there is any
 * @param sandbox_id
 */
export async function cleanLocallySavedFiles(tool_id: string): Promise<void> {
  const temp_dir = await getProjectDownloadDir(tool_id);
  try {
    await fs.rm(temp_dir, { recursive: true, force: true });
    console.log(`Cleaned up temporary directory: ${temp_dir}`);
  } catch (err) {
    console.log(`Files are already removed from ${temp_dir}`, err);
  }
}

export async function getProjectDownloadDir(
  tool_id: string,
  templateId?: TemplateId
) {
  switch (templateId) {
    case TemplateId.nextjs15_v1:
      return `/tmp/${tool_id}/nextjs-app`;
    default:
      return `/tmp/${tool_id}`;
  }
}
