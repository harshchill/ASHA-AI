interface SuggestionChipProps {
  text: string;
  onClick: () => void;
}

const SuggestionChip = ({ text, onClick }: SuggestionChipProps) => {
  return (
    <button 
      className="bg-white border border-[#6A2C91] text-[#6A2C91] text-xs py-1 px-3 rounded-full hover:bg-[#6A2C91]/5 transition-colors"
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default SuggestionChip;
