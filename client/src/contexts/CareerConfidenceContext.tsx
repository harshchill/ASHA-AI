import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { theme, getThemeVariant, EmotionalThemeVariant } from '@/lib/theme';

export type CareerConfidenceLevel = 'low' | 'medium' | 'high';
export type EmotionTone = 'anxious' | 'neutral' | 'confident';

export interface CareerConfidenceState {
  confidenceLevel: CareerConfidenceLevel;
  emotionTone: EmotionTone;
}

export interface CareerConfidenceContextType {
  confidenceState: CareerConfidenceState;
  updateConfidence: (analysis: CareerConfidenceState) => void;
  currentTheme: EmotionalThemeVariant;
}

// Default state - neutral/moderate values
const defaultConfidenceState: CareerConfidenceState = {
  confidenceLevel: 'medium',
  emotionTone: 'neutral'
};

// Create the context
const CareerConfidenceContext = createContext<CareerConfidenceContextType | undefined>(undefined);

// Provider component
export const CareerConfidenceProvider = ({ children }: { children: ReactNode }) => {
  const [confidenceState, setConfidenceState] = useState<CareerConfidenceState>(defaultConfidenceState);
  const currentTheme = getThemeVariant(confidenceState.confidenceLevel, confidenceState.emotionTone);

  // Apply theme variant to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [currentTheme]);

  const updateConfidence = (analysis: CareerConfidenceState) => {
    setConfidenceState(analysis);
  };

  return (
    <CareerConfidenceContext.Provider value={{ confidenceState, updateConfidence, currentTheme }}>
      {children}
    </CareerConfidenceContext.Provider>
  );
};

// Custom hook to use the context
export const useCareerConfidence = () => {
  const context = useContext(CareerConfidenceContext);
  if (context === undefined) {
    throw new Error('useCareerConfidence must be used within a CareerConfidenceProvider');
  }
  return context;
};

// Get theme colors based on the emotional variant
export const getThemeColors = (variant: EmotionalThemeVariant) => {
  const colors = theme.colors.primary[variant];
  
  return {
    primaryColor: colors.main,
    secondaryColor: colors.light,
    accentColor: colors.accent,
    textColor: colors.text,
    borderStyle: `border-[${colors.main}]/20`,
    avatarBg: `bg-[${colors.main}]`,
    messageBg: `bg-[${colors.surface}]`,
    messageBorder: `border border-[${colors.light}]/20`,
    supportTextColor: `text-[${colors.dark}]/80`,
    messageTextStyle: `text-[${colors.text}]`,
    keyPointsButtonColor: `text-[${colors.main}]/70 hover:text-[${colors.dark}]`,
    titleColor: `text-[${colors.main}]`,
    keyPointBg: `bg-[${colors.accent}]`,
    keyPointNumberBg: `bg-[${colors.main}]`
  };
};