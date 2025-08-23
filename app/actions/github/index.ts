'use server'

import { getAllFilePaths } from '../fs'
import { Octokit } from '@octokit/rest'
import { promises as fs } from 'fs'
import path from 'path'

type UploadNextjsProjectOptions = {
  owner: string // Your GitHub username or org
  repoName: string // Desired name of the new repo
  projectDir: string // Absolute path to your local Next.js project root
  defaultBranch?: string // e.g. "main" (default)
}

/**
 * 1. Creates a new GitHub repo under `owner` with name `repoName`.
 * 2. Walks `projectDir` and pushes all files to that repo, under `defaultBranch`.
 */
export async function uploadNextjsProjectToGitHub(
  options: UploadNextjsProjectOptions,
) {
  const { owner, repoName, projectDir, defaultBranch = 'main' } = options

  // 1) Initialize Octokit with your PAT (from env)
  if (!process.env.GITHUB_API_KEY) {
    throw new Error('Missing GITHUB_API_KEY in environment variables.')
  }
  const octokit = new Octokit({
    auth: process.env.GITHUB_API_KEY,
    userAgent: 'NextJS-GitHub-Uploader/1.0.0',
  })

  // 2) Create the repository
  //    If the repo already exists, you can skip this or catch the 422 error
  try {
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: true, // set to true if you want a private repo
      description: `Dynamically created by Next.js upload action`,
    })
    console.log(`✅ Repository "${owner}/${repoName}" created successfully.`)
  } catch (err: any) {
    if (err.status === 422) {
      console.warn(
        `⚠️ Repo "${owner}/${repoName}" already exists. Skipping creation.`,
      )
    } else {
      throw err
    }
  }

  // 3) Get SHA of default branch
  let baseCommitSha: string | null = null
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    })
    // If branch exists, record its latest commit SHA
    baseCommitSha = refData.object.sha
  } catch (_error) {
    // If branch doesn't exist, we’ll create it from scratch (no base sha)
    baseCommitSha = null
  }

  // 4) Walk projectDir to get all file paths
  const filePaths = await getAllFilePaths(projectDir)
  console.log(`Found all file paths ${filePaths}`)
  console.log('directory path: ', projectDir)

  // 5) For each file, read its contents and push it to GitHub.
  //    We'll use "createOrUpdateFileContents" so that if the file already
  //    exists (in case of re-uploads) it simply updates it.
  //
  //    NOTE: GitHub API requires the file content to be base64-encoded.
  for (const absoluteFilePath of filePaths) {
    // 5a) Determine the relative path inside the repo.
    //     e.g. if projectDir="/Users/jason/my-next-app" and
    //     absoluteFilePath="/Users/jason/my-next-app/pages/index.tsx",
    //     then `relativePathInRepo` = "pages/index.tsx"
    const relativePathInRepo = path
      .relative(projectDir, absoluteFilePath)
      .replace(/\\/g, '/')

    // 5b) Read file and encode to base64
    const buffer = await fs.readFile(absoluteFilePath)
    const contentBase64 = buffer.toString('base64')

    // 5c) Try to fetch existing file (to get its “sha”) so we can update instead of creating duplicates
    let existingFileSha: string | undefined
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: relativePathInRepo,
        ref: defaultBranch,
      })
      if (Array.isArray(fileData) === false && fileData.sha) {
        existingFileSha = fileData.sha
      }
    } catch (getErr: any) {
      // If status 404, file does not exist yet → we'll create it
      if (getErr.status === 404) {
        existingFileSha = undefined
      } else {
        throw getErr
      }
    }

    // 5d) Create or update file
    const commitMessage = existingFileSha
      ? `chore: update ${relativePathInRepo}`
      : `chore: add ${relativePathInRepo}`

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: relativePathInRepo,
      message: commitMessage,
      content: contentBase64,
      sha: existingFileSha, // undefined if new file
      branch: defaultBranch,
    })

    console.log(`👉 Pushed ${relativePathInRepo}`)
  }

  // 6) If defaultBranch didn’t exist before, we need to create it from the first commit.
  //    However, because createOrUpdateFileContents will automatically create the branch
  //    on first file upload (if it didn’t exist), we do not need an extra step here.
  //    (Octokit handles creating the default branch for you.)

  return {
    success: true,
    message: `All ${filePaths.length} files from "${projectDir}" have been uploaded to ${owner}/${repoName}.`,
  }
}
