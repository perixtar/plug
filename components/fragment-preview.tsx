'use client'

import { CodeArtifactWebview } from './fragment-web'

export function CodeArtifactPreview() {
  // if we need to run script, this can be used
  // if (result.template === 'code-interpreter-v1') {
  //   return <FragmentInterpreter result={result} />
  // }

  return <CodeArtifactWebview />
}
