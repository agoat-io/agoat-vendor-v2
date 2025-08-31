// UI Components Library for Unified App
// Simplified version without Module Federation

export { default as Button } from './Button';
export { default as Card, CardHeader, CardContent, CardFooter } from './Card';
export { default as Container } from './Container';
export { default as Spinner } from './Spinner';

// Re-export commonly used Radix Themes components
export {
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  Badge,

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

  Tabs,
  AlertDialog,
  ContextMenu,
  HoverCard,
  Popover,
  ScrollArea,
  Table,
  Tooltip,
} from '@radix-ui/themes';

// Export theme management components
export { 
  useTheme, 
  ThemeToggle, 
  ThemeSelector
} from '../ThemeProvider';
