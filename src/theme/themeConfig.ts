export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

const lightColors: ThemeColors = {
  primary: '#1B3A57',
  primaryDark: '#0F2338',
  primaryLight: '#2D4F6F',
  secondary: '#F2B705',
  secondaryDark: '#D49F04',
  secondaryLight: '#F5C933',
  accent: '#274C77',
  accentDark: '#1A3351',
  accentLight: '#3A648F',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  info: '#17A2B8',
};

const darkColors: ThemeColors = {
  primary: '#2D4F6F',
  primaryDark: '#1B3A57',
  primaryLight: '#3E6280',
  secondary: '#F2B705',
  secondaryDark: '#D49F04',
  secondaryLight: '#F5C933',
  accent: '#3A648F',
  accentDark: '#274C77',
  accentLight: '#4D7BA7',
  background: '#0F1419',
  surface: '#1A1F2E',
  text: '#E9ECEF',
  textSecondary: '#ADB5BD',
  border: '#495057',
  error: '#F8719E',
  warning: '#FFD54F',
  success: '#4CAF50',
  info: '#29B6F6',
};

const commonTheme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  ...commonTheme,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  ...commonTheme,
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
