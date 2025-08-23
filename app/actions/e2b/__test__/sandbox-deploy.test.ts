import { getStdoutAndStderrFromSandbox, runCodeAndCommandsInSandbox } from '..'
import { FirestoreDB } from '@/constants/firestore-db'
import {
  codeArtifactWithBuildError,
  codeArtifactWithBuildError2,
  codeArtifactWithRuntimeError,
  codeArtifactWithShadcn,
} from '@/constants/sample-code-artifacts'
import { describe, expect, it } from 'vitest'

describe('deploy nextjs code to sandbox', () => {
  it('deploy sample nextjs code without build error in sandbox', async () => {
    const sbx = await runCodeAndCommandsInSandbox(
      codeArtifactWithShadcn,
      FirestoreDB,
      'test-user-id',
    )
    const std = await getStdoutAndStderrFromSandbox(sbx.sandboxId, new Date())
    console.log('stdout:', std.stdout)
  }, 120000) // 2 minutes timeout

  it('deploy sample nextjs code with build error', async () => {
    const sbx = await runCodeAndCommandsInSandbox(
      codeArtifactWithBuildError,
      FirestoreDB,
      'test-user-id',
    )
    const std = await getStdoutAndStderrFromSandbox(sbx.sandboxId, new Date())
    console.log('stdErr:', std.stderr)
  }, 120000) // 2 minutes timeout

  it('deploy sample nextjs code with continuous build errors', async () => {
    await runCodeAndCommandsInSandbox(
      codeArtifactWithBuildError,
      FirestoreDB,
      'test-user-id',
    )

    await runCodeAndCommandsInSandbox(
      codeArtifactWithBuildError2,
      FirestoreDB,
      'test-user-id',
    )
  }, 120000) // 2 minutes timeout

  it('deploy sample nextjs code with runtime error', async () => {
    const sbx = await runCodeAndCommandsInSandbox(
      codeArtifactWithRuntimeError,
      FirestoreDB,
      'test-user-id',
    )
    const std1 = await getStdoutAndStderrFromSandbox(sbx.sandboxId, new Date())
    console.log('stdErr:', std1.stderr)
  }, 120000) // 2 minutes timeout

  it('deploy sample nextjs code with continuous build errors', async () => {
    const sbx = await runCodeAndCommandsInSandbox(
      codeArtifactWithBuildError,
      FirestoreDB,
      'test-user-id',
    )
    const std1 = await getStdoutAndStderrFromSandbox(sbx.sandboxId, new Date())
    console.log('stdErr:', std1.stderr)

    await runCodeAndCommandsInSandbox(
      codeArtifactWithShadcn,
      FirestoreDB,
      'test-user-id',
      sbx.sandboxId,
    )
    const std2 = await getStdoutAndStderrFromSandbox(sbx.sandboxId, new Date())
    console.log('stdErr:', std2.stderr)
  }, 120000) // 2 minutes timeout
})
