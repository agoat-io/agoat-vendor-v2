import React, { useState } from 'react';
import { 
  Box,
  Flex,
  Text,
  Button,
  Badge
} from '@radix-ui/themes';
import { 
  GearIcon, 
  MixIcon, 
  PaletteIcon, 
  EyeOpenIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  Cross2Icon
} from '@radix-ui/react-icons';
import { useTheme } from './ThemeProvider';

interface ConfigurationPanelProps {
  children?: React.ReactNode;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ children }) => {
  const { 
    appearance, 
    accentColor, 
    grayColor, 
    radius, 
    scaling,
    currentTheme,
    currentThemeConfig,
    toggleAppearance,
    setAccentColor,
    setGrayColor,
    setRadius,
    setScaling,
    setTheme,
    getAvailableThemes
  } = useTheme();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'themes' | 'appearance' | 'advanced'>('themes');

  const allThemes = getAvailableThemes();

  const accentColorOptions = [
    { value: 'blue', label: 'Blue', color: 'var(--blue-9)' },
    { value: 'green', label: 'Green', color: 'var(--green-9)' },
    { value: 'red', label: 'Red', color: 'var(--red-9)' },
    { value: 'yellow', label: 'Yellow', color: 'var(--yellow-9)' },
    { value: 'purple', label: 'Purple', color: 'var(--purple-9)' },
    { value: 'orange', label: 'Orange', color: 'var(--orange-9)' },
    { value: 'pink', label: 'Pink', color: 'var(--pink-9)' },
    { value: 'gray', label: 'Gray', color: 'var(--gray-9)' },
  ];

  const handleThemeCardClick = (themeKey: string) => {
    setTheme(themeKey);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="3"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          padding: '0',
          backgroundColor: 'var(--gray-1)',
          border: '1px solid var(--gray-6)',
          boxShadow: 'var(--shadow-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setOpen(true)}
        aria-label="Open configuration panel"
      >
        <GearIcon width="20" height="20" />
      </Button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        backgroundColor: 'var(--gray-1)',
        border: '1px solid var(--gray-6)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow-4)',
      }}
    >
      {/* Header */}
      <Flex justify="between" align="center" mb="4">
        <Flex align="center" gap="2">
          <MixIcon />
          <Text size="4" weight="bold">Theme Configuration</Text>
        </Flex>
        <Button
          variant="ghost"
          size="2"
          onClick={() => setOpen(false)}
          aria-label="Close configuration panel"
        >
          <Cross2Icon />
        </Button>
      </Flex>

      {/* Tab Navigation */}
      <Flex gap="1" mb="4">
        <Button
          variant={activeTab === 'themes' ? 'solid' : 'soft'}
          size="2"
          onClick={() => setActiveTab('themes')}
        >
          <PaletteIcon />
          Themes
        </Button>
        <Button
          variant={activeTab === 'appearance' ? 'solid' : 'soft'}
          size="2"
          onClick={() => setActiveTab('appearance')}
        >
          <EyeOpenIcon />
          Appearance
        </Button>
        <Button
          variant={activeTab === 'advanced' ? 'solid' : 'soft'}
          size="2"
          onClick={() => setActiveTab('advanced')}
        >
          <GearIcon />
          Advanced
        </Button>
      </Flex>

      {/* Current Theme Info */}
      <Box mb="4" style={{ padding: '12px', backgroundColor: 'var(--gray-2)', borderRadius: '6px' }}>
        <Flex justify="between" align="center">
          <Box>
            <Text size="3" weight="medium">Current Theme</Text>
            <Text size="2" color="gray">{currentThemeConfig?.name || currentTheme}</Text>
          </Box>
          <Badge 
            color={currentThemeConfig?.category === 'custom' ? 'purple' : 'blue'}
            variant="soft"
          >
            {currentThemeConfig?.category || 'Unknown'}
          </Badge>
        </Flex>
      </Box>

      {/* Tab Content */}
      {activeTab === 'themes' && (
        <Box>
          <Text size="3" weight="medium" mb="3">Available Themes</Text>
          <Flex direction="column" gap="2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {allThemes.map(({ key, config }) => (
              <Box
                key={key}
                style={{
                  padding: '12px',
                  border: currentTheme === key ? '2px solid var(--accent-color)' : '1px solid var(--gray-6)',
                  borderRadius: '6px',
                  backgroundColor: currentTheme === key ? 'var(--accent-color-1)' : 'var(--gray-1)',
                  cursor: 'pointer',
                }}
                onClick={() => handleThemeCardClick(key)}
              >
                <Flex justify="between" align="center">
                  <Box>
                    <Text size="2" weight="medium">{config.name}</Text>
                    <Text size="1" color="gray">{config.description}</Text>
                  </Box>
                  <Flex gap="2" align="center">
                    <Badge size="1" variant="soft" color={config.category === 'custom' ? 'purple' : 'blue'}>
                      {config.category}
                    </Badge>
                    {currentTheme === key && (
                      <CheckIcon color="var(--accent-color)" />
                    )}
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      {activeTab === 'appearance' && (
        <Box>
          <Text size="3" weight="medium" mb="3">Appearance Settings</Text>
          
          {/* Light/Dark Mode Toggle */}
          <Flex justify="between" align="center" mb="4">
            <Box>
              <Text size="2" weight="medium">Appearance Mode</Text>
              <Text size="1" color="gray">Switch between light and dark themes</Text>
            </Box>
            <Button
              variant="soft"
              size="2"
              onClick={toggleAppearance}
            >
              {appearance === 'light' ? <MoonIcon /> : <SunIcon />}
              {appearance === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
          </Flex>

          {/* Accent Color */}
          <Box mb="4">
            <Text size="2" weight="medium" mb="2">Accent Color</Text>
            <Flex gap="2" wrap="wrap">
              {accentColorOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={accentColor === option.value ? 'solid' : 'soft'}
                  size="2"
                  onClick={() => setAccentColor(option.value as any)}
                  style={{
                    backgroundColor: accentColor === option.value ? option.color : undefined,
                    border: `2px solid ${option.color}`,
                    minWidth: '60px',
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Flex>
          </Box>
        </Box>
      )}

      {activeTab === 'advanced' && (
        <Box>
          <Text size="3" weight="medium" mb="3">Advanced Settings</Text>
          
          {/* Theme Information */}
          <Box>
            <Text size="2" weight="medium" mb="2">Current Configuration</Text>
            <Box
              style={{
                backgroundColor: 'var(--gray-2)',
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            >
              <pre>
                {JSON.stringify({
                  appearance,
                  accentColor,
                  grayColor,
                  radius,
                  scaling,
                  currentTheme,
                }, null, 2)}
              </pre>
            </Box>
          </Box>
        </Box>
      )}

      {/* Footer Actions */}
      <Flex gap="2" justify="end" mt="4">
        <Button variant="soft" onClick={() => setOpen(false)}>
          <Cross2Icon />
          Close
        </Button>
        <Button onClick={() => setOpen(false)}>
          <CheckIcon />
          Apply
        </Button>
      </Flex>
    </div>
  );
};

export default ConfigurationPanel;
