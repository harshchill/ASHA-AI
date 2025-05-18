import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EmotionTone = 'anxious' | 'neutral' | 'confident';
export type SupportLevel = 'high-support' | 'moderate-support' | 'minimal-guidance';
export type ResponseTone = 'supportive' | 'practical' | 'motivational';
export type ResponseEmphasis = 'emotional' | 'factual' | 'balanced';

export interface EmotionalState {
  tone: ResponseTone;
  emphasis: ResponseEmphasis;
  lastAnalysis: Date;
}

export interface CareerConfidenceState {
  confidenceLevel: ConfidenceLevel;
  emotionTone: EmotionTone;
  supportLevel: SupportLevel;
  emotionalState: EmotionalState;
}

interface CareerConfidenceContextType {
  confidenceState: CareerConfidenceState;
  updateConfidence: (analysis: CareerConfidenceState) => void;
  updateEmotionalState: (state: EmotionalState) => void;
  getResponseStyle: () => { tone: ResponseTone; emphasis: ResponseEmphasis };
}

// Default state - neutral/moderate values
const defaultConfidenceState: CareerConfidenceState = {
  confidenceLevel: 'medium',
  emotionTone: 'neutral',
  supportLevel: 'moderate-support',
  emotionalState: {
    tone: 'practical',
    emphasis: 'balanced',
    lastAnalysis: new Date()
  }
};

// Create the context
const CareerConfidenceContext = createContext<CareerConfidenceContextType | undefined>(undefined);

