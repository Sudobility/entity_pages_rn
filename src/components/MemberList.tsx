/**
 * @fileoverview Member List
 *
 * The members of an entity as one bordered, divided list: avatar, name and
 * email, then the role — a selector for someone who can manage it, a badge
 * otherwise — and a remove control. RN counterpart of the web's `MemberList`.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn, pressProps } from '@sudobility/components-rn';
import type { EntityMember, EntityRole } from '@sudobility/types';
import { MemberRoleSelector } from './MemberRoleSelector';
import { RoleBadge } from './RoleBadge';
import { TrashIcon, UserIcon } from './icons';

export interface MemberListProps {
  /** Members to display */
  members: EntityMember[];
  /** Current user's ID (to identify self) */
  currentUserId?: string;
  /** Whether current user can manage members */
  canManage?: boolean;
  /** Role change handler; receives the member's user id */
  onRoleChange?: (userId: string, role: EntityRole) => void;
  /** Remove member handler; receives the member's user id */
  onRemove?: (userId: string) => void;
  /** Empty state message */
  emptyMessage?: string;
}

export function MemberList({
  members,
  currentUserId,
  canManage = false,
  onRoleChange,
  onRemove,
  emptyMessage = 'No members found',
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <Text className='py-8 text-center text-base text-muted-foreground'>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <View className='overflow-hidden rounded-lg border border-border'>
      {members.map((member, index) => (
        <MemberRow
          key={member.id}
          member={member}
          first={index === 0}
          isSelf={member.userId === currentUserId}
          canManage={canManage}
          onRoleChange={onRoleChange}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

interface MemberRowProps {
  member: EntityMember;
  first: boolean;
  isSelf: boolean;
  canManage: boolean;
  onRoleChange?: (userId: string, role: EntityRole) => void;
  onRemove?: (userId: string) => void;
}

function MemberRow({
  member,
  first,
  isSelf,
  canManage,
  onRoleChange,
  onRemove,
}: MemberRowProps) {
  const displayName =
    member.user?.displayName || member.user?.email || 'Unknown user';
  const email = member.user?.email;

  return (
    <View
      className={cn(
        'flex-row items-center gap-3 p-3',
        !first && 'border-t border-border'
      )}
    >
      {/* Avatar */}
      <View className='h-10 w-10 items-center justify-center rounded-full bg-muted'>
        <UserIcon size={20} className='text-muted-foreground' />
      </View>

      {/* Info */}
      <View className='min-w-0 flex-1'>
        <View className='flex-row items-center gap-2'>
          <Text
            className='shrink text-base font-medium text-foreground'
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {isSelf ? (
            <Text className='text-xs text-muted-foreground'>(you)</Text>
          ) : null}
        </View>
        {email ? (
          <Text className='text-sm text-muted-foreground' numberOfLines={1}>
            {email}
          </Text>
        ) : null}
      </View>

      {/* Role */}
      {canManage && onRoleChange && !isSelf ? (
        <MemberRoleSelector
          value={member.role}
          onChange={role => onRoleChange(member.userId, role)}
        />
      ) : (
        <RoleBadge role={member.role} className='py-1' />
      )}

      {/* Actions */}
      {canManage && onRemove && !isSelf ? (
        <Pressable
          {...pressProps(() => onRemove(member.userId))}
          accessibilityRole='button'
          accessibilityLabel={`Remove ${displayName}`}
          hitSlop={8}
          className='rounded p-1.5 active:bg-destructive/10'
        >
          <TrashIcon size={18} className='text-muted-foreground' />
        </Pressable>
      ) : null}
    </View>
  );
}
