/**
 * @fileoverview Invitation List
 *
 * Pending invitations as one bordered, divided list. In `user` mode each row
 * names the organization and offers Accept / Decline; in `admin` mode it names
 * the invited email and offers a cancel. RN counterpart of the web's
 * `InvitationList`.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn, pressProps } from '@sudobility/components-rn';
import type { EntityInvitation } from '@sudobility/types';
import { RoleBadge } from './RoleBadge';
import {
  CheckIcon,
  ClockIcon,
  EnvelopeIcon,
  XCircleIcon,
  XMarkIcon,
} from './icons';

export interface InvitationListProps {
  /** Invitations to display; only pending ones are shown */
  invitations: EntityInvitation[];
  /** Mode: 'admin' for managing sent invitations, 'user' for viewing received */
  mode: 'admin' | 'user';
  /** Cancel invitation handler (admin mode); receives the invitation id */
  onCancel?: (invitationId: string) => void;
  /** Accept invitation handler (user mode); receives the token */
  onAccept?: (token: string) => void;
  /** Decline invitation handler (user mode); receives the token */
  onDecline?: (token: string) => void;
  /** Disables the row actions, e.g. while one is in flight */
  disabled?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

export function InvitationList({
  invitations,
  mode,
  onCancel,
  onAccept,
  onDecline,
  disabled = false,
  emptyMessage = 'No pending invitations',
}: InvitationListProps) {
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending'
  );

  if (pendingInvitations.length === 0) {
    return (
      <Text className='py-8 text-center text-base text-muted-foreground'>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <View className='overflow-hidden rounded-lg border border-border'>
      {pendingInvitations.map((invitation, index) => (
        <InvitationRow
          key={invitation.id}
          invitation={invitation}
          first={index === 0}
          mode={mode}
          disabled={disabled}
          onCancel={onCancel}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ))}
    </View>
  );
}

interface InvitationRowProps {
  invitation: EntityInvitation;
  first: boolean;
  mode: 'admin' | 'user';
  disabled: boolean;
  onCancel?: (invitationId: string) => void;
  onAccept?: (token: string) => void;
  onDecline?: (token: string) => void;
}

function InvitationRow({
  invitation,
  first,
  mode,
  disabled,
  onCancel,
  onAccept,
  onDecline,
}: InvitationRowProps) {
  const expiresAt = new Date(invitation.expiresAt);
  const isExpired = expiresAt.getTime() < Date.now();
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const name =
    mode === 'user' && invitation.entity
      ? invitation.entity.displayName
      : invitation.email;
  const acceptDisabled = disabled || isExpired;

  return (
    <View className={cn('gap-3 p-3', !first && 'border-t border-border')}>
      <View className='flex-row items-center gap-3'>
        {/* Icon */}
        <View className='h-10 w-10 items-center justify-center rounded-full bg-muted'>
          <EnvelopeIcon size={20} className='text-muted-foreground' />
        </View>

        {/* Info */}
        <View className='min-w-0 flex-1'>
          <View className='flex-row items-center gap-2'>
            <Text
              className='shrink text-base font-medium text-foreground'
              numberOfLines={1}
            >
              {name}
            </Text>
            <RoleBadge role={invitation.role} />
          </View>
          <View className='flex-row items-center gap-1.5'>
            <ClockIcon size={14} className='text-muted-foreground' />
            {isExpired ? (
              <Text className='text-sm text-destructive'>Expired</Text>
            ) : (
              <Text className='text-sm text-muted-foreground'>
                Expires in {daysUntilExpiry} days
              </Text>
            )}
          </View>
        </View>

        {/* Admin action */}
        {mode === 'admin' && onCancel ? (
          <Pressable
            {...pressProps(() => onCancel(invitation.id), disabled)}
            disabled={disabled}
            accessibilityRole='button'
            accessibilityLabel={`Cancel invitation to ${invitation.email}`}
            hitSlop={8}
            className='rounded p-1.5 active:bg-destructive/10'
          >
            <XCircleIcon size={18} className='text-muted-foreground' />
          </Pressable>
        ) : null}
      </View>

      {/* User actions: on their own line, so a long name keeps its room */}
      {mode === 'user' && (onDecline || onAccept) ? (
        <View className='flex-row items-center justify-end gap-2'>
          {onDecline ? (
            <Pressable
              {...pressProps(() => onDecline(invitation.token), disabled)}
              disabled={disabled}
              accessibilityRole='button'
              accessibilityLabel={`Decline invitation to ${name}`}
              accessibilityState={{ disabled }}
              className={cn(
                'flex-row items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 active:bg-muted',
                disabled && 'opacity-50'
              )}
            >
              <XMarkIcon size={16} className='text-foreground' />
              <Text className='text-sm text-foreground'>Decline</Text>
            </Pressable>
          ) : null}
          {onAccept ? (
            <Pressable
              {...pressProps(() => onAccept(invitation.token), acceptDisabled)}
              disabled={acceptDisabled}
              accessibilityRole='button'
              accessibilityLabel={`Accept invitation to ${name}`}
              accessibilityState={{ disabled: acceptDisabled }}
              className={cn(
                'flex-row items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 active:opacity-80',
                acceptDisabled && 'opacity-50'
              )}
            >
              <CheckIcon size={16} className='text-primary-foreground' />
              <Text className='text-sm text-primary-foreground'>Accept</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
