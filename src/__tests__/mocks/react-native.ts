/**
 * Mock implementation of react-native for Vitest.
 * Used as an alias to avoid parsing Flow types in the actual RN package.
 */
import React from 'react';
import { vi } from 'vitest';

const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 1,
  flatten: (style: unknown) => style,
};

const createMockComponent = (name: string, tag = 'div') => {
  const Component = ({ onPress, children, ...rest }: Record<string, any>) => {
    const domProps: Record<string, any> = { ...rest, 'data-testid': name };
    if (onPress) domProps.onClick = onPress;
    return React.createElement(tag, domProps, children);
  };
  Component.displayName = name;
  return Component;
};

export const View = createMockComponent('View');
export const Text = createMockComponent('Text', 'span');
export const TextInput = createMockComponent('TextInput', 'input');
export const TouchableOpacity = createMockComponent('TouchableOpacity');
export const ScrollView = ({
  onPress,
  children,
  // Scroller-only props: nothing a DOM node understands.
  refreshControl: _refreshControl,
  contentContainerStyle: _contentContainerStyle,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  ...rest
}: Record<string, any>) => {
  const domProps: Record<string, any> = {
    ...rest,
    'data-testid': 'ScrollView',
  };
  if (onPress) domProps.onClick = onPress;
  return React.createElement('div', domProps, children);
};
export const RefreshControl = () => null;
export const ActivityIndicator = createMockComponent('ActivityIndicator');
export const Pressable = ({
  onPress,
  disabled,
  children,
  hitSlop: _hitSlop,
  onAccessibilityTap: _onAccessibilityTap,
  ...rest
}: Record<string, any>) => {
  const domProps: Record<string, any> = { ...rest, 'data-testid': 'Pressable' };
  // Like the real one: a disabled Pressable does not fire.
  if (onPress && !disabled) domProps.onClick = onPress;
  if (disabled) domProps['aria-disabled'] = 'true';
  return React.createElement('div', domProps, children);
};
export const Image = createMockComponent('Image', 'img');
export const SafeAreaView = createMockComponent('SafeAreaView');

/**
 * FlatList mock that renders items via renderItem, ListEmptyComponent, and ListFooterComponent.
 */
export const FlatList = (props: Record<string, any>) => {
  const {
    data = [],
    renderItem,
    keyExtractor,
    ListEmptyComponent,
    ListFooterComponent,
  } = props;

  const children: React.ReactNode[] = [];

  if (data.length === 0 && ListEmptyComponent) {
    children.push(
      React.createElement(
        React.Fragment,
        { key: '__empty' },
        typeof ListEmptyComponent === 'function'
          ? React.createElement(ListEmptyComponent)
          : ListEmptyComponent
      )
    );
  } else if (renderItem) {
    data.forEach((item: any, index: number) => {
      const key = keyExtractor ? keyExtractor(item, index) : String(index);
      children.push(
        React.createElement(
          React.Fragment,
          { key },
          renderItem({ item, index, separators: {} })
        )
      );
    });
  }

  if (ListFooterComponent) {
    children.push(
      React.createElement(
        React.Fragment,
        { key: '__footer' },
        typeof ListFooterComponent === 'function'
          ? React.createElement(ListFooterComponent)
          : ListFooterComponent
      )
    );
  }

  return React.createElement('div', { 'data-testid': 'FlatList' }, ...children);
};

export const Alert = {
  alert: vi.fn(),
};

export const Platform = {
  OS: 'ios' as string,
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
};

export const useColorScheme = vi.fn(() => 'light');

export { StyleSheet };
