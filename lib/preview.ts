export function previewUrl(resultUrl: string | undefined, currentPage: string) {
  if (!resultUrl) {
    return ''
  }
  if (!resultUrl.endsWith('/') && !currentPage.startsWith('/')) {
    resultUrl += '/'
  }
  if (!resultUrl.startsWith('https://')) {
    resultUrl = `https://${resultUrl}`
  }
  return `${resultUrl}${currentPage}`
}
