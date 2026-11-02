/**
 * @fileoverview API Keys Management Page (React Native)
 *
 * The RN mirror of @sudobility/entity_pages' ApiKeysPage. Keys authenticate a
 * caller as the entity itself -- CI jobs, scripts, and service integrations
 * that should outlive any individual member. The server stores only a hash, so
 * a newly created key's secret is shown once in a one-time reveal panel and is
 * unrecoverable afterwards.
 *
 * Write actions are gated on `canManageApiKeys`; members with read-only access
 * see the list without controls. All data and mutations come from
 * `@sudobility/entity_client`; this page is UI only.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { designTokens } from '@sudobility/design';
import {
  useEntityApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useRevokeApiKey,
  EntityClient,
  type EntityApiKey,
} from '@sudobility/entity_client';
import { getPermissionsForRole } from '@sudobility/types';
import type { EntityWithRole } from '@sudobility/types';

const { size, weight } = designTokens.typography;

export interface ApiKeysPageProps {
  /** Entity API client */
  client: EntityClient;
  /** Entity whose keys are managed */
  entity: EntityWithRole;
}

/** Format a timestamp for display, tolerating nulls. */
function formatDate(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
}

/** One-time reveal of a newly created key. */
function SecretReveal({
  secret,
  onDismiss,
}: {
  secret: string;
  onDismiss: () => void;
}) {
  return (
    <View className='mb-4 rounded-lg border border-primary/50 bg-primary/5 p-4'>
      <Text
        className={[size.sm, weight.semibold, 'mb-1 text-foreground'].join(' ')}
      >
        Copy your new API key
      </Text>
      <Text className={[size.xs, 'mb-3 text-muted-foreground'].join(' ')}>
        This is the only time the key is shown. Store it somewhere safe -- it
        cannot be retrieved again.
      </Text>
      <Text
        selectable
        className={[
          size.sm,
          'mb-3 rounded bg-muted px-3 py-2 font-mono text-foreground',
        ].join(' ')}
      >
        {secret}
      </Text>
      <TouchableOpacity
        accessibilityRole='button'
        onPress={onDismiss}
        className='self-start rounded-lg border border-border px-3 py-2'
      >
        <Text className={[size.sm, 'text-foreground'].join(' ')}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

/** A single API key row. */
function ApiKeyRow({
  apiKey,
  canManage,
  onToggleActive,
  onRevoke,
}: {
  apiKey: EntityApiKey;
  canManage: boolean;
  onToggleActive: (apiKey: EntityApiKey) => void;
  onRevoke: (apiKey: EntityApiKey) => void;
}) {
  return (
    <View className='rounded-lg border border-border bg-background p-4'>
      <View className='flex-row items-center gap-2'>
        <Text
          className={[size.base, weight.medium, 'flex-1 text-foreground'].join(
            ' '
          )}
          numberOfLines={1}
        >
          {apiKey.keyName}
        </Text>
        <Text
          className={[
            size.xs,
            weight.medium,
            'rounded-full px-2 py-0.5 overflow-hidden',
            apiKey.isActive
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          ].join(' ')}
        >
          {apiKey.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <Text
        className={[size.xs, 'mt-1 font-mono text-muted-foreground'].join(' ')}
        numberOfLines={1}
      >
        {apiKey.keyPrefix}...
      </Text>
      <Text className={[size.xs, 'mt-1 text-muted-foreground'].join(' ')}>
        Created {formatDate(apiKey.createdAt)} - last used{' '}
        {formatDate(apiKey.lastUsedAt)}
      </Text>

      {canManage && (
        <View className='mt-3 flex-row items-center gap-2'>
          <TouchableOpacity
            accessibilityRole='button'
            onPress={() => onToggleActive(apiKey)}
            className='rounded-lg border border-border px-3 py-1.5'
          >
            <Text className={[size.sm, 'text-foreground'].join(' ')}>
              {apiKey.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole='button'
            accessibilityLabel={`Revoke ${apiKey.keyName}`}
            onPress={() => onRevoke(apiKey)}
            className='rounded-lg px-3 py-1.5'
          >
            <Text className={[size.sm, 'text-destructive'].join(' ')}>
              Revoke
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Page for managing an entity's API keys. */
export function ApiKeysPage({ client, entity }: ApiKeysPageProps) {
  const permissions = getPermissionsForRole(entity.userRole);
  const canManage = permissions.canManageApiKeys;

  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const {
    data: apiKeys = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEntityApiKeys(client, entity.entitySlug);

  const createKey = useCreateApiKey(client);
  const updateKey = useUpdateApiKey(client);
  const revokeKey = useRevokeApiKey(client);

  const handleCreate = async () => {
    const name = keyName.trim();
    if (!name) return;
    try {
      const created = await createKey.mutateAsync({
        entitySlug: entity.entitySlug,
        request: { key_name: name },
      });
      // Collapse the panel only after a successful create; on error it stays
      // open so the user can correct and retry.
      setNewSecret(created.key);
      setKeyName('');
      setCreateOpen(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create API key');
    }
  };

  const handleToggleActive = async (apiKey: EntityApiKey) => {
    try {
      await updateKey.mutateAsync({
        entitySlug: entity.entitySlug,
        keyId: apiKey.id,
        request: { is_active: !apiKey.isActive },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update API key');
    }
  };

  const handleRevoke = (apiKey: EntityApiKey) => {
    Alert.alert(
      'Revoke API Key',
      `Revoke "${apiKey.keyName}"? Any integration using it will stop working immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeKey.mutateAsync({
                entitySlug: entity.entitySlug,
                keyId: apiKey.id,
              });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to revoke API key');
            }
          },
        },
      ]
    );
  };

  return (
    <View className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between gap-3 border-b border-border px-4 py-3'>
        <View className='flex-1'>
          <Text className={[size.xl, weight.bold, 'text-foreground'].join(' ')}>
            API Keys
          </Text>
          <Text
            className={[size.sm, 'text-muted-foreground'].join(' ')}
            numberOfLines={1}
          >
            {apiKeys.length} key{apiKeys.length === 1 ? '' : 's'} for{' '}
            {entity.displayName}
          </Text>
        </View>
        {canManage && (
          <TouchableOpacity
            accessibilityRole='button'
            onPress={() => setCreateOpen(open => !open)}
            className='rounded-lg bg-primary px-3 py-2'
          >
            <Text
              className={[
                size.sm,
                weight.medium,
                'text-primary-foreground',
              ].join(' ')}
            >
              + New Key
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {canManage && createOpen && (
        <View className='border-b border-border bg-muted px-4 py-4'>
          <Text
            className={[size.sm, weight.semibold, 'mb-2 text-foreground'].join(
              ' '
            )}
          >
            Key name
          </Text>
          <TextInput
            className='rounded-lg border border-input bg-background px-3 py-2 text-foreground'
            value={keyName}
            onChangeText={setKeyName}
            placeholder='e.g. CI deploy'
            maxLength={255}
            autoFocus
          />
          <TouchableOpacity
            accessibilityRole='button'
            disabled={!keyName.trim() || createKey.isPending}
            onPress={handleCreate}
            className={[
              'mt-2 self-start rounded-lg bg-primary px-4 py-2',
              !keyName.trim() || createKey.isPending ? 'opacity-50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Text
              className={[
                size.sm,
                weight.medium,
                'text-primary-foreground',
              ].join(' ')}
            >
              {createKey.isPending ? 'Creating...' : 'Create Key'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView className='flex-1' contentContainerClassName='p-4'>
        {newSecret && (
          <SecretReveal
            secret={newSecret}
            onDismiss={() => setNewSecret(null)}
          />
        )}

        {isError ? (
          <View className='items-center rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
            <Text
              className={[weight.medium, 'mb-2 text-destructive'].join(' ')}
            >
              Failed to load API keys
            </Text>
            <Text className={[size.sm, 'mb-3 text-muted-foreground'].join(' ')}>
              {(error as Error)?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel='Retry loading API keys'
              onPress={() => refetch()}
              className='rounded-lg bg-primary px-3 py-1.5'
            >
              <Text
                className={[
                  size.sm,
                  weight.medium,
                  'text-primary-foreground',
                ].join(' ')}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View className='items-center py-12'>
            <ActivityIndicator accessibilityLabel='Loading API keys' />
          </View>
        ) : apiKeys.length === 0 ? (
          <View className='items-center py-12'>
            <Text className={[size.base, 'text-muted-foreground'].join(' ')}>
              No API keys yet.
            </Text>
            <Text
              className={[
                size.sm,
                'mt-2 text-center text-muted-foreground',
              ].join(' ')}
            >
              {canManage
                ? 'Create a key to let scripts and integrations call the API as this workspace.'
                : 'You need Manager or Owner access to create API keys.'}
            </Text>
          </View>
        ) : (
          <View className='gap-3'>
            {apiKeys.map(apiKey => (
              <ApiKeyRow
                key={apiKey.id}
                apiKey={apiKey}
                canManage={canManage}
                onToggleActive={handleToggleActive}
                onRevoke={handleRevoke}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
