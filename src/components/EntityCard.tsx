/**
 * @fileoverview Entity Card
 *
 * Card displaying an entity: avatar or type icon, name, the user's role, the
 * workspace type and the description. RN counterpart of the web's
 * `EntityCard` (`@sudobility/components/entity`).
 */
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { cn, pressProps } from '@sudobility/components-rn';
import { colors } from '@sudobility/design';
import type { EntityWithRole } from '@sudobility/types';
import { BuildingOffice2Icon, UserIcon } from './icons';
import { RoleBadge, splitBadgeClasses } from './RoleBadge';

export interface EntityCardProps {
  /** Entity to display */
  entity: EntityWithRole;
  /** Whether this is the currently selected entity */
  isSelected?: boolean;
  /** Press handler; without one the card is not interactive */
  onPress?: () => void;
}

const badge = colors.component.badge;
const personalAvatar = splitBadgeClasses(
  `${badge.primary.base} ${badge.primary.dark}`
).box;
const organizationAvatar = splitBadgeClasses(
  `${badge.warning.base} ${badge.warning.dark}`
).box;

export function EntityCard({
  entity,
  isSelected = false,
  onPress,
}: EntityCardProps) {
  const isPersonal = entity.entityType === 'personal';
  const Icon = isPersonal ? UserIcon : BuildingOffice2Icon;

  return (
    <Pressable
      {...pressProps(onPress, !onPress)}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${entity.displayName}, ${entity.userRole}`}
      accessibilityState={{ selected: isSelected }}
      className={cn(
        'rounded-lg border p-4',
        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card',
        onPress && 'active:opacity-80'
      )}
    >
      <View className='flex-row items-start gap-3'>
        {/* Avatar/Icon */}
        <View
          className={cn(
            'h-10 w-10 items-center justify-center overflow-hidden rounded-full',
            isPersonal ? personalAvatar : organizationAvatar
          )}
        >
          {entity.avatarUrl ? (
            <Image
              source={{ uri: entity.avatarUrl }}
              className='h-10 w-10 rounded-full'
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Icon
              size={20}
              className={isPersonal ? 'text-primary' : 'text-accent-foreground'}
            />
          )}
        </View>

        {/* Content */}
        <View className='min-w-0 flex-1'>
          <View className='flex-row items-center gap-2'>
            <Text
              className='shrink text-base font-medium text-foreground'
              numberOfLines={1}
            >
              {entity.displayName}
            </Text>
            <RoleBadge role={entity.userRole} />
          </View>
          <Text className='text-sm text-muted-foreground'>
            {isPersonal ? 'Personal workspace' : 'Organization'}
          </Text>
          {entity.description ? (
            <Text
              className='mt-1 text-sm text-muted-foreground'
              numberOfLines={2}
            >
              {entity.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
