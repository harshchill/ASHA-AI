import SuggestionChip from "./suggestion-chip";

interface WelcomeMessageProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeMessage = ({ onSuggestionClick }: WelcomeMessageProps) => {
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
        <h2 className="font-poppins font-semibold text-[#6A2C91] text-lg">Namaste!</h2>
      </div>
      <p className="text-sm mb-4 leading-relaxed">
        Welcome to <span className="font-semibold text-[#6A2C91]">Asha AI</span>, your career companion from <span className="font-semibold">JobsForHer Foundation</span>. I'm designed to empower women in their professional journeys by providing guidance on job opportunities, career transitions, and professional growth.
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
