/** Dispara o download de um Blob no navegador. */
export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Compartilha um arquivo pela folha de compartilhamento do sistema (Web Share API,
 * disponível principalmente no celular). Retorna false se não for possível.
 */
export async function compartilharArquivo(
  blob: Blob,
  nomeArquivo: string,
  titulo: string,
): Promise<boolean> {
  try {
    const file = new File([blob], nomeArquivo, { type: blob.type || 'application/pdf' })
    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean
      share?: (data: unknown) => Promise<void>
    }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: titulo })
      return true
    }
  } catch {
    /* usuário cancelou ou não suportado */
  }
  return false
}

/** Link "wa.me" para enviar um texto pelo WhatsApp. */
export function linkWhatsApp(texto: string, telefone?: string | null): string {
  const numero = (telefone ?? '').replace(/\D/g, '')
  const base = numero ? `https://wa.me/${numero.length <= 11 ? '55' + numero : numero}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(texto)}`
}
