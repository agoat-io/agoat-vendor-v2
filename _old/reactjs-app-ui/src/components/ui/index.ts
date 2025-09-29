// UI Components Library
// Implements Radix Themes wrapper components as per NFR-UI-001 requirements

export { default as Button, Button as ButtonComponent } from './Button';
export { default as Card, Card as CardComponent, CardHeader, CardContent, CardFooter } from './Card';
export { default as Container, Container as ContainerComponent, ResponsiveContainer, SectionContainer } from './Container';

// Re-export commonly used Radix Themes components
export {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,
  Spinner,
  Separator,
  Avatar,
  Dialog,
  DropdownMenu,
  TextField,
  TextArea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  Progress,
  Tabs,
  AlertDialog,
  ContextMenu,
  HoverCard,
  Popover,
  ScrollArea,
  Table,
  Tooltip,
} from '@radix-ui/themes';

// Export design system configuration
export { default as designSystem } from '../../config/design-system';
export type { ThemeConfiguration } from '../../config/design-system';
export { 
  DESIGN_TOKENS, 
  COMPONENT_TOKENS, 
  THEME_CONFIG, 
  PRECONFIGURED_THEMES,
  CUSTOM_THEMES,
  themeRegistry,
  spacing, 
  responsive 
} from '../../config/design-system';

// Export theme management components
export { 
  useTheme, 
  ThemeToggle, 
  ThemeSelector,
  CustomThemeCreator
} from '../ThemeProvider';

// Export configuration panel
export { default as ConfigurationPanel } from '../ConfigurationPanel';