// Provider component
export const CareerConfidenceProvider = ({ children }: { children: ReactNode }) => {
  const [confidenceState, setConfidenceState] = useState<CareerConfidenceState>(defaultConfidenceState);

  const updateConfidence = (analysis: CareerConfidenceState) => {
    setConfidenceState(analysis);
  };

  const updateEmotionalState = (state: EmotionalState) => {
    setConfidenceState(prev => ({
      ...prev,
      emotionalState: {
        ...state,
        lastAnalysis: new Date()
      }
    }));
  };

  const getResponseStyle = (): { tone: ResponseTone; emphasis: ResponseEmphasis } => {
    const { confidenceLevel, emotionTone, supportLevel, emotionalState } = confidenceState;

    // Define response style based on current state
    let tone: ResponseTone = emotionalState.tone;
    let emphasis: ResponseEmphasis = emotionalState.emphasis;

    // Adjust tone based on confidence and emotion
    if (confidenceLevel === 'low' || emotionTone === 'anxious') {
      tone = 'supportive';
      emphasis = 'emotional';
    } else if (confidenceLevel === 'high' && emotionTone === 'confident') {
      tone = 'motivational';
      emphasis = 'balanced';
    }

    // Adjust emphasis based on support level
    if (supportLevel === 'high-support') {
      emphasis = 'emotional';
    } else if (supportLevel === 'minimal-guidance') {
      emphasis = 'factual';
    }

    return { tone, emphasis };
  };

  return (
    <CareerConfidenceContext.Provider value={{ 
      confidenceState, 
      updateConfidence, 
      updateEmotionalState,
      getResponseStyle 
    }}>
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
// Define ColorScheme type for reuse
export type ColorScheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  borderStyle: string;
  avatarBg: string;
  messageBg: string;
  messageBorder: string;
  supportTextColor: string;
  messageTextStyle: string;
  keyPointsButtonColor: string;
  titleColor: string;
  keyPointBg: string;
  keyPointNumberBg: string;
};

export const getColorSchemeForConfidence = (confidenceState: CareerConfidenceState): ColorScheme => {
  const { confidenceLevel, emotionTone } = confidenceState;
  
  // Default moderate scheme
  let scheme = {
    primaryColor: '#6A2C91', // Default purple
    secondaryColor: '#9D5CC2',
    accentColor: '#EBE5F1',
    textColor: '#4B4B4B',
    borderStyle: 'border-[#6A2C91]/20',
    avatarBg: 'bg-[#6A2C91]',
    messageBg: 'bg-white',
    messageBorder: 'border-gray-200',
    supportTextColor: 'text-[#6A2C91]/70',
    messageTextStyle: 'text-gray-800',
    keyPointsButtonColor: 'text-[#6A2C91]/70 hover:text-[#6A2C91]',
    titleColor: 'text-[#6A2C91]',
    keyPointBg: 'bg-purple-50',
    keyPointNumberBg: 'bg-[#6A2C91]'
  } as ColorScheme;
  
  // Adjust based on confidence level and emotion tone
  if (confidenceLevel === 'low' && emotionTone === 'anxious') {
    // Supportive and calming color scheme
    scheme = {
      primaryColor: '#4A90E2', // Calming blue
      secondaryColor: '#7FB3F5',
      accentColor: '#E9F2FD',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#4A90E2]/20',
      avatarBg: 'bg-[#4A90E2]',
      messageBg: 'bg-blue-50',
      messageBorder: 'border-blue-100',
      supportTextColor: 'text-blue-700',
      messageTextStyle: 'text-gray-800 font-medium',
      keyPointsButtonColor: 'text-blue-700 hover:text-blue-800',
      titleColor: 'text-blue-700',
      keyPointBg: 'bg-blue-50',
      keyPointNumberBg: 'bg-[#4A90E2]'
    } as ColorScheme;
  } else if (confidenceLevel === 'low' && emotionTone === 'neutral') {
    // Supportive but light scheme
    scheme = {
      primaryColor: '#5C94CC', // Softer blue
      secondaryColor: '#8AB5DF',
      accentColor: '#EEF5FC',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#5C94CC]/20',
      avatarBg: 'bg-[#5C94CC]',
      messageBg: 'bg-blue-50/50',
      messageBorder: 'border-blue-100/70',
      supportTextColor: 'text-blue-600/80',
      messageTextStyle: 'text-gray-800',
      keyPointsButtonColor: 'text-blue-600/70 hover:text-blue-700',
      titleColor: 'text-blue-600',
      keyPointBg: 'bg-blue-50/60',
      keyPointNumberBg: 'bg-[#5C94CC]'
    } as ColorScheme;
  } else if (confidenceLevel === 'medium' && emotionTone === 'anxious') {
    // Balanced but reassuring scheme
    scheme = {
      primaryColor: '#6A7FBF', // Blue-purple
      secondaryColor: '#96A3D8',
      accentColor: '#EEEEF9',
      textColor: '#4B4B4B',
      borderStyle: 'border-[#6A7FBF]/20',
      avatarBg: 'bg-[#6A7FBF]',
      messageBg: 'bg-indigo-50/50',
      messageBorder: 'border-indigo-100',
      supportTextColor: 'text-indigo-700/80',
      messageTextStyle: 'text-gray-800',
      keyPointsButtonColor: 'text-indigo-700/70 hover:text-indigo-800',
      titleColor: 'text-indigo-700',
      keyPointBg: 'bg-indigo-50',
      keyPointNumberBg: 'bg-[#6A7FBF]'
    } as ColorScheme;
  } else if (confidenceLevel === 'high' && (emotionTone === 'confident' || emotionTone === 'neutral')) {
    // Empowering, vibrant scheme
    scheme = {
      primaryColor: '#2E7D32', // Strong green
      secondaryColor: '#5BA55E',
      accentColor: '#E8F5E9',
      textColor: '#3E3E3E',
      borderStyle: 'border-[#2E7D32]/20',
      avatarBg: 'bg-[#2E7D32]',
      messageBg: 'bg-green-50',
      messageBorder: 'border-green-100',
      supportTextColor: 'text-green-700',
      messageTextStyle: 'text-gray-800',
      keyPointsButtonColor: 'text-green-700/70 hover:text-green-800',
      titleColor: 'text-green-700',
      keyPointBg: 'bg-green-50',
      keyPointNumberBg: 'bg-[#2E7D32]'
    } as ColorScheme;
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