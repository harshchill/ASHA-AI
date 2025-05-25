export type EmotionalThemeVariant = 'default' | 'supportive' | 'empowering' | 'balanced';

export type ThemeColors = {
  main: string;
  light: string;
  dark: string;
  gradient: string;
  accent?: string;
  surface?: string;
  text?: string;
};

export const theme = {
  colors: {
    primary: {
      default: {
        main: '#6A2C91',
        light: '#9D5CC2',
        dark: '#4A1D71',
        gradient: 'linear-gradient(to right, #6A2C91, #9D5CC2)',
        accent: '#EBE5F1',
        surface: '#F8F9FA',
        text: '#4B4B4B'
      },
      supportive: {
        main: '#4A90E2',
        light: '#7FB3F5',
        dark: '#2F6EB5',
        gradient: 'linear-gradient(to right, #4A90E2, #7FB3F5)',
        accent: '#E9F2FD',
        surface: '#F0F7FF',
        text: '#2A4E7D'
      },
      empowering: {
        main: '#2E7D32',
        light: '#5BA55E',
        dark: '#1B5E20',
        gradient: 'linear-gradient(to right, #2E7D32, #5BA55E)',
        accent: '#E8F5E9',
        surface: '#F1F8F1',
        text: '#1B4B1E'
      },
      balanced: {
        main: '#6A7FBF',
        light: '#96A3D8',
        dark: '#4A5A8C',
        gradient: 'linear-gradient(to right, #6A7FBF, #96A3D8)',
        accent: '#EEEEF9',
        surface: '#F5F6FA',
        text: '#3A4668'
      }
    },
    background: {
      main: '#FFFFFF',
      light: '#F8F9FA',
      paper: '#FFFFFF',
      hover: 'rgba(106, 44, 145, 0.05)'
    },
    text: {
      primary: '#1A1A1A',
      secondary: 'rgba(0, 0, 0, 0.7)',
      muted: 'rgba(0, 0, 0, 0.5)',
      onPrimary: '#FFFFFF'
    },
    border: {
      light: 'rgba(106, 44, 145, 0.1)',
      main: 'rgba(106, 44, 145, 0.2)'
    },
    feedback: {
      success: {
        main: '#2E7D32',
        light: '#4CAF50',
        dark: '#1B5E20',
        surface: '#E8F5E9'
      },
      info: {
        main: '#0288D1',
        light: '#03A9F4',
        dark: '#01579B',
        surface: '#E1F5FE'
      },
      warning: {
        main: '#ED6C02',
        light: '#FF9800',
        dark: '#E65100',
        surface: '#FFF3E0'
      },
      error: {
        main: '#D32F2F',
        light: '#EF5350',
        dark: '#C62828',
        surface: '#FDECEA'
      }
    },
    herkey: {
      primary: '#6A2C91',
      secondary: '#9D5CC2',
      link: {
        job: '#2E7D32',
        company: '#1976D2',
        community: '#9C27B0',
        event: '#ED6C02',
        learning: '#0288D1'
      }
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: {
      primary: 'Poppins, sans-serif',
      secondary: 'Inter, sans-serif'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
} as const;

export type Theme = typeof theme;

// Helper to get the current theme variant based on confidence and emotion
export const getThemeVariant = (confidence: 'low' | 'medium' | 'high', emotion: 'anxious' | 'neutral' | 'confident'): EmotionalThemeVariant => {
  if (confidence === 'low' && emotion === 'anxious') {
    return 'supportive';
  } else if (confidence === 'high' && (emotion === 'confident' || emotion === 'neutral')) {
    return 'empowering';
  } else if (confidence === 'medium') {
    return 'balanced';
  }
  return 'default';
};