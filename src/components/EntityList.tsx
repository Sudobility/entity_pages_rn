/**
 * @fileoverview Entity List
 *
 * A column of {@link EntityCard}s. RN counterpart of the web's `EntityList`.
 */
import React from 'react';
import { View, Text } from 'react-native';
import type { EntityWithRole } from '@sudobility/types';
import { EntityCard } from './EntityCard';

export interface EntityListProps {
  /** Entities to display */
  entities: EntityWithRole[];
  /** Currently selected entity slug */
  selectedSlug?: string | null;
  /** Selection handler */
  onSelect?: (entity: EntityWithRole) => void;
  /** Empty state message */
  emptyMessage?: string;
}

export function EntityList({
  entities,
  selectedSlug,
  onSelect,
  emptyMessage = 'No workspaces found',
}: EntityListProps) {
  if (entities.length === 0) {
    return (
      <Text className='py-8 text-center text-base text-muted-foreground'>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <View className='gap-3'>
      {entities.map(entity => (
        <EntityCard
          key={entity.id}
          entity={entity}
          isSelected={entity.entitySlug === selectedSlug}
          onPress={onSelect ? () => onSelect(entity) : undefined}
        />
      ))}
    </View>
  );
}
