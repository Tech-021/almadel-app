/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB';
const tintColorDark = '#93C5FD';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F6F8FC',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    background: '#080D18',
    tint: tintColorDark,
    icon: '#CBD5E1',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const InventoryTheme = {
  light: {
    accent: "#2563EB",
    accentSoft: "#DBEAFE",
    background: "#F6F8FC",
    border: "#E2E8F0",
    card: "#FFFFFF",
    danger: "#DC2626",
    dangerSoft: "#FEF2F2",
    muted: "#64748B",
    mutedSoft: "#F1F5F9",
    shadow: "#0F172A",
    success: "#0F766E",
    successSoft: "#ECFDF5",
    text: "#0F172A",
    warning: "#F59E0B",
    warningSoft: "#FFFBEB",
  },
  dark: {
    accent: "#60A5FA",
    accentSoft: "#172554",
    background: "#080D18",
    border: "#1E293B",
    card: "#111827",
    danger: "#F87171",
    dangerSoft: "#3F1D25",
    muted: "#CBD5E1",
    mutedSoft: "#172033",
    shadow: "#000000",
    success: "#5EEAD4",
    successSoft: "#113A3A",
    text: "#F8FAFC",
    warning: "#FBBF24",
    warningSoft: "#3B2B12",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
