import { useCallback, useState } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Initialize voices
  const getVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
    return availableVoices;
  }, []);

  // Get preferred voice (female Indian English voice if available)
  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    const allVoices = voices.length ? voices : getVoices();
    
    // Try to find an Indian English female voice
    let preferredVoice = allVoices.find(voice => 
      voice.lang.includes('en-IN') && voice.name.toLowerCase().includes('female')
    );
    
    // Fallback to any English female voice
    if (!preferredVoice) {
      preferredVoice = allVoices.find(voice => 
        voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
      );
    }
    
    // Fallback to any English voice
    if (!preferredVoice) {
      preferredVoice = allVoices.find(voice => voice.lang.includes('en'));
    }
    
    // Final fallback to any available voice
    return preferredVoice || allVoices[0] || null;
  }, [voices, getVoices]);

  // Speak text
  const speak = useCallback((text: string, rate = 1, pitch = 1) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPreferredVoice();
    
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  }, [getPreferredVoice]);

  // Stop speaking
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    getVoices
  };
};

export default useTextToSpeech;
