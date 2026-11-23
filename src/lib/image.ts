export function createImagePreviewUrl(file: File) {
  const previewUrl = URL.createObjectURL(file)
  if (previewUrl.startsWith('blob:')) return previewUrl

  URL.revokeObjectURL(previewUrl)
  return ''
}
