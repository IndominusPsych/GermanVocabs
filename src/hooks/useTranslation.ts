import { useEffect, useState } from 'react'

const API_URL = 'https://api.mymemory.translated.net/get'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const cacheKey = (text: string) => `translation:de-en:${text}`

export function useTranslation(text?: string) {
  const [translation, setTranslation] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (!text) {
      setTranslation('')
      setStatus('idle')
      return
    }

    const cached = localStorage.getItem(cacheKey(text))
    if (cached) {
      setTranslation(cached)
      setStatus('ready')
      return
    }

    const controller = new AbortController()
    setStatus('loading')
    setTranslation('')

    const params = new URLSearchParams({
      q: text,
      langpair: 'de|en'
    })

    fetch(`${API_URL}?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Translation request failed')
        }

        return response.json()
      })
      .then((payload) => {
        const translatedText = payload?.responseData?.translatedText?.trim()

        if (!translatedText) {
          throw new Error('Translation missing')
        }

        localStorage.setItem(cacheKey(text), translatedText)
        setTranslation(translatedText)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStatus('error')
        }
      })

    return () => controller.abort()
  }, [text])

  return { translation, status }
}
