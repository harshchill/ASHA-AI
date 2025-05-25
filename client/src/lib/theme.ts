export const theme = {
  colors: {
    primary: {
      main: '#6A2C91',
      light: '#9D5CC2',
      dark: '#4A1D71',
      hover: 'rgba(106, 44, 145, 0.05)',
      gradient: 'linear-gradient(to right, #6A2C91, #9D5CC2)',
      states: {
        hover: 'rgba(106, 44, 145, 0.08)',
        active: 'rgba(106, 44, 145, 0.12)',
        focus: 'rgba(106, 44, 145, 0.16)'
      }
    },
    background: {
      main: '#FFFFFF',
      light: '#F8F9FA',
      hover: 'rgba(106, 44, 145, 0.05)',
      message: {
        user: 'rgba(106, 44, 145, 0.05)',
        assistant: '#FFFFFF',
        priority: 'rgba(106, 44, 145, 0.05)'
      }
    },
    text: {
      primary: '#1A1A1A',
      secondary: 'rgba(0, 0, 0, 0.7)',
      muted: 'rgba(0, 0, 0, 0.5)',
      highlight: '#6A2C91'
    },
    border: {
      light: 'rgba(106, 44, 145, 0.1)',
      main: 'rgba(106, 44, 145, 0.2)',
      hover: 'rgba(106, 44, 145, 0.3)'
    },
    support: {
      success: '#2E7D32',
      info: '#4A90E2',
      warning: '#F59E0B',
      error: '#DC2626'
    }
  },
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease'
  },
  animation: {
    message: {
      enter: {
        duration: '200ms',
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  }
};