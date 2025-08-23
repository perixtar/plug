import {
  createFileObjectsRespectingGitignore,
  parseGitignore,
  shouldIgnore,
} from '../deploy'
import * as fs from 'fs'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// In order to run this test, you need the boilerplates folder and the next15 projects
describe('parseGitignore', () => {
  const basePath = './boilerplates/next'
  const gitignorePath = './boilerplates/next/.gitignore'
  const nonExistentPath = './non-existent/.gitignore'

  beforeEach(() => {
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when .gitignore file does not exist', () => {
    it('should return default exclusions', async () => {
      const result = await parseGitignore(nonExistentPath)

      expect(result).toEqual([
        'node_modules/**',
        '.next/**',
        '.vercel/**',
        'dist/**',
        'build/**',
        '*.log',
        '.env*',
        '!.env.example',
      ])
      expect(console.log).toHaveBeenCalledWith(
        'No .gitignore found, using default exclusions',
      )
    })
  })

  describe('when .gitignore file exists', () => {
    it('should parse the actual .gitignore file correctly', async () => {
      // Verify the file exists first
      expect(fs.existsSync(gitignorePath)).toBe(true)

      const result = await parseGitignore(gitignorePath)

      // Test specific patterns that should be generated from your .gitignore
      expect(result).toContain('node_modules')
      expect(result).toContain('.pnp')
      expect(result).toContain('coverage')
      expect(result).toContain('.next')
      expect(result).toContain('out')
      expect(result).toContain('build')
      expect(result).toContain('.DS_Store')
      expect(result).toContain('*.pem')
      expect(result).toContain('npm-debug.log*')
      expect(result).toContain('yarn-debug.log*')
      expect(result).toContain('yarn-error.log*')
      expect(result).toContain('.vercel')
      expect(result).toContain('*.tsbuildinfo')
      expect(result).toContain('next-env.d.ts')

      // Ensure comments are filtered out
      expect(result.every((pattern) => !pattern.startsWith('#'))).toBe(true)

      // Ensure no empty strings
      expect(result.every((pattern) => pattern.length > 0)).toBe(true)

      // Ensure no leading slashes remain
      expect(result.every((pattern) => !pattern.startsWith('/'))).toBe(true)
    })

    it('should correctly identify and transform directory patterns', async () => {
      const result = await parseGitignore(gitignorePath)

      expect(result).toContain('node_modules')
      expect(result).toContain('.pnp')
      expect(result).toContain('coverage')
      expect(result).toContain('.next')
      expect(result).toContain('out')
      expect(result).toContain('build')
      expect(result).toContain('.vercel')
    })

    it('should preserve file patterns without modification', async () => {
      const result = await parseGitignore(gitignorePath)

      // File patterns should remain as-is
      const filePatterns = result.filter((pattern) => !pattern.endsWith('/**'))
      expect(filePatterns).toContain('.DS_Store')
      expect(filePatterns).toContain('*.pem')
      expect(filePatterns).toContain('npm-debug.log*')
      expect(filePatterns).toContain('yarn-debug.log*')
      expect(filePatterns).toContain('yarn-error.log*')
      expect(filePatterns).toContain('*.tsbuildinfo')
      expect(filePatterns).toContain('next-env.d.ts')
    })

    it('should handle all patterns from the original .gitignore', async () => {
      // Read the actual file content to verify our expectations
      const actualContent = fs.readFileSync(gitignorePath, 'utf8')
      const originalLines = actualContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))

      const result = await parseGitignore(gitignorePath)

      // We should have processed all non-comment, non-empty lines
      expect(result.length).toBe(originalLines.length)

      // Log for debugging if needed
      console.log('Original patterns:', originalLines)
      console.log('Transformed patterns:', result)
    })

    it('should not contain any patterns with leading slashes', async () => {
      const result = await parseGitignore(gitignorePath)

      const patternsWithLeadingSlash = result.filter((pattern) =>
        pattern.startsWith('/'),
      )
      expect(patternsWithLeadingSlash).toEqual([])
    })

    it('should not contain any empty strings or whitespace-only patterns', async () => {
      const result = await parseGitignore(gitignorePath)

      const emptyOrWhitespace = result.filter((pattern) => !pattern.trim())
      expect(emptyOrWhitespace).toEqual([])
    })
  })

  describe('pattern transformation verification', () => {
    it('should transform specific patterns correctly', async () => {
      const result = await parseGitignore(gitignorePath)

      // Test specific transformations based on your .gitignore content
      const transformations = [
        { original: '/node_modules', expected: 'node_modules' },
        { original: '/.pnp', expected: '.pnp' },
        { original: '/coverage', expected: 'coverage' },
        { original: '/.next/', expected: '.next' },
        { original: '/out/', expected: 'out' },
        { original: '/build', expected: 'build' },
        { original: '.vercel', expected: '.vercel' },
      ]

      transformations.forEach(({ expected }) => {
        expect(result).toContain(expected)
      })
    })
  })

  describe('check if file should be ignored', () => {
    it('should ignore files based on patterns', async () => {
      const pattern = await parseGitignore(gitignorePath)
      console.log('Parsed patterns:', pattern)
      expect(await shouldIgnore(basePath + '/app', pattern)).toBe(false)
      expect(await shouldIgnore(basePath + '/node_modules', pattern)).toBe(true)
      expect(await shouldIgnore(basePath + '/node_modules/.bin', pattern)).toBe(
        true,
      )
      expect(await shouldIgnore(basePath + '/.next', pattern)).toBe(true)
      expect(await shouldIgnore(basePath + '/next-env.d.ts', pattern)).toBe(
        true,
      )
      expect(await shouldIgnore(basePath + '/package.json', pattern)).toBe(
        false,
      )
    })
  })

  describe('create vercel files object', () => {
    it('creates vercel files object with correct structure', async () => {
      const ignorePatterns = await parseGitignore(gitignorePath)
      const files = await createFileObjectsRespectingGitignore(
        basePath,
        ignorePatterns,
        basePath,
      )
      console.log('Created files object:', files)
    })
  })
})
