import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported languages
export type SupportedLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'bengali';

// Define language translations for UI elements
type Translations = {
  [key in SupportedLanguage]: {
    welcomeMessage: string;
    inputPlaceholder: string;
    sendButton: string;
    clearButton: string;
    keyPointsLabel: string;
    newChatLabel: string;
    loadingMessage: string;
    supportPhrases: {
      lowConfidence: string;
      mediumConfidence: string;
      highConfidence: string;
    };
  };
};

// All translations
const translations: Translations = {
  english: {
    welcomeMessage: 'Namaste 🙏🏻! I\'m Asha AI, your career development assistant.',
    inputPlaceholder: 'Ask your professional query...',
    sendButton: 'Send',
    clearButton: 'Clear chat',
    keyPointsLabel: 'Key Points',
    newChatLabel: 'New Chat',
    loadingMessage: 'Thinking...',
    supportPhrases: {
      lowConfidence: 'I\'m here to support you every step of the way.',
      mediumConfidence: 'You\'re making progress. Let\'s continue building momentum.',
      highConfidence: 'Your confidence is inspiring. Let\'s optimize your strategy.'
    }
  },
  hindi: {
    welcomeMessage: 'नमस्ते 🙏🏻! मैं आशा AI हूँ, आपकी करियर विकास सहायक।',
    inputPlaceholder: 'अपना पेशेवर प्रश्न पूछें...',
    sendButton: 'भेजें',
    clearButton: 'चैट साफ़ करें',
    keyPointsLabel: 'मुख्य बिंदु',
    newChatLabel: 'नई चैट',
    loadingMessage: 'विचार कर रही हूँ...',
    supportPhrases: {
      lowConfidence: 'मैं हर कदम पर आपका समर्थन करने के लिए यहां हूं।',
      mediumConfidence: 'आप प्रगति कर रहे हैं। आइए गति बनाए रखें।',
      highConfidence: 'आपका आत्मविश्वास प्रेरणादायक है। आइए आपकी रणनीति को अनुकूलित करें।'
    }
  },
  tamil: {
    welcomeMessage: 'வணக்கம் 🙏🏻! நான் ஆஷா AI, உங்கள் தொழில் வளர்ச்சி உதவியாளர்.',
    inputPlaceholder: 'உங்கள் தொழில்முறை கேள்வியைக் கேளுங்கள்...',
    sendButton: 'அனுப்பு',
    clearButton: 'அரட்டையை அழி',
    keyPointsLabel: 'முக்கிய புள்ளிகள்',
    newChatLabel: 'புதிய அரட்டை',
    loadingMessage: 'சிந்திக்கிறேன்...',
    supportPhrases: {
      lowConfidence: 'நான் ஒவ்வொரு படியிலும் உங்களுக்கு ஆதரவாக இருக்கிறேன்.',
      mediumConfidence: 'நீங்கள் முன்னேறி வருகிறீர்கள். நாம் தொடர்ந்து முன்னேறுவோம்.',
      highConfidence: 'உங்கள் நம்பிக்கை ஊக்கமளிக்கிறது. உங்கள் திட்டத்தை மேம்படுத்துவோம்.'
    }
  },
  telugu: {
    welcomeMessage: 'నమస్తే 🙏🏻! నేను ఆశ AI, మీ కెరీర్ డెవలప్‌మెంట్ సహాయకురాలిని.',
    inputPlaceholder: 'మీ వృత్తిపరమైన ప్రశ్నను అడగండి...',
    sendButton: 'పంపు',
    clearButton: 'చాట్ క్లియర్ చేయండి',
    keyPointsLabel: 'ముఖ్య పాయింట్లు',
    newChatLabel: 'కొత్త చాట్',
    loadingMessage: 'ఆలోచిస్తున్నాను...',
    supportPhrases: {
      lowConfidence: 'నేను మీకు ప్రతి అడుగులో మద్దతుగా ఉంటాను.',
      mediumConfidence: 'మీరు పురోగతి చేస్తున్నారు. మనం మోమెంటమ్ కొనసాగిద్దాం.',
      highConfidence: 'మీ ఆత్మవిశ్వాసం స్ఫూర్తిదాయకం. మీ వ్యూహాన్ని మెరుగుపరుద్దాం.'
    }
  },
  kannada: {
    welcomeMessage: 'ನಮಸ್ತೆ 🙏🏻! ನಾನು ಆಶಾ AI, ನಿಮ್ಮ ವೃತ್ತಿ ಅಭಿವೃದ್ಧಿ ಸಹಾಯಕ.',
    inputPlaceholder: 'ನಿಮ್ಮ ವೃತ್ತಿಪರ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ...',
    sendButton: 'ಕಳುಹಿಸಿ',
    clearButton: 'ಚಾಟ್ ಕ್ಲಿಯರ್ ಮಾಡಿ',
    keyPointsLabel: 'ಪ್ರಮುಖ ಅಂಶಗಳು',
    newChatLabel: 'ಹೊಸ ಚಾಟ್',
    loadingMessage: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...',
    supportPhrases: {
      lowConfidence: 'ನಾನು ಪ್ರತಿ ಹೆಜ್ಜೆಯಲ್ಲಿ ನಿಮಗೆ ಬೆಂಬಲ ನೀಡಲು ಇಲ್ಲಿದ್ದೇನೆ.',
      mediumConfidence: 'ನೀವು ಪ್ರಗತಿ ಸಾಧಿಸುತ್ತಿದ್ದೀರಿ. ಮುಂದುವರಿಯೋಣ.',
      highConfidence: 'ನಿಮ್ಮ ಆತ್ಮವಿಶ್ವಾಸ ಸ್ಫೂರ್ತಿದಾಯಕವಾಗಿದೆ. ನಿಮ್ಮ ತಂತ್ರವನ್ನು ಉತ್ತಮಗೊಳಿಸೋಣ.'
    }
  },
  bengali: {
    welcomeMessage: 'নমস্কার 🙏🏻! আমি আশা AI, আপনার ক্যারিয়ার ডেভেলপমেন্ট সহায়ক।',
    inputPlaceholder: 'আপনার পেশাদার প্রশ্ন জিজ্ঞাসা করুন...',
    sendButton: 'পাঠান',
    clearButton: 'চ্যাট মুছুন',
    keyPointsLabel: 'মূল পয়েন্ট',
    newChatLabel: 'নতুন চ্যাট',
    loadingMessage: 'ভাবছি...',
    supportPhrases: {
      lowConfidence: 'আমি প্রতি পদক্ষেপে আপনাকে সমর্থন করতে এখানে আছি।',
      mediumConfidence: 'আপনি অগ্রগতি করছেন। আসুন গতি বজায় রাখি।',
      highConfidence: 'আপনার আত্মবিশ্বাস অনুপ্রেরণাদায়ক। আসুন আপনার কৌশল অপ্টিমাইজ করি।'
    }
  }
};

