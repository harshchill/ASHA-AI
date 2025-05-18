// Supported languages
export type SupportedLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'kannada' | 'bengali';

// Detect language from text using basic pattern recognition
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