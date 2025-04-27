import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, SupportedLanguage } from '@/contexts/LanguageContext';

// Language options with their names in native script
const languageOptions: { value: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'hindi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { value: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { value: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { value: 'kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { value: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
];

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  // Get current language display name
  const currentLanguage = languageOptions.find(option => option.value === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2 ml-auto">
          <span className="text-xs">{currentLanguage?.nativeLabel}</span>
          <i className="ri-translate-2 text-sm ml-1"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className={language === option.value ? 'bg-primary/10 font-medium' : ''}
          >
            <span className="mr-2">{option.nativeLabel}</span>
            <span className="text-xs text-muted-foreground">{option.label !== option.nativeLabel ? option.label : ''}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;