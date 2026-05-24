const preferredVoiceNames = [
  'Google Deutsch',
  'Microsoft Katja',
  'Microsoft Conrad',
  'Anna',
  'Markus'
]

const naturalVoiceTerms = ['natural', 'neural', 'premium', 'enhanced']

let selectedGermanVoice: SpeechSynthesisVoice | undefined

const getGermanVoice = () => {
  if (selectedGermanVoice) {
    return selectedGermanVoice
  }

  const voices = speechSynthesis.getVoices()
  const germanVoices = voices.filter((voice) => voice.lang.startsWith('de'))

  selectedGermanVoice =
    preferredVoiceNames
      .map((name) =>
        germanVoices.find((voice) =>
          voice.name.toLowerCase().includes(name.toLowerCase())
        )
      )
      .find(Boolean) ??
    germanVoices.find((voice) =>
      naturalVoiceTerms.some((term) =>
        voice.name.toLowerCase().includes(term)
      )
    ) ??
    germanVoices.find((voice) => voice.lang === 'de-DE') ??
    germanVoices[0]

  return selectedGermanVoice
}

if ('speechSynthesis' in window) {
  speechSynthesis.addEventListener('voiceschanged', () => {
    selectedGermanVoice = undefined
    getGermanVoice()
  })
}

export const speakGerman = (text: string) => {
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.voice = getGermanVoice() ?? null
  utterance.rate = 0.82
  utterance.pitch = 1.2
  utterance.volume = 0.92

  speechSynthesis.speak(utterance)
}
