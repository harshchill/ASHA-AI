export type SupportedLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'bengali';

export function detectLanguage(text: string): SupportedLanguage {
  // Check for Hindi characters (Devanagari)
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  
  // Check for Tamil characters
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';
  
  // Check for Telugu characters
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  
  // Check for Kannada characters
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  
  // Check for Bengali characters
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  
  // Default to English
  return 'english';
}

export function getLanguageSpecificError(language: SupportedLanguage): string {
  const errors = {
    hindi: "मुझे खेद है, मैं इस समय आपके करियर से संबंधित प्रश्न को संसाधित नहीं कर सकती। कृपया थोड़ी देर बाद फिर से प्रयास करें।",
    tamil: "மன்னிக்கவும், நான் தற்போது உங்கள் வேலை தொடர்பான வினவலை செயலாக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    telugu: "క్షమించండి, నేను ప్రస్తుతం మీ ఉద్యోగ సంబంధిత ప్రశ్నను ప్రాసెస్ చేయలేకపోతున్నాను. దయచేసి కొద్ది సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
    kannada: "ಕ್ಷಮಿಸಿ, ನಾನು ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಉದ್ಯೋಗ ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    bengali: "দুঃখিত, আমি এই মুহূর্তে আপনার কর্মসংক্রান্ত প্রশ্ন প্রক্রিয়া করতে পারছি না। দয়া করে কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    english: "I'm sorry, I couldn't process your job-related query at the moment. Please try again shortly."
  };
  return errors[language] || errors.english;
}
