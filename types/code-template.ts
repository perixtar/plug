export type CodeTemplateMap = {
  'nextjs15-v1': {
    name: string
    lib: string[]
    file: string
    instructions: string
    port: number
    envs: string[]
  }
}

export type CodeTemplate = {
  name: string
  lib: string[]
  file: string
  instructions: string
  port: number
  envs: string[]
}
