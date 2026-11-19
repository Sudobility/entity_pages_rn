/**
 * Vitest setup file.
 *
 * Mocks for the peer dependencies whose real modules need a React Native
 * runtime. Each stand-in keeps the behaviour a page relies on and nothing else.
 */
import React from 'react';
import { vi } from 'vitest';

// Mock @sudobility/types — the enum's real values, which the pages compare
// against (`entity.userRole === 'owner'`).
vi.mock('@sudobility/types', () => ({
  EntityRole: {
    OWNER: 'owner',
    MANAGER: 'manager',
    MEMBER: 'member',
  },
}));

// NativeWind is only asked to register the Svg interop.
vi.mock('nativewind', () => ({ cssInterop: vi.fn() }));

// Mock @sudobility/components-rn: plain DOM stand-ins for the primitives the
// pages use.
vi.mock('@sudobility/components-rn', () => {
  const textField =
    (testId: string, tag: 'input' | 'textarea') =>
    ({ value, onChangeText, placeholder, accessibilityLabel }: any) =>
      React.createElement(tag, {
        'data-testid': testId,
        'aria-label': accessibilityLabel,
        value: value ?? '',
        placeholder,
        onChange: (e: any) => onChangeText?.(e.target.value),
      });

  return {
    cn: (...parts: unknown[]) => parts.filter(Boolean).join(' '),
    pressProps: (onPress: unknown) => ({ onPress: onPress ?? undefined }),
    Input: textField('Input', 'input'),
    TextArea: textField('TextArea', 'textarea'),
    Skeleton: () => React.createElement('div', { 'data-testid': 'Skeleton' }),
    FormModal: ({
      visible,
      title,
      onClose,
      onSave,
      saveLabel,
      children,
    }: any) =>
      visible
        ? React.createElement(
            'div',
            { 'data-testid': 'FormModal' },
            React.createElement('h2', null, title),
            children,
            React.createElement(
              'button',
              { 'data-testid': 'FormModal-close', onClick: onClose },
              'Close'
            ),
            React.createElement(
              'button',
              { 'data-testid': 'FormModal-save', onClick: onSave },
              saveLabel
            )
          )
        : null,
    Modal: ({ isOpen, title, children }: any) =>
      isOpen
        ? React.createElement(
            'div',
            { 'data-testid': 'Modal' },
            React.createElement('h2', null, title),
            children
          )
        : null,
    ModalContent: ({ children }: any) =>
      React.createElement('div', null, children),
  };
});
