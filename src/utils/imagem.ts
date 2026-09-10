/** Converte uma URL (http, blob ou data) em data URL. Retorna null em caso de falha. */
export async function urlParaDataUrl(url: string): Promise<string | null> {
  try {
    if (url.startsWith('data:')) return url
    const resp = await fetch(url)
    if (!resp.ok) return null
    const blob = await resp.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
