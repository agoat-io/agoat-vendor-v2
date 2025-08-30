import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Separator,
  Card,
  CardContent,
  Select,
  Label
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
    getAvailableThemes,
    getPreconfiguredThemes,
    getCustomThemes
  } = useTheme();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'themes' | 'appearance' | 'advanced'>('themes');

  const allThemes = getAvailableThemes();
  const preconfiguredThemes = getPreconfiguredThemes();
  const customThemes = getCustomThemes();

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

  const grayColorOptions = [
    { value: 'gray', label: 'Gray' },
    { value: 'mauve', label: 'Mauve' },
    { value: 'slate', label: 'Slate' },
    { value: 'sage', label: 'Sage' },
    { value: 'olive', label: 'Olive' },
    { value: 'sand', label: 'Sand' },
  ];

  const radiusOptions = [
    { value: 'none', label: 'None' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'full', label: 'Full' },
  ];

  const scalingOptions = [
    { value: '90%', label: '90%' },
    { value: '95%', label: '95%' },
    { value: '100%', label: '100%' },
    { value: '105%', label: '105%' },
    { value: '110%', label: '110%' },
  ];

  const handleThemeCardClick = (themeKey: string) => {
    setTheme(themeKey);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
          aria-label="Open configuration panel"
        >
          <GearIcon width="20" height="20" />
        </Button>
      </DialogTrigger>

      <DialogContent size="4" style={{ maxWidth: '600px', maxHeight: '80vh' }}>
        <DialogHeader>
          <DialogTitle>
            <Flex align="center" gap="2">
              <MixIcon />
              Theme Configuration
            </Flex>
          </DialogTitle>
        </DialogHeader>

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
        <Card mb="4">
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === 'themes' && (
          <Box>
            <Text size="3" weight="medium" mb="3">Theme Selection</Text>
            
            {/* Simple Theme Selector */}
            <Box mb="4">
              <Label size="2" weight="medium" mb="2">Choose Theme:</Label>
              <Select value={currentTheme} onValueChange={(value) => setTheme(value)}>
                <Select.Item value="">Select a theme...</Select.Item>
                {allThemes.map(({ key, config }) => (
                  <Select.Item key={key} value={key}>
                    {config.name} ({config.category})
                  </Select.Item>
                ))}
              </Select>
            </Box>
            
            <Separator my="4" />
            
            <Text size="3" weight="medium" mb="3">Available Themes</Text>
            <Flex direction="column" gap="2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allThemes.map(({ key, config }) => (
                <Card 
                  key={key} 
                  style={{ 
                    cursor: 'pointer',
                    border: currentTheme === key ? '2px solid var(--accent-color)' : '1px solid var(--gray-6)',
                    backgroundColor: currentTheme === key ? 'var(--accent-color-1)' : undefined,
                  }} 
                  onClick={() => handleThemeCardClick(key)}
                >
                  <CardContent>
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
                  </CardContent>
                </Card>
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

            <Separator mb="4" />

            {/* Accent Color */}
            <Box mb="4">
              <Label size="2" weight="medium" mb="2">Accent Color</Label>
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

            <Separator mb="4" />

            {/* Gray Color */}
            <Box mb="4">
              <Label size="2" weight="medium" mb="2">Gray Color</Label>
              <Select value={grayColor} onValueChange={(value) => setGrayColor(value as any)}>
                {grayColorOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
            </Box>
          </Box>
        )}

        {activeTab === 'advanced' && (
          <Box>
            <Text size="3" weight="medium" mb="3">Advanced Settings</Text>
            
            {/* Border Radius */}
            <Box mb="4">
              <Label size="2" weight="medium" mb="2">Border Radius</Label>
              <Select value={radius} onValueChange={(value) => setRadius(value as any)}>
                {radiusOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
            </Box>

            <Separator mb="4" />

            {/* Scaling */}
            <Box mb="4">
              <Label size="2" weight="medium" mb="2">Scaling</Label>
              <Select value={scaling} onValueChange={(value) => setScaling(value as any)}>
                {scalingOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
            </Box>

            <Separator mb="4" />

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
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationPanel;
