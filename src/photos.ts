export const MAX_PHOTOS_PER_PROJECT = 10
const MAX_EDGE = 2048
const JPEG_QUALITY = 0.85

export async function optimizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('画像ファイルを選択してください。')
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d')?.drawImage(image.source, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  image.close()
  if (!blob) throw new Error('写真をアプリ用に準備できませんでした。')
  return blob
}

async function loadImage(file: File): Promise<{ width: number; height: number; source: CanvasImageSource; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file)
      return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() }
    } catch { /* Safariの画像デコーダーへフォールバック */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('この形式の写真は読み込めませんでした。'))
      element.src = url
    })
    return { width: image.naturalWidth, height: image.naturalHeight, source: image, close: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
