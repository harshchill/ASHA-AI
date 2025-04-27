import SuggestionChip from "./suggestion-chip";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeMessageProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeMessage = ({ onSuggestionClick }: WelcomeMessageProps) => {
  const { t, language } = useLanguage();
  
  // Define language-specific suggestions
  const suggestionsByLanguage = {
    english: [
      "💼 Job opportunities in tech industry",
      "📝 Resume building tips for women",
      "🔄 Career transition planning",
      "🏢 Job application procedures",
      "👔 Interview preparation tips",
      "👩‍💼 Mentorship programs available",
      "💰 Salary negotiation strategies",
      "🌟 Developing leadership skills"
    ],
    hindi: [
      "💼 तकनीकी उद्योग में नौकरी के अवसर",
      "📝 महिलाओं के लिए रिज्यूमे बनाने के टिप्स",
      "🔄 करियर ट्रांजिशन की योजना",
      "🏢 नौकरी आवेदन प्रक्रियाएँ",
      "👔 इंटरव्यू तैयारी के टिप्स",
      "👩‍💼 उपलब्ध मेंटरशिप प्रोग्राम",
      "💰 सैलरी नेगोशिएशन रणनीतियाँ",
      "🌟 लीडरशिप स्किल्स विकसित करना"
    ],
    tamil: [
      "💼 தொழில்நுட்பத் துறையில் வேலை வாய்ப்புகள்",
      "📝 பெண்களுக்கான ரெசுமே உருவாக்கும் குறிப்புகள்",
      "🔄 வேலை மாற்றத் திட்டமிடல்",
      "🏢 வேலை விண்ணப்ப நடைமுறைகள்",
      "👔 நேர்காணல் தயாரிப்பு குறிப்புகள்",
      "👩‍💼 கிடைக்கும் வழிகாட்டல் திட்டங்கள்",
      "💰 சம்பள பேரம் உத்திகள்",
      "🌟 தலைமைத்துவ திறன்களை வளர்த்தல்"
    ],
    telugu: [
      "💼 టెక్ ఇండస్ట్రీలో ఉద్యోగ అవకాశాలు",
      "📝 మహిళలకు రెసుమె నిర్మాణ చిట్కాలు",
      "🔄 కెరీర్ మార్పు ప్రణాళిక",
      "🏢 ఉద్యోగ దరఖాస్తు విధానాలు",
      "👔 ఇంటర్వ్యూ తయారీ చిట్కాలు",
      "👩‍💼 అందుబాటులో ఉన్న మెంటర్‌షిప్ ప్రోగ్రామ్‌లు",
      "💰 జీతం చర్చల వ్యూహాలు",
      "🌟 నాయకత్వ నైపుణ్యాలను పెంపొందించడం"
    ],
    kannada: [
      "💼 ಟೆಕ್ ಇಂಡಸ್ಟ್ರಿಯಲ್ಲಿ ಉದ್ಯೋಗ ಅವಕಾಶಗಳು",
      "📝 ಮಹಿಳೆಯರಿಗೆ ರೆಸ್ಯುಮೆ ರಚಿಸುವ ಟಿಪ್ಸ್",
      "🔄 ವೃತ್ತಿ ಬದಲಾವಣೆ ಯೋಜನೆ",
      "🏢 ಉದ್ಯೋಗ ಅರ್ಜಿ ವಿಧಾನಗಳು",
      "👔 ಸಂದರ್ಶನ ತಯಾರಿ ಟಿಪ್ಸ್",
      "👩‍💼 ಲಭ್ಯವಿರುವ ಮಾರ್ಗದರ್ಶನ ಕಾರ್ಯಕ್ರಮಗಳು",
      "💰 ಸಂಬಳ ವಾಟಾಘಾಟೆ ತಂತ್ರಗಳು",
      "🌟 ನಾಯಕತ್ವ ಕೌಶಲ್ಯಗಳನ್ನು ಬೆಳೆಸುವುದು"
    ],
    bengali: [
      "💼 টেক ইন্ডাস্ট্রিতে চাকরির সুযোগ",
      "📝 মহিলাদের জন্য রিজুমে তৈরির টিপস",
      "🔄 ক্যারিয়ার পরিবর্তন পরিকল্পনা",
      "🏢 চাকরি আবেদন পদ্ধতি",
      "👔 ইন্টারভিউ প্রস্তুতি টিপস",
      "👩‍💼 উপলব্ধ মেন্টরশিপ প্রোগ্রাম",
      "💰 বেতন আলোচনার কৌশল",
      "🌟 নেতৃত্ব দক্ষতা বিকাশ"
    ]
  };

  // Get suggestions based on current language
  const suggestions = suggestionsByLanguage[language] || suggestionsByLanguage.english;

  return (
    <div className="bg-gradient-to-r from-[#6A2C91]/10 to-[#6A2C91]/5 rounded-lg p-5 mb-3 max-w-lg shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🙏🏻</span>
        <h2 className="font-poppins font-semibold text-[#6A2C91] text-lg">
          {t('welcomeMessage').split(' ')[0]}
        </h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed">
        {t('welcomeMessage')}
      </p>
      {/* Suggestion prompt text in different languages */}
      <p className="text-xs text-neutral-600 italic mb-3">
        {language === 'hindi' && "नौकरी के अवसरों, इंटरव्यू टिप्स के बारे में पूछें, या नीचे दिए गए सुझावों में से चुनें:"}
        {language === 'tamil' && "வேலை வாய்ப்புகள், நேர்காணல் குறிப்புகள் பற்றி கேளுங்கள், அல்லது கீழே உள்ள பரிந்துரைகளிலிருந்து தேர்வு செய்யவும்:"}
        {language === 'telugu' && "ఉద్యోగ అవకాశాలు, ఇంటర్వ్యూ చిట్కాల గురించి అడగండి, లేదా క్రింద సూచించిన సలహాలలో ఎంచుకోండి:"}
        {language === 'kannada' && "ಉದ್ಯೋಗ ಅವಕಾಶಗಳು, ಸಂದರ್ಶನ ಟಿಪ್ಸ್ ಬಗ್ಗೆ ಕೇಳಿ, ಅಥವಾ ಕೆಳಗಿನ ಸಲಹೆಗಳಿಂದ ಆಯ್ಕೆ ಮಾಡಿ:"}
        {language === 'bengali' && "চাকরির সুযোগ, ইন্টারভিউ টিপস সম্পর্কে জিজ্ঞাসা করুন, অথবা নীচের পরামর্শগুলি থেকে বেছে নিন:"}
        {language === 'english' && "Try asking about job opportunities, interview tips, or choose from the suggestions below:"}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {suggestions.map((suggestion, index) => (
          <SuggestionChip 
            key={index} 
            text={suggestion} 
            onClick={() => onSuggestionClick(suggestion)} 
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomeMessage;
