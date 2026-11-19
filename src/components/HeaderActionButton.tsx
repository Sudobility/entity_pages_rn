/**
 * @fileoverview Header Action Button
 *
 * The compact primary button in a page header ("+ New Organization",
 * "+ Invite"), as on the web.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { pressProps } from '@sudobility/components-rn';
import { PlusIcon } from './icons';

export interface HeaderActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Whether the panel this button toggles is open. */
  expanded?: boolean;
}

export function HeaderActionButton({
  label,
  onPress,
  accessibilityLabel,
  expanded,
}: HeaderActionButtonProps) {
  return (
    <Pressable
      {...pressProps(onPress)}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      className='shrink-0 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 active:opacity-80'
    >
      <PlusIcon size={16} className='text-primary-foreground' />
      <Text className='text-sm font-medium text-primary-foreground'>
        {label}
      </Text>
    </Pressable>
  );
}
