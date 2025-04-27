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
        className={`w-11 h-11 rounded-full bg-[#6A2C91] text-white flex items-center justify-center hover:bg-[#4A1D64] active:bg-[#4A1D64] transition-colors ${isListening ? 'bg-[#FF9933]' : ''}`}
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