// Create context type
interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof Translations[SupportedLanguage], supportLevel?: 'lowConfidence' | 'mediumConfidence' | 'highConfidence') => string;
  detectLanguage: (text: string) => Promise<SupportedLanguage>;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('english');

  useEffect(() => {
    // Try to load saved language preference
    const savedLanguage = localStorage.getItem('ashaLanguage') as SupportedLanguage;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      if (browserLang === 'hi') setLanguage('hindi');
      else if (browserLang === 'ta') setLanguage('tamil');
      else if (browserLang === 'te') setLanguage('telugu');
      else if (browserLang === 'kn') setLanguage('kannada');
      else if (browserLang === 'bn') setLanguage('bengali');
      // Default to English for all other languages
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('ashaLanguage', language);
  }, [language]);

  // Translation function
  const t = (key: keyof Translations[SupportedLanguage], supportLevel?: 'lowConfidence' | 'mediumConfidence' | 'highConfidence') => {
    try {
      if (supportLevel && key === 'supportPhrases') {
        return translations[language].supportPhrases[supportLevel];
      }
      return translations[language][key] as string;
    } catch (error) {
      console.error(`Translation missing for ${key} in ${language}`);
      return translations.english[key] as string; // Fallback to English
    }
  };

  // Simple language detection based on text analysis
  // In a production app, you would use a more sophisticated NLP approach
  const detectLanguage = async (text: string): Promise<SupportedLanguage> => {
    // This is a naive implementation - in production you'd use a proper NLP library
    // or an API like Google's Language Detection
    
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
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, detectLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};