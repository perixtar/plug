'use server'

import archiver from 'archiver'
import { exec } from 'child_process'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

export async function collectFiles(dir: string, arrayOfFiles: string[] = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(fullPath, arrayOfFiles)
    } else if (entry.isFile()) {
      arrayOfFiles.push(fullPath)
    }
  }
  return arrayOfFiles
}

export async function zipDirectory(
  sourceDir: string,
  outputZipPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Create output stream for the ZIP file
    const output = createWriteStream(outputZipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))

    archive.pipe(output)
    // Append entire folder contents. `false` means “don’t include the root folder itself, only its contents.”
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

/**
 * Helper: run a shell command in a given working directory and return a Promise.
 */
export async function runCommand(
  command: string,
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject({ error: err, stdout, stderr })
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

export async function getAllFilePaths(baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(baseDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name)

    // Skip node_modules, .git, etc. (adjust as needed)
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue
    }

    if (entry.isDirectory()) {
      const nested = await getAllFilePaths(fullPath)
      files.push(...nested)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}
