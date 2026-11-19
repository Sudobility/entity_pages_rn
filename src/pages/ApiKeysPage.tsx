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
  Pressable,
  Alert,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Input, cn, pressProps } from '@sudobility/components-rn';
import {
  useEntityApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useRevokeApiKey,
  EntityClient,
  type EntityApiKey,
} from '@sudobility/entity_client';
import { getPermissionsForRole, type EntityWithRole } from '@sudobility/types';
import {
  ErrorPanel,
  HeaderActionButton,
  ListSkeleton,
  PageHeader,
} from '../components';
import { TrashIcon } from '../components/icons';

export interface ApiKeysPageProps {
  /** Entity API client */
  client: EntityClient;
  /** Entity whose keys are managed */
  entity: EntityWithRole;
  /** Style for the scroll content, e.g. the host's safe-area scroll insets */
  contentContainerStyle?: StyleProp<ViewStyle>;
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
    <View
      className='mb-4 rounded-lg border border-primary/50 bg-primary/5 p-4'
      accessibilityRole='alert'
    >
      <Text className='mb-1 text-sm font-semibold text-foreground'>
        Copy your new API key
      </Text>
      <Text className='mb-3 text-xs text-muted-foreground'>
        This is the only time the key is shown. Store it somewhere safe -- it
        cannot be retrieved again.
      </Text>
      {/* Selectable, so the key can be copied with the system's own menu. */}
      <View className='mb-3 rounded bg-muted px-3 py-2'>
        <Text selectable className='font-mono text-sm text-foreground'>
          {secret}
        </Text>
      </View>
      <Pressable
        {...pressProps(onDismiss)}
        accessibilityRole='button'
        className='self-start rounded-lg border border-border px-3 py-2 active:bg-muted'
      >
        <Text className='text-sm text-foreground'>Done</Text>
      </Pressable>
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
          className='shrink text-base font-medium text-foreground'
          numberOfLines={1}
        >
          {apiKey.keyName}
        </Text>
        <View
          className={cn(
            'rounded-full px-2 py-0.5',
            apiKey.isActive ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Text
            className={cn(
              'text-xs font-medium',
              apiKey.isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {apiKey.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text
        className='mt-1 font-mono text-xs text-muted-foreground'
        numberOfLines={1}
      >
        {apiKey.keyPrefix}...
      </Text>
      <Text className='mt-1 text-xs text-muted-foreground'>
        Created {formatDate(apiKey.createdAt)} - last used{' '}
        {formatDate(apiKey.lastUsedAt)}
      </Text>

      {canManage && (
        <View className='mt-3 flex-row items-center gap-2'>
          <Pressable
            {...pressProps(() => onToggleActive(apiKey))}
            accessibilityRole='button'
            className='rounded-lg border border-border px-3 py-1.5 active:bg-muted'
          >
            <Text className='text-sm text-foreground'>
              {apiKey.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </Pressable>
          <Pressable
            {...pressProps(() => onRevoke(apiKey))}
            accessibilityRole='button'
            accessibilityLabel={`Revoke ${apiKey.keyName}`}
            hitSlop={8}
            className='rounded-lg p-2 active:bg-destructive/10'
          >
            <TrashIcon size={18} className='text-destructive' />
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Page for managing an entity's API keys. */
export function ApiKeysPage({
  client,
  entity,
  contentContainerStyle,
}: ApiKeysPageProps) {
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
  const cannotCreate = !keyName.trim() || createKey.isPending;
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
      <PageHeader
        title='API Keys'
        subtitle={`${apiKeys.length} key${apiKeys.length === 1 ? '' : 's'} for ${entity.displayName}`}
        action={
          canManage ? (
            <HeaderActionButton
              label='New Key'
              onPress={() => setCreateOpen(open => !open)}
              expanded={createOpen}
            />
          ) : undefined
        }
      >
        {/* Create panel (extends the header) */}
        {canManage && createOpen ? (
          <View className='border-t border-border px-4 py-3'>
            <Text className='mb-2 text-sm font-semibold text-foreground'>
              Key name
            </Text>
            <Input
              value={keyName}
              onChangeText={setKeyName}
              placeholder='e.g. CI deploy'
              maxLength={255}
              accessibilityLabel='Key name'
              returnKeyType='done'
              onSubmitEditing={handleCreate}
              autoFocus
            />
            <Pressable
              {...pressProps(handleCreate, cannotCreate)}
              accessibilityRole='button'
              accessibilityState={{ disabled: cannotCreate }}
              disabled={cannotCreate}
              className={cn(
                'mt-2 self-start rounded-lg bg-primary px-4 py-2 active:opacity-80',
                cannotCreate && 'opacity-50'
              )}
            >
              <Text className='text-sm font-medium text-primary-foreground'>
                {createKey.isPending ? 'Creating...' : 'Create Key'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </PageHeader>

      <ScrollView
        className='flex-1'
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps='handled'
      >
        <View className='p-4'>
          {newSecret && (
            <SecretReveal
              secret={newSecret}
              onDismiss={() => setNewSecret(null)}
            />
          )}

          {isError ? (
            <ErrorPanel
              title='Failed to load API keys'
              message={
                (error as Error)?.message || 'An unexpected error occurred'
              }
              retryLabel='Retry loading API keys'
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <ListSkeleton rows={2} height={72} label='Loading API keys' />
          ) : apiKeys.length === 0 ? (
            <View className='items-center py-12'>
              <Text className='text-base text-muted-foreground'>
                No API keys yet.
              </Text>
              <Text className='mt-2 text-center text-sm text-muted-foreground'>
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
        </View>
      </ScrollView>
    </View>
  );
}
