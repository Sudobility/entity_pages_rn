/**
 * @fileoverview Invitation Form
 *
 * Email, role and a send button, for inviting a member to an entity. RN
 * counterpart of the web's `InvitationForm`; it validates the same way and
 * shows a failed send inline, under the row.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Input, cn, pressProps } from '@sudobility/components-rn';
import { EntityRole, type InviteMemberRequest } from '@sudobility/types';
import { MemberRoleSelector } from './MemberRoleSelector';
import { PaperAirplaneIcon } from './icons';

export interface InvitationFormProps {
  /** Submit handler; a rejection is shown as the form's error */
  onSubmit: (request: InviteMemberRequest) => Promise<void>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Default role for new invitations */
  defaultRole?: EntityRole;
}

export function InvitationForm({
  onSubmit,
  isSubmitting = false,
  defaultRole = EntityRole.MEMBER,
}: InvitationFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EntityRole>(defaultRole);
  const [error, setError] = useState<string | null>(null);

  const cannotSubmit = isSubmitting || !email.trim();

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onSubmit({ email: email.trim(), role });
      setEmail('');
      setRole(defaultRole);
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation');
    }
  };

  return (
    <View className='gap-3'>
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder='Enter email address'
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
        autoComplete='email'
        returnKeyType='send'
        onSubmitEditing={handleSubmit}
        disabled={isSubmitting}
        error={!!error}
        accessibilityLabel='Email address'
      />

      <View className='flex-row items-center justify-between gap-2'>
        <MemberRoleSelector
          value={role}
          onChange={setRole}
          disabled={isSubmitting}
        />

        <Pressable
          {...pressProps(handleSubmit, cannotSubmit)}
          disabled={cannotSubmit}
          accessibilityRole='button'
          accessibilityLabel='Send invitation'
          accessibilityState={{ disabled: cannotSubmit, busy: isSubmitting }}
          className={cn(
            'flex-row items-center gap-2 rounded-lg bg-primary px-4 py-2 active:opacity-80',
            cannotSubmit && 'opacity-50'
          )}
        >
          {isSubmitting ? (
            <ActivityIndicator size='small' />
          ) : (
            <PaperAirplaneIcon size={16} className='text-primary-foreground' />
          )}
          <Text className='text-sm font-medium text-primary-foreground'>
            Invite
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text className='text-sm text-destructive' accessibilityRole='alert'>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Validate email format */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
