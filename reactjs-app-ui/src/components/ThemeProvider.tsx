import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemePanel } from '@radix-ui/themes';
import { THEME_CONFIG, PRECONFIGURED_THEMES } from '../config/design-system';

type PreconfiguredThemeKey = keyof typeof PRECONFIGURED_THEMES;

interface ThemeContextType {
  appearance: 'light' | 'dark';
  accentColor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray';
  grayColor: 'gray' | 'mauve' | 'slate' | 'sage' | 'olive' | 'sand';
  radius: 'none' | 'small' | 'medium' | 'large' | 'full';
  scaling: '90%' | '95%' | '100%' | '105%' | '110%';
  currentTheme: PreconfiguredThemeKey;
  toggleAppearance: () => void;
  setAccentColor: (color: ThemeContextType['accentColor']) => void;
  setGrayColor: (color: ThemeContextType['grayColor']) => void;
  setRadius: (radius: ThemeContextType['radius']) => void;
  setScaling: (scaling: ThemeContextType['scaling']) => void;
  setPreconfiguredTheme: (theme: PreconfiguredThemeKey) => void;
  getAvailableThemes: () => Array<{ key: PreconfiguredThemeKey; name: string; description: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  showThemePanel?: boolean;
}

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  showThemePanel = process.env.NODE_ENV === 'development' 
}) => {
  const [appearance, setAppearance] = useState<'light' | 'dark'>(THEME_CONFIG.appearance);
  const [accentColor, setAccentColor] = useState<ThemeContextType['accentColor']>(THEME_CONFIG.accentColor);
  const [grayColor, setGrayColor] = useState<ThemeContextType['grayColor']>(THEME_CONFIG.grayColor);
  const [radius, setRadius] = useState<ThemeContextType['radius']>(THEME_CONFIG.radius);
  const [scaling, setScaling] = useState<ThemeContextType['scaling']>(THEME_CONFIG.scaling);
  const [currentTheme, setCurrentTheme] = useState<PreconfiguredThemeKey>('modern');

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-appearance');
    const savedAccent = localStorage.getItem('theme-accent-color');
    const savedGray = localStorage.getItem('theme-gray-color');
    const savedRadius = localStorage.getItem('theme-radius');
    const savedScaling = localStorage.getItem('theme-scaling');
    const savedPreconfiguredTheme = localStorage.getItem('theme-preconfigured');

    if (savedPreconfiguredTheme && PRECONFIGURED_THEMES[savedPreconfiguredTheme as PreconfiguredThemeKey]) {
      const theme = PRECONFIGURED_THEMES[savedPreconfiguredTheme as PreconfiguredThemeKey];
      setAppearance(theme.appearance);
      setAccentColor(theme.accentColor);
      setGrayColor(theme.grayColor);
      setRadius(theme.radius);
      setScaling(theme.scaling);
      setCurrentTheme(savedPreconfiguredTheme as PreconfiguredThemeKey);
    } else {
      // Fallback to individual settings
      if (savedTheme) setAppearance(savedTheme as 'light' | 'dark');
      if (savedAccent) setAccentColor(savedAccent as ThemeContextType['accentColor']);
      if (savedGray) setGrayColor(savedGray as ThemeContextType['grayColor']);
      if (savedRadius) setRadius(savedRadius as ThemeContextType['radius']);
      if (savedScaling) setScaling(savedScaling as ThemeContextType['scaling']);
    }
  }, []);

  // Save theme preferences to localStorage
  const saveThemePreference = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const toggleAppearance = () => {
    const newAppearance = appearance === 'light' ? 'dark' : 'light';
    setAppearance(newAppearance);
    saveThemePreference('theme-appearance', newAppearance);
  };

  const handleSetAccentColor = (color: ThemeContextType['accentColor']) => {
    setAccentColor(color);
    saveThemePreference('theme-accent-color', color);
  };

  const handleSetGrayColor = (color: ThemeContextType['grayColor']) => {
    setGrayColor(color);
    saveThemePreference('theme-gray-color', color);
  };

  const handleSetRadius = (newRadius: ThemeContextType['radius']) => {
    setRadius(newRadius);
    saveThemePreference('theme-radius', newRadius);
  };

  const handleSetScaling = (newScaling: ThemeContextType['scaling']) => {
    setScaling(newScaling);
    saveThemePreference('theme-scaling', newScaling);
  };

  const setPreconfiguredTheme = (themeKey: PreconfiguredThemeKey) => {
    const theme = PRECONFIGURED_THEMES[themeKey];
    setAppearance(theme.appearance);
    setAccentColor(theme.accentColor);
    setGrayColor(theme.grayColor);
    setRadius(theme.radius);
    setScaling(theme.scaling);
    setCurrentTheme(themeKey);
    saveThemePreference('theme-preconfigured', themeKey);
  };

  const getAvailableThemes = () => [
    { key: 'modern', name: 'Modern Professional', description: 'Clean blue theme with slate grays' },
    { key: 'warm', name: 'Warm & Friendly', description: 'Orange accent with warm sand tones' },
    { key: 'minimal', name: 'Minimal & Clean', description: 'Subtle gray theme with small radius' },
    { key: 'vibrant', name: 'Vibrant & Energetic', description: 'Purple accent with mauve grays' },
    { key: 'nature', name: 'Nature Inspired', description: 'Green accent with sage grays' },
    { key: 'darkProfessional', name: 'Dark Professional', description: 'Dark mode with blue accent' },
    { key: 'darkWarm', name: 'Dark Warm', description: 'Dark mode with orange accent' },
    { key: 'darkMinimal', name: 'Dark Minimal', description: 'Dark mode with gray accent' },
  ];

  const contextValue: ThemeContextType = {
    appearance,
    accentColor,
    grayColor,
    radius,
    scaling,
    currentTheme,
    toggleAppearance,
    setAccentColor: handleSetAccentColor,
    setGrayColor: handleSetGrayColor,
    setRadius: handleSetRadius,
    setScaling: handleSetScaling,
    setPreconfiguredTheme,
    getAvailableThemes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <Theme
        appearance={appearance}
        accentColor={accentColor}
        grayColor={grayColor}
        radius={radius}
        scaling={scaling}
        panelBackground="solid"
        hasBackground={false}
      >
        {children}
        {showThemePanel && <ThemePanel />}
      </Theme>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
};

// Theme toggle component for easy theme switching
export const ThemeToggle: React.FC = () => {
  const { appearance, toggleAppearance } = useTheme();
  
  return (
    <button
      onClick={toggleAppearance}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--gray-6)',
        backgroundColor: 'var(--gray-1)',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {appearance === 'light' ? '🌙' : '☀️'}
      {appearance === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
};

// Preconfigured theme selector component
export const ThemeSelector: React.FC = () => {
  const { currentTheme, setPreconfiguredTheme, getAvailableThemes } = useTheme();
  const themes = getAvailableThemes();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: '500' }}>Choose Theme:</label>
      <select
        value={currentTheme}
        onChange={(e) => setPreconfiguredTheme(e.target.value as PreconfiguredThemeKey)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--gray-1)',
          fontSize: '14px',
        }}
      >
        {themes.map((theme) => (
          <option key={theme.key} value={theme.key}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AppThemeProvider;
