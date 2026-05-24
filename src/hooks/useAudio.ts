export const speakGerman = (text: string) => {
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.86
  speechSynthesis.speak(utterance)
}
