import SuggestionChip from "./suggestion-chip";

interface WelcomeMessageProps {
  onSuggestionClick: (text: string) => void;
}

const WelcomeMessage = ({ onSuggestionClick }: WelcomeMessageProps) => {
  const suggestions = [
    "Career advice",
    "Mentorship programs",
    "About JobsForHer",
    "Upcoming events"
  ];

  return (
    <div className="bg-gradient-to-r from-[#6A2C91]/10 to-[#6A2C91]/5 rounded-lg p-4 mb-2 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🙏🏻</span>
        <h2 className="font-poppins font-semibold text-[#6A2C91]">Namaste!</h2>
      </div>
      <p className="text-sm mb-3">
        Welcome to Asha AI. As your professional assistant from JobsForHer Foundation, I can provide structured guidance on career development, mentorship opportunities, and professional advancement strategies.
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
