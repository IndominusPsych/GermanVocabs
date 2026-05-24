import { useEffect, useState } from 'react'

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'
const MY_MEMORY_URL = 'https://api.mymemory.translated.net/get'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const cacheKey = (text: string) => 'translation:v2:de-en:' + text

const translateWithGoogle = async (text: string, signal: AbortSignal) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'de',
    tl: 'en',
    dt: 't',
    q: text
  })

  const response = await fetch(GOOGLE_TRANSLATE_URL + '?' + params.toString(), {
    signal
  })

  if (!response.ok) {
    throw new Error('Google translation request failed')
  }

  const payload = await response.json()
  const translatedText = payload?.[0]
    ?.map((part: unknown[]) => part?.[0])
    .filter(Boolean)
    .join('')
    .trim()

  if (!translatedText) {
    throw new Error('Google translation missing')
  }

  return translatedText
}

const translateWithMyMemory = async (text: string, signal: AbortSignal) => {
  const params = new URLSearchParams({
    q: text,
    langpair: 'de|en'
  })

  const response = await fetch(MY_MEMORY_URL + '?' + params.toString(), {
    signal
  })

  if (!response.ok) {
    throw new Error('MyMemory translation request failed')
  }

  const payload = await response.json()
  const translatedText = payload?.responseData?.translatedText?.trim()

  if (!translatedText) {
    throw new Error('MyMemory translation missing')
  }

  return translatedText
}

const translate = async (text: string, signal: AbortSignal) => {
  try {
    return await translateWithGoogle(text, signal)
  } catch (error) {
    if (signal.aborted) {
      throw error
    }

    return translateWithMyMemory(text, signal)
  }
}

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

    translate(text, controller.signal)
      .then((translatedText) => {
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
