import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Card, 
  CardContent, 
  Button, 
  Badge,
  Container,
  ThemeToggle,
  ThemeSelector,
  CustomThemeCreator,
  useTheme,
  PRECONFIGURED_THEMES,
  CUSTOM_THEMES
} from '../src/components/ui';
import { 
  PersonIcon, 
  ReaderIcon, 
  Pencil1Icon, 
  HeartIcon,
  StarIcon,
  CheckIcon,
  PlusIcon
} from '@radix-ui/react-icons';

const ThemeDemo: React.FC = () => {
  const { 
    currentTheme, 
    currentThemeConfig,
    getAvailableThemes, 
    getPreconfiguredThemes,
    getCustomThemes 
  } = useTheme();
  
  const allThemes = getAvailableThemes();
  const preconfiguredThemes = getPreconfiguredThemes();
  const customThemes = getCustomThemes();

  return (
    <Container>
      <Box py="6">
        {/* Header */}
        <Box mb="8">
          <Heading size="8" mb="3">Radix Themes Extensible Demo</Heading>
          <Text size="4" color="gray" mb="6">
            Explore preconfigured Radix Themes combinations and create custom theme combinations
          </Text>
          
          {/* Theme Controls */}
          <Card mb="6">
            <CardContent>
              <Flex gap="6" align="center" wrap="wrap">
                <Box>
                  <Text size="3" weight="medium" mb="2">Current Theme:</Text>
                  <Badge size="2" variant="soft">
                    {currentThemeConfig?.name || currentTheme}
                  </Badge>
                  {currentThemeConfig?.category === 'custom' && (
                    <Badge size="1" color="purple" variant="soft" ml="2">
                      Custom
                    </Badge>
                  )}
                </Box>
                
                <ThemeSelector />
                <ThemeToggle />
              </Flex>
            </CardContent>
          </Card>
        </Box>

        {/* Theme Categories */}
        <Box mb="8">
          <Heading size="6" mb="4">Theme Categories</Heading>
          <Flex gap="4" wrap="wrap">
            <Card style={{ minWidth: '200px' }}>
              <CardContent>
                <Text size="3" weight="medium" mb="1">Preconfigured Themes</Text>
                <Text size="2" color="gray" mb="3">
                  {preconfiguredThemes.length} built-in Radix Themes combinations
                </Text>
                <Badge size="1" variant="soft" color="blue">
                  Foundation
                </Badge>
              </CardContent>
            </Card>

            <Card style={{ minWidth: '200px' }}>
              <CardContent>
                <Text size="3" weight="medium" mb="1">Custom Themes</Text>
                <Text size="2" color="gray" mb="3">
                  {customThemes.length} user-created theme combinations
                </Text>
                <Badge size="1" variant="soft" color="purple">
                  Extensible
                </Badge>
              </CardContent>
            </Card>

            <Card style={{ minWidth: '200px' }}>
              <CardContent>
                <Text size="3" weight="medium" mb="1">Total Themes</Text>
                <Text size="2" color="gray" mb="3">
                  {allThemes.length} available theme combinations
                </Text>
                <Badge size="1" variant="soft" color="green">
                  Active
                </Badge>
              </CardContent>
            </Card>
          </Flex>
        </Box>

        {/* Preconfigured Themes */}
        <Box mb="8">
          <Heading size="6" mb="4">Preconfigured Radix Themes (Foundation)</Heading>
          <Text size="3" color="gray" mb="4">
            These are the built-in Radix Themes combinations that serve as the foundation for the design system.
          </Text>
          <Flex gap="4" wrap="wrap">
            {preconfiguredThemes.map(({ key, config }) => (
              <Card key={key} style={{ minWidth: '200px' }}>
                <CardContent>
                  <Text size="3" weight="medium" mb="1">{config.name}</Text>
                  <Text size="2" color="gray" mb="3">{config.description}</Text>
                  <Flex gap="2" mb="3">
                    <Badge size="1" variant="soft">
                      {config.appearance}
                    </Badge>
                    <Badge size="1" variant="soft" color={config.accentColor}>
                      {config.accentColor}
                    </Badge>
                    <Badge size="1" variant="soft">
                      {config.radius}
                    </Badge>
                  </Flex>
                  <Badge size="1" variant="soft" color="blue">
                    {config.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </Flex>
        </Box>

        {/* Custom Themes */}
        {customThemes.length > 0 && (
          <Box mb="8">
            <Heading size="6" mb="4">Custom Theme Combinations</Heading>
            <Text size="3" color="gray" mb="4">
              These are user-created theme combinations that extend the Radix Themes foundation.
            </Text>
            <Flex gap="4" wrap="wrap">
              {customThemes.map(({ key, config }) => (
                <Card key={key} style={{ minWidth: '200px' }}>
                  <CardContent>
                    <Text size="3" weight="medium" mb="1">{config.name}</Text>
                    <Text size="2" color="gray" mb="3">{config.description}</Text>
                    <Flex gap="2" mb="3">
                      <Badge size="1" variant="soft">
                        {config.appearance}
                      </Badge>
                      <Badge size="1" variant="soft" color={config.accentColor}>
                        {config.accentColor}
                      </Badge>
                      <Badge size="1" variant="soft">
                        {config.radius}
                      </Badge>
                    </Flex>
                    <Flex gap="2" align="center">
                      <Badge size="1" variant="soft" color="purple">
                        {config.category}
                      </Badge>
                      {config.metadata?.author && (
                        <Text size="1" color="gray">
                          by {config.metadata.author}
                        </Text>
                      )}
                    </Flex>
                  </CardContent>
                </Card>
              ))}
            </Flex>
          </Box>
        )}

        {/* Custom Theme Creator */}
        <Box mb="8">
          <Heading size="6" mb="4">Create Custom Theme</Heading>
          <Text size="3" color="gray" mb="4">
            Extend the Radix Themes foundation by creating your own theme combinations.
          </Text>
          <Card>
            <CardContent>
              <CustomThemeCreator />
            </CardContent>
          </Card>
        </Box>

        {/* Component Showcase */}
        <Box mb="8">
          <Heading size="6" mb="4">Component Showcase</Heading>
          <Text size="3" color="gray" mb="4">
            See how components look with the current theme: {currentThemeConfig?.name}
          </Text>
          
          {/* Buttons */}
          <Card mb="6">
            <CardContent>
              <Heading size="4" mb="3">Buttons</Heading>
              <Flex gap="3" wrap="wrap">
                <Button>Primary Button</Button>
                <Button variant="soft">Soft Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button color="green">Green Button</Button>
                <Button color="red">Red Button</Button>
                <Button size="1">Small</Button>
                <Button size="4">Large</Button>
              </Flex>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card mb="6">
            <CardContent>
              <Heading size="4" mb="3">Cards</Heading>
              <Flex gap="4" wrap="wrap">
                <Card style={{ minWidth: '250px' }}>
                  <CardContent>
                    <Flex align="center" gap="2" mb="2">
                      <PersonIcon />
                      <Text weight="medium">User Profile</Text>
                    </Flex>
                    <Text size="2" color="gray" mb="3">
                      This is a sample card component showing how content looks in the current theme.
                    </Text>
                    <Flex gap="2">
                      <Button size="2" variant="soft">
                        <HeartIcon />
                        Like
                      </Button>
                      <Button size="2" variant="outline">
                        <Pencil1Icon />
                        Edit
                      </Button>
                    </Flex>
                  </CardContent>
                </Card>

                <Card style={{ minWidth: '250px' }}>
                  <CardContent>
                    <Flex align="center" gap="2" mb="2">
                      <ReaderIcon />
                      <Text weight="medium">Article Preview</Text>
                    </Flex>
                    <Text size="2" color="gray" mb="3">
                      Another card example with different content to demonstrate theme consistency.
                    </Text>
                    <Flex gap="2" align="center">
                      <Badge color="green" variant="soft">
                        <CheckIcon />
                        Published
                      </Badge>
                      <Text size="1" color="gray">2 hours ago</Text>
                    </Flex>
                  </CardContent>
                </Card>
              </Flex>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card mb="6">
            <CardContent>
              <Heading size="4" mb="3">Typography</Heading>
              <Box>
                <Heading size="8" mb="2">Heading 8 - Large Title</Heading>
                <Heading size="6" mb="2">Heading 6 - Section Title</Heading>
                <Heading size="4" mb="2">Heading 4 - Subsection</Heading>
                <Text size="4" mb="2">
                  Body text size 4 - This is the main body text that users will read most of the time.
                </Text>
                <Text size="3" mb="2">
                  Body text size 3 - Slightly smaller text for secondary content.
                </Text>
                <Text size="2" color="gray" mb="2">
                  Body text size 2 - Small text for captions and metadata.
                </Text>
                <Text size="1" color="gray">
                  Body text size 1 - Very small text for fine print.
                </Text>
              </Box>
            </CardContent>
          </Card>

          {/* Badges and Status */}
          <Card mb="6">
            <CardContent>
              <Heading size="4" mb="3">Badges & Status</Heading>
              <Flex gap="3" wrap="wrap">
                <Badge>Default</Badge>
                <Badge color="blue">Blue</Badge>
                <Badge color="green">Success</Badge>
                <Badge color="red">Error</Badge>
                <Badge color="yellow">Warning</Badge>
                <Badge color="purple">Purple</Badge>
                <Badge variant="soft">Soft</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge size="1">Small</Badge>
                <Badge size="2">Medium</Badge>
              </Flex>
            </CardContent>
          </Card>

          {/* Interactive Elements */}
          <Card>
            <CardContent>
              <Heading size="4" mb="3">Interactive Elements</Heading>
              <Flex gap="4" wrap="wrap">
                <Box>
                  <Text size="3" weight="medium" mb="2">Form Elements</Text>
                  <Flex direction="column" gap="2">
                    <input 
                      type="text" 
                      placeholder="Text input"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-6)',
                        backgroundColor: 'var(--gray-1)',
                        fontSize: '14px',
                      }}
                    />
                    <select
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-6)',
                        backgroundColor: 'var(--gray-1)',
                        fontSize: '14px',
                      }}
                    >
                      <option>Select option</option>
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select>
                  </Flex>
                </Box>

                <Box>
                  <Text size="3" weight="medium" mb="2">Links & Actions</Text>
                  <Flex direction="column" gap="2">
                    <a 
                      href="#" 
                      style={{ 
                        color: 'var(--blue-9)', 
                        textDecoration: 'none',
                        fontSize: '14px'
                      }}
                    >
                      Sample Link
                    </a>
                    <Button size="2" variant="ghost">
                      <StarIcon />
                      Add to Favorites
                    </Button>
                  </Flex>
                </Box>
              </Flex>
            </CardContent>
          </Card>
        </Box>

        {/* Theme Information */}
        <Card>
          <CardContent>
            <Heading size="4" mb="3">Current Theme Configuration</Heading>
            <Box style={{ 
              backgroundColor: 'var(--gray-2)', 
              padding: '16px', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <pre>
                {JSON.stringify(currentThemeConfig, null, 2)}
              </pre>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ThemeDemo;
