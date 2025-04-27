import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onReset: () => void;
}

const ChatHeader = ({ onReset }: ChatHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white sticky top-0 z-10">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-[#6A2C91] flex items-center justify-center text-white mr-3">
          <i className="ri-robot-2-line text-xl"></i>
        </div>
        <div>
          <h1 className="text-lg font-poppins font-bold text-[#6A2C91]">Asha AI</h1>
          <p className="text-xs text-neutral-700/70">JobsForHer Foundation</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="p-2 text-neutral-700/70 hover:bg-neutral-200/30 rounded-full transition-colors"
            >
              <i className="ri-refresh-line text-lg"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start new conversation</p>
          </TooltipContent>
        </Tooltip>
        
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
            <p>About Asha AI</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default ChatHeader;
