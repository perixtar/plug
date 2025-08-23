'use server'

import {
  cleanLocallySavedFiles,
  downloadFilesFromSandbox,
  getProjectDownloadDir,
} from '../e2b'
import { uploadNextjsProjectToGitHub } from '../github'
import { GitHubConfig } from '@/constants/github'
import { TemplateId } from '@/lib/generated/prisma'
import { Vercel } from '@vercel/sdk'
import { CreateDeploymentResponseBody } from '@vercel/sdk/models/createdeploymentop.js'
import { CreateProjectResponseBody } from '@vercel/sdk/models/createprojectop.js'

const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
})

/**
 * Download the files from E2B sandbox, upload to GitHub, create a Vercel project and deploy it.
 * @param sandbox_id E2B sandbox id which used for download the project file
 * @param tool_id the identifier of the tool, also used as the project name in Vercel and repo name in GitHub
 */
export async function deploy(
  sandbox_id: string,
  tool_id: string,
): Promise<string> {
  // clean the temp directory before download
  await cleanLocallySavedFiles(tool_id)
  // start download files
  await downloadFilesFromSandbox(sandbox_id, tool_id, TemplateId.nextjs15_v1)
  const project_dir = await getProjectDownloadDir(tool_id)
  await uploadNextjsProjectToGitHub({
    owner: GitHubConfig.username,
    repoName: tool_id, // only upload if current_tool_id is set and use "user_name + tool_id" as repo name
    projectDir: project_dir,
  })
  // create vercel project
  await createAndGetProject(tool_id)
  // create vercel deployment
  const deployment = await createAndCheckDeployment(
    tool_id, // project_name
    tool_id, // repo
  )
  // clean the temp directory after deployment
  await cleanLocallySavedFiles(tool_id)
  return deployment.url
}

/**
 * Create deployment on vercel which trigger from github
 * @param project_name
 * @param repo
 */
export async function createAndCheckDeployment(
  project_name: string,
  repo: string,
): Promise<CreateDeploymentResponseBody> {
  try {
    // Create a new deployment
    const createResponse = await vercel.deployments.createDeployment({
      requestBody: {
        name: project_name, //The project name used in the deployment URL
        target: 'production',
        gitSource: {
          type: 'github',
          repo: repo, // repo name
          ref: 'main',
          org: GitHubConfig.username, //For a personal account, the org-name is your GH username
        },
        projectSettings: {
          buildCommand: 'next build',
          installCommand: 'npm install',
        },
      },
    })
    return createResponse
  } catch (error) {
    console.error(
      error instanceof Error
        ? `Deployment Error: ${error.message}`
        : String(error),
    )
    throw error
  }
}

/**
 * Create vercel project
 * @param project_name
 */
export async function createAndGetProject(
  project_name: string,
): Promise<CreateProjectResponseBody> {
  // check if the project already exists
  const existingProject = await vercel.projects.getProjects({
    limit: '1',
    search: project_name,
  })
  if (existingProject.projects.length > 0) {
    console.log(`Project already exists: ${existingProject.projects[0].id}`)
    return existingProject.projects[0]
  }
  const createResponse = await vercel.projects.createProject({
    requestBody: {
      name: project_name,
      framework: 'nextjs',
    },
  })

  // turn off deployment protection
  await vercel.projects.updateProject({
    idOrName: createResponse.id,
    requestBody: {
      ssoProtection: null, // Disable SSO protection for deployments
      passwordProtection: null, // Disable password protection for deployments
    },
  })
  console.log(`Project created: ${createResponse.id}`)
  return createResponse
}

export async function addEnvVariablesToVercelProject(
  envs: Record<string, string>,
  projectId: string,
) {
  const promises = Object.entries(envs).map(([key, value]) =>
    vercel.projects.createProjectEnv({
      idOrName: projectId,
      upsert: 'true',
      requestBody: {
        key,
        value,
        type: 'plain',
        target: ['production'],
      },
    }),
  )
  try {
    await Promise.all(promises)
    console.log('All environment variables set successfully!')
  } catch (err) {
    console.error('One or more env uploads failed', err)
  }
}

// async function getProject(project_name: string) {
//   const options = {
//     method: 'GET',
//     headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
//   }

//   fetch(`https://api.vercel.com/v9/projects/${project_name}`, options)
//     .then((response) => response.json())
//     .then((response) => console.log(response))
//     .catch((err) => console.error(err))
// }

// Project Details: {
//   "accountId": "team_YsPe3Rv9tFlgyINyAk7eRk3a",
//   "autoExposeSystemEnvs": true,
//   "autoAssignCustomDomains": true,
//   "autoAssignCustomDomainsUpdatedBy": "system",
//   "buildCommand": null,
//   "createdAt": 1748753128361,
//   "devCommand": null,
//   "directoryListing": false,
//   "installCommand": null,
//   "framework": "nextjs",
//   "gitForkProtection": true,
//   "gitLFS": false,
//   "id": "prj_DStZI1ZgPo92aVWCrAsGXX92ltvi",
//   "latestDeployments": [],
//   "name": "iz2epe9c4w8y3ive3cpok-9f2c9b1b",
//   "nodeVersion": "22.x",
//   "outputDirectory": null,
//   "productionDeploymentsFastLane": true,
//   "publicSource": null,
//   "resourceConfig": {
//     "fluid": true,
//     "functionDefaultRegions": [
//       "iad1"
//     ]
//   },
//   "defaultResourceConfig": {
//     "fluid": true,
//     "functionDefaultRegions": [
//       "iad1"
//     ],
//     "functionDefaultTimeout": 300,
//     "functionDefaultMemoryType": "standard",
//     "functionZeroConfigFailover": false,
//     "elasticConcurrencyEnabled": false
//   },
//   "rootDirectory": null,
//   "serverlessFunctionRegion": "iad1",
//   "skewProtectionMaxAge": 43200,
//   "sourceFilesOutsideRootDirectory": true,
//   "enableAffectedProjectsDeployments": true,
//   "ssoProtection": {
//     "deploymentType": "prod_deployment_urls_and_all_previews"
//   },
//   "targets": {},
//   "updatedAt": 1748753128361,
//   "live": false,
//   "lastRollbackTarget": null,
//   "lastAliasRequest": null,
//   "gitComments": {
//     "onPullRequest": true,
//     "onCommit": false
//   },
//   "gitProviderOptions": {
//     "createDeployments": "enabled"
//   },
//   "oidcTokenConfig": {
//     "enabled": true,
//     "issuerMode": "team"
//   }
// }
