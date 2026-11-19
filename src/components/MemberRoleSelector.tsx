/**
 * @fileoverview Member Role Selector
 *
 * A compact trigger showing the current role; pressing it opens the list of
 * roles, each with its icon and what it grants. RN counterpart of the web's
 * `MemberRoleSelector` dropdown — the menu is a modal here, since a popover
 * anchored to a row has no room on a phone.
 */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Modal, ModalContent, cn, pressProps } from '@sudobility/components-rn';
import { EntityRole } from '@sudobility/types';
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  ShieldCheckIcon,
  type IconProps,
} from './icons';

export interface MemberRoleSelectorProps {
  /** Current role value */
  value: EntityRole;
  /** Change handler */
  onChange: (role: EntityRole) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

interface RoleOption {
  value: EntityRole;
  label: string;
  description: string;
  icon: React.ComponentType<IconProps>;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    value: EntityRole.OWNER,
    label: 'Owner',
    description: 'Full access to all settings and members',
    icon: ShieldCheckIcon,
    color: 'text-accent-foreground',
  },
  {
    value: EntityRole.MANAGER,
    label: 'Manager',
    description: 'Can manage projects and API keys',
    icon: BriefcaseIcon,
    color: 'text-primary',
  },
  {
    value: EntityRole.MEMBER,
    label: 'Member',
    description: 'Read-only access',
    icon: EyeIcon,
    color: 'text-muted-foreground',
  },
];

export function MemberRoleSelector({
  value,
  onChange,
  disabled = false,
}: MemberRoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedRole =
    roleOptions.find(r => r.value === value) || roleOptions[2];
  const SelectedIcon = selectedRole.icon;

  const handleSelect = (role: EntityRole) => {
    onChange(role);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        {...pressProps(() => setIsOpen(true), disabled)}
        disabled={disabled}
        accessibilityRole='button'
        accessibilityLabel={`Role: ${selectedRole.label}`}
        accessibilityState={{ disabled, expanded: isOpen }}
        className={cn(
          'flex-row items-center gap-1.5 rounded border border-border bg-background px-2 py-1.5',
          disabled ? 'opacity-50' : 'active:bg-muted'
        )}
      >
        <SelectedIcon size={14} className={selectedRole.color} />
        <Text className='text-sm text-foreground'>{selectedRole.label}</Text>
        <ChevronDownIcon size={14} className='text-muted-foreground' />
      </Pressable>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title='Roles'
        size='medium'
      >
        <ModalContent className='px-0 py-1'>
          {roleOptions.map(option => {
            const OptionIcon = option.icon;
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                {...pressProps(() => handleSelect(option.value))}
                accessibilityRole='button'
                accessibilityLabel={`${option.label}. ${option.description}`}
                accessibilityState={{ selected }}
                className={cn(
                  'flex-row items-start gap-2 px-4 py-3 active:bg-muted',
                  selected && 'bg-muted'
                )}
              >
                <View className='mt-0.5'>
                  <OptionIcon size={16} className={option.color} />
                </View>
                <View className='min-w-0 flex-1'>
                  <View className='flex-row items-center gap-2'>
                    <Text className='text-sm font-medium text-foreground'>
                      {option.label}
                    </Text>
                    {selected ? (
                      <CheckIcon size={14} className='text-primary' />
                    ) : null}
                  </View>
                  <Text className='text-xs text-muted-foreground'>
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ModalContent>
      </Modal>
    </>
  );
}
