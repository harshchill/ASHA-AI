import { Button } from "@/components/ui/button";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const VoiceButton = ({ isListening, onClick, disabled }: VoiceButtonProps) => {
  return (
    <div className="ripple-container">
      <Button 
        onClick={onClick}
        disabled={disabled}
        className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-gradient-to-br from-[#FF9933] to-[#FF8000] text-white' 
            : 'bg-gradient-to-br from-[#6A2C91] to-[#4A1D64] text-white hover:shadow-lg'
        }`}
      >
        <i className={`${isListening ? 'ri-record-circle-fill' : 'ri-mic-line'} text-xl`}></i>
      </Button>
      {isListening && (
        <div className="ripple"></div>
      )}
    </div>
  );
};

export default VoiceButton;
