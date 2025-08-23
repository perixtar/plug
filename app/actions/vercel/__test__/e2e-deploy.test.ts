import { checkDeploymentStatus, deployThroughFiles } from '../deploy'
import { FirestoreDB } from '@/constants/firestore-db'
import { codeArtifactSimpleApp } from '@/constants/sample-code-artifacts'
import { TemplateId } from '@/lib/generated/prisma'
import { describe, it } from 'vitest'

describe('parseGitignore', () => {
  it('deploy nextjs-14 boilerplate', async () => {
    const deployResult = await deployThroughFiles(
      codeArtifactSimpleApp,
      FirestoreDB,
      'test-user-id',
      'test-new-project-name',
      TemplateId.nextjs15_v1,
    )
    await checkDeploymentStatus(deployResult.vercelDeploymentId)
  }, 120000) // 2 minutes timeout
})
