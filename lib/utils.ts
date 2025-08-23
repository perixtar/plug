import { TemplateId } from './generated/prisma'
import { CodeArtifact } from './schema'
import { CodeTemplate } from '@/types/code-template'
import { DeepPartial } from 'ai'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isFileInArray(file: File, existingFiles: File[]) {
  return existingFiles.some(
    (existing) =>
      existing.name === file.name &&
      existing.size === file.size &&
      existing.type === file.type,
  )
}

export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Parses a string into a member of the given enum.
 * Throws if the raw string isn't a valid key or value.
 */
export function parseEnum<
  E extends Record<string, string | number>,
  K extends keyof E = keyof E,
>(enumObj: E, raw: string): E[K] {
  // For string enums, allow matching values:
  const isValue = Object.values(enumObj).includes(raw as any)
  // For numeric enums, also allow matching keys:
  const isKey = raw in enumObj

  if (!isValue && !isKey) {
    throw new Error(`Invalid enum value: ${raw}`)
  }

  // If it’s a key, return enumObj[key]; otherwise it must already be a value
  return (isKey ? (enumObj as any)[raw] : raw) as E[K]
}

export function parseNavPagesFromCodeArtifact(
  template_id: TemplateId,
  artifact: DeepPartial<CodeArtifact> | undefined,
): string[] {
  if (!artifact || !artifact.code) {
    return []
  }
  return artifact.code
    .map((file) => {
      if (file?.file_path) {
        return convertFilePathToUrl(template_id, file.file_path)
      }
      return ''
    })
    .filter((url) => url !== '')
}

export function convertFilePathToUrl(
  template_id: TemplateId,
  filePath: string,
): string {
  switch (template_id) {
    case TemplateId.nextjs15_v1:
      return convertNextJSFilePathToUrl(filePath)
    default:
      throw new Error(`Unsupported template: ${template_id}`)
  }
}

/**
 * Convert a Next.js 14 app-file path into its URL route.
 *
 * @example
 *   fileToUrl('app/page.tsx')               // -> '/'
 *   fileToUrl('app/blog/page.tsx')          // -> '/blog'
 *   fileToUrl('app/blog/[slug]/page.tsx')   // -> '/blog/[slug]'
 *   fileToUrl('app/(admin)/users/page.tsx') // -> '/users'
 *   fileToUrl('app\\docs\\[...all]\\page.ts') // -> '/docs/[...all]'
 */
export function convertNextJSFilePathToUrl(filePath: string): string {
  // 1. Normalize slashes & trim leading `/`
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '')

  // 2. Must live under the app directory
  if (!normalized.startsWith('app/')) return ''

  // 3. Only page files are routable
  const pageRegex = /\/page\.(tsx|ts|jsx|js|mdx)$/
  if (!pageRegex.test(normalized)) return ''

  // 4. Strip off 'app' prefix and '/page.xxx' suffix
  let route = normalized
    .replace(/^app/, '') // remove leading "app"
    .replace(pageRegex, '') // remove trailing "/page.xxx"
    .replace(/\/$/, '') // trim any trailing slash

  // 5. Remove route-group segments: '/(group)' → ''
  route = route.replace(/\/\([^/]+\)/g, '')

  // 6. Root page
  if (route === '' || route === '/') return '/'

  // 7. Reject any dynamic or catch‑all segments
  if (/\[.+\]/.test(route)) return ''

  // 8. Ensure leading slash
  return route.startsWith('/') ? route : `/${route}`
}
