import { convertNextJSFilePathToUrl, isFileInArray, parseEnum } from '../utils'
import { describe, it, expect } from 'vitest'

describe('convertNextJSFilePathToUrl', () => {
  it('should convert app/page.tsx to /', () => {
    expect(convertNextJSFilePathToUrl('app/page.tsx')).toBe('/')
  })

  it('should convert app/blog/page.tsx to /blog', () => {
    expect(convertNextJSFilePathToUrl('app/blog/page.tsx')).toBe('/blog')
  })

  it('if the path contains variable, we dont consider this navigational url', () => {
    expect(convertNextJSFilePathToUrl('app/blog/[slug]/page.tsx')).toBe('')
  })

  it('should convert app/(admin)/users/page.tsx to /users', () => {
    expect(convertNextJSFilePathToUrl('app/(admin)/users/page.tsx')).toBe(
      '/users',
    )
  })

  it('should convert app\\docs\\[...all]\\page.ts to ""', () => {
    expect(convertNextJSFilePathToUrl('app\\docs\\[...all]\\page.ts')).toBe('')
  })

  it('should handle root app folder without trailing slash', () => {
    expect(convertNextJSFilePathToUrl('app/')).toBe('')
  })

  it('should handle files without extensions', () => {
    expect(convertNextJSFilePathToUrl('app/blog/page')).toBe('')
  })

  it('api route should not be navigational url', () => {
    expect(convertNextJSFilePathToUrl('app/api/hello/route.ts')).toBe('')
  })

  it('layout should not be navigational url', () => {
    expect(convertNextJSFilePathToUrl('app/blog/layout.tsx')).toBe('')
  })
})
