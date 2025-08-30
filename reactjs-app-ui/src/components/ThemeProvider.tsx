import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemePanel } from '@radix-ui/themes';
import { 
  THEME_CONFIG, 
  themeRegistry, 
  ThemeConfiguration,
  CUSTOM_THEMES 
} from '../config/design-system';

type ThemeKey = string;

interface ThemeContextType {
  appearance: 'light' | 'dark';
  accentColor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray';
  grayColor: 'gray' | 'mauve' | 'slate' | 'sage' | 'olive' | 'sand';
  radius: 'none' | 'small' | 'medium' | 'large' | 'full';
  scaling: '90%' | '95%' | '100%' | '105%' | '110%';
  currentTheme: ThemeKey;
  currentThemeConfig: ThemeConfiguration | undefined;
  toggleAppearance: () => void;
  setAccentColor: (color: ThemeContextType['accentColor']) => void;
  setGrayColor: (color: ThemeContextType['grayColor']) => void;
  setRadius: (radius: ThemeContextType['radius']) => void;
  setScaling: (scaling: ThemeContextType['scaling']) => void;
  setTheme: (themeKey: ThemeKey) => void;
  getAvailableThemes: () => Array<{ key: ThemeKey; config: ThemeConfiguration }>;
  getPreconfiguredThemes: () => Array<{ key: ThemeKey; config: ThemeConfiguration }>;
  getCustomThemes: () => Array<{ key: ThemeKey; config: ThemeConfiguration }>;
  registerCustomTheme: (key: ThemeKey, theme: ThemeConfiguration) => void;
  unregisterCustomTheme: (key: ThemeKey) => void;
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
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('modern');

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-current');
    const savedAppearance = localStorage.getItem('theme-appearance');
    const savedAccent = localStorage.getItem('theme-accent-color');
    const savedGray = localStorage.getItem('theme-gray-color');
    const savedRadius = localStorage.getItem('theme-radius');
    const savedScaling = localStorage.getItem('theme-scaling');

    if (savedTheme && themeRegistry.getTheme(savedTheme)) {
      // Load saved theme configuration
      const theme = themeRegistry.getTheme(savedTheme)!;
      setAppearance(theme.appearance);
      setAccentColor(theme.accentColor);
      setGrayColor(theme.grayColor);
      setRadius(theme.radius);
      setScaling(theme.scaling);
      setCurrentTheme(savedTheme);
    } else {
      // Fallback to individual settings
      if (savedAppearance) setAppearance(savedAppearance as 'light' | 'dark');
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

  const setTheme = (themeKey: ThemeKey) => {
    const theme = themeRegistry.getTheme(themeKey);
    if (theme) {
      setAppearance(theme.appearance);
      setAccentColor(theme.accentColor);
      setGrayColor(theme.grayColor);
      setRadius(theme.radius);
      setScaling(theme.scaling);
      setCurrentTheme(themeKey);
      saveThemePreference('theme-current', themeKey);
    }
  };

  const getAvailableThemes = () => {
    const themes = themeRegistry.getAllThemes();
    return Object.entries(themes).map(([key, config]) => ({ key, config }));
  };

  const getPreconfiguredThemes = () => {
    const themes = themeRegistry.getPreconfiguredThemes();
    return Object.entries(themes).map(([key, config]) => ({ key, config }));
  };

  const getCustomThemes = () => {
    const themes = themeRegistry.getCustomThemes();
    return Object.entries(themes).map(([key, config]) => ({ key, config }));
  };

  const registerCustomTheme = (key: ThemeKey, theme: ThemeConfiguration) => {
    try {
      themeRegistry.registerTheme(key, theme);
      // Save custom themes to localStorage for persistence
      const customThemes = getCustomThemes();
      localStorage.setItem('custom-themes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Failed to register custom theme:', error);
    }
  };

  const unregisterCustomTheme = (key: ThemeKey) => {
    // Note: This would require extending the ThemeRegistry to support removal
    console.warn('Theme removal not yet implemented');
  };

  const contextValue: ThemeContextType = {
    appearance,
    accentColor,
    grayColor,
    radius,
    scaling,
    currentTheme,
    currentThemeConfig: themeRegistry.getTheme(currentTheme),
    toggleAppearance,
    setAccentColor: handleSetAccentColor,
    setGrayColor: handleSetGrayColor,
    setRadius: handleSetRadius,
    setScaling: handleSetScaling,
    setTheme,
    getAvailableThemes,
    getPreconfiguredThemes,
    getCustomThemes,
    registerCustomTheme,
    unregisterCustomTheme,
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

// Enhanced theme selector component
export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, getAvailableThemes } = useTheme();
  const themes = getAvailableThemes();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: '500' }}>Choose Theme:</label>
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--gray-1)',
          fontSize: '14px',
        }}
      >
        <optgroup label="Preconfigured Themes">
          {themes
            .filter(({ config }) => config.category === 'preconfigured')
            .map(({ key, config }) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
        </optgroup>
        {themes.some(({ config }) => config.category === 'custom') && (
          <optgroup label="Custom Themes">
            {themes
              .filter(({ config }) => config.category === 'custom')
              .map(({ key, config }) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
          </optgroup>
        )}
      </select>
    </div>
  );
};

// Custom theme creator component
export const CustomThemeCreator: React.FC = () => {
  const { registerCustomTheme } = useTheme();
  const [themeName, setThemeName] = useState('');
  const [themeKey, setThemeKey] = useState('');

  const handleCreateTheme = () => {
    if (themeName && themeKey) {
      const newTheme: ThemeConfiguration = {
        appearance: 'light',
        accentColor: 'blue',
        grayColor: 'slate',
        radius: 'medium',
        scaling: '100%',
        name: themeName,
        description: `Custom theme: ${themeName}`,
        category: 'custom',
        metadata: {
          author: 'User',
          version: '1.0.0',
          tags: ['custom'],
          compatibility: ['all'],
        },
      };

      registerCustomTheme(themeKey, newTheme);
      setThemeName('');
      setThemeKey('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '14px', fontWeight: '500' }}>Create Custom Theme:</label>
      <input
        type="text"
        placeholder="Theme name"
        value={themeName}
        onChange={(e) => setThemeName(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--gray-1)',
          fontSize: '14px',
        }}
      />
      <input
        type="text"
        placeholder="Theme key (unique identifier)"
        value={themeKey}
        onChange={(e) => setThemeKey(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--gray-1)',
          fontSize: '14px',
        }}
      />
      <button
        onClick={handleCreateTheme}
        disabled={!themeName || !themeKey}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid var(--gray-6)',
          backgroundColor: 'var(--blue-6)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          opacity: (!themeName || !themeKey) ? 0.5 : 1,
        }}
      >
        Create Theme
      </button>
    </div>
  );
};

export default AppThemeProvider;
