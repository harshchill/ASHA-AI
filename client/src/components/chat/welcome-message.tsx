import SuggestionChip from "./suggestion-chip";
import { useLanguage } from "@/contexts/LanguageContext";

interface WelcomeMessageProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeMessage = ({ onSuggestionClick }: WelcomeMessageProps) => {
  const { t, language } = useLanguage();
  
  const suggestions = [
    "💼 Job opportunities in tech industry",
    "📝 Resume building tips for women",
    "🔄 Career transition planning",
    "🏢 Job application procedures",
    "👔 Interview preparation tips",
    "👩‍💼 Mentorship programs available",
    "💰 Salary negotiation strategies",
    "🌟 Developing leadership skills"
  ];

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
      <p className="text-xs text-neutral-600 italic mb-3">
        Try asking about job opportunities, interview tips, or choose from the suggestions below:
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
