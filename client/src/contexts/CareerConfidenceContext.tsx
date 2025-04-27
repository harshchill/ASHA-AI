import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EmotionTone = 'anxious' | 'neutral' | 'confident';
export type SupportLevel = 'high-support' | 'moderate-support' | 'minimal-guidance';

export interface CareerConfidenceState {
  confidenceLevel: ConfidenceLevel;
  emotionTone: EmotionTone;
  supportLevel: SupportLevel;
}

interface CareerConfidenceContextType {
  confidenceState: CareerConfidenceState;
  updateConfidence: (analysis: CareerConfidenceState) => void;
}

// Default state - neutral/moderate values
const defaultConfidenceState: CareerConfidenceState = {
  confidenceLevel: 'medium',
  emotionTone: 'neutral',
  supportLevel: 'moderate-support'
};

// Create the context
const CareerConfidenceContext = createContext<CareerConfidenceContextType | undefined>(undefined);

// Provider component
export const CareerConfidenceProvider = ({ children }: { children: ReactNode }) => {
  const [confidenceState, setConfidenceState] = useState<CareerConfidenceState>(defaultConfidenceState);

  const updateConfidence = (analysis: CareerConfidenceState) => {
    setConfidenceState(analysis);
  };

  return (
    <CareerConfidenceContext.Provider value={{ confidenceState, updateConfidence }}>
      {children}
    </CareerConfidenceContext.Provider>
  );
};

// Custom hook to use the context
export const useCareerConfidence = (): CareerConfidenceContextType => {
  const context = useContext(CareerConfidenceContext);
  if (context === undefined) {
    throw new Error('useCareerConfidence must be used within a CareerConfidenceProvider');
  }
  return context;
};

// Utility functions
export const getColorSchemeForConfidence = (confidenceState: CareerConfidenceState): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  borderStyle: string;
} => {
  const { confidenceLevel, emotionTone } = confidenceState;
  
  // Default moderate scheme
  let scheme = {
    primaryColor: '#6A2C91', // Default purple
    secondaryColor: '#9D5CC2',
    accentColor: '#EBE5F1',
    textColor: '#4B4B4B',
    borderStyle: 'border-[#6A2C91]/20'
  };
  
  // Adjust based on confidence level and emotion tone
  if (confidenceLevel === 'low' && emotionTone === 'anxious') {
    // Supportive and calming color scheme
    scheme = {
      primaryColor: '#4A90E2', // Calming blue
      secondaryColor: '#7FB3F5',
      accentColor: '#E9F2FD',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#4A90E2]/20'
    };
  } else if (confidenceLevel === 'low' && emotionTone === 'neutral') {
    // Supportive but light scheme
    scheme = {
      primaryColor: '#5C94CC', // Softer blue
      secondaryColor: '#8AB5DF',
      accentColor: '#EEF5FC',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#5C94CC]/20'
    };
  } else if (confidenceLevel === 'medium' && emotionTone === 'anxious') {
    // Balanced but reassuring scheme
    scheme = {
      primaryColor: '#6A7FBF', // Blue-purple
      secondaryColor: '#96A3D8',
      accentColor: '#EEEEF9',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#6A7FBF]/20'
    };
  } else if (confidenceLevel === 'high' && (emotionTone === 'confident' || emotionTone === 'neutral')) {
    // Empowering, vibrant scheme
    scheme = {
      primaryColor: '#2E7D32', // Strong green
      secondaryColor: '#5BA55E',
      accentColor: '#E8F5E9',
      textColor: '#3E3E3E',
      borderStyle: 'border-[#2E7D32]/20'
    };
  }
  
  return scheme;
};

// Get appropriate feedback phrases based on confidence state
export const getSupportivePhrase = (confidenceState: CareerConfidenceState): string => {
  const { confidenceLevel, emotionTone } = confidenceState;
  
  if (confidenceLevel === 'low' && emotionTone === 'anxious') {
    return "I'm here to support you every step of the way.";
  } else if (confidenceLevel === 'low' && emotionTone === 'neutral') {
    return "Let's explore these opportunities together.";
  } else if (confidenceLevel === 'medium' && emotionTone === 'anxious') {
    return "You're on the right track; let's continue building momentum.";
  } else if (confidenceLevel === 'medium' && emotionTone === 'neutral') {
    return "You're making progress; I'm here to help you advance further.";
  } else if (confidenceLevel === 'medium' && emotionTone === 'confident') {
    return "Great momentum! Let's keep building on your strengths.";
  } else if (confidenceLevel === 'high' && emotionTone === 'neutral') {
    return "Your confidence is inspiring; let's fine-tune your approach.";
  } else if (confidenceLevel === 'high' && emotionTone === 'confident') {
    return "Your clarity and direction are excellent; let's optimize your strategy.";
  }
  
  // Default supportive phrase
  return "I'm here to support your career journey.";
};