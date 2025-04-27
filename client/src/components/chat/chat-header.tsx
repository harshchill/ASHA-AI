import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onReset: () => void;
}

const ChatHeader = ({ onReset }: ChatHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6A2C91] to-[#4A1D71] flex items-center justify-center text-white mr-3 shadow-md">
          <i className="ri-customer-service-2-line text-xl"></i>
        </div>
        <div>
          <h1 className="text-lg font-poppins font-bold bg-gradient-to-r from-[#6A2C91] to-[#9D5CC2] text-transparent bg-clip-text">💫 Asha AI</h1>
          <p className="text-xs text-neutral-700/90 font-medium tracking-wide">👩‍💼 JobsForHer Foundation</p>
        </div>
      </div>
      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="border-[#6A2C91]/20 text-[#6A2C91] hover:bg-[#6A2C91]/5 hover:text-[#6A2C91] rounded-md transition-colors"
              >
                <i className="ri-refresh-line mr-1"></i>
                🔄 New Conversation
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset and start a new conversation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-neutral-700/70 hover:bg-neutral-200/30 rounded-full transition-colors"
              >
                <i className="ri-information-line text-lg"></i>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ℹ️ About Asha AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default ChatHeader;
