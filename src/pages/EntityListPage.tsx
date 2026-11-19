/**
 * @fileoverview Entity List Page (React Native)
 *
 * The RN mirror of @sudobility/entity_pages' EntityListPage: a "Workspaces"
 * header with a "New Organization" action, then the personal workspace and the
 * organizations as cards, with a create-organization dialog.
 *
 * Renders full-size; the host supplies scroll insets through
 * `contentContainerStyle`.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  FormModal,
  Input,
  TextArea,
  pressProps,
} from '@sudobility/components-rn';
import {
  useEntities,
  useCreateEntity,
  type EntityClient,
} from '@sudobility/entity_client';
import type { EntityWithRole } from '@sudobility/types';
import {
  EntityList,
  EmptyPanel,
  ErrorPanel,
  HeaderActionButton,
  ListSkeleton,
  PageHeader,
} from '../components';

export interface EntityListPageProps {
  /** Entity API client */
  client: EntityClient;
  /** Handler for selecting an entity */
  onSelectEntity?: (entity: EntityWithRole) => void;
  /** Handler for navigating to entity settings */
  onNavigateToSettings?: (entitySlug: string) => void;
  /** Style for the scroll content, e.g. the host's safe-area scroll insets */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const EMPTY_FORM = { displayName: '', description: '' };

/**
 * Page for listing all user's entities with create functionality.
 */
export function EntityListPage({
  client,
  onSelectEntity,
  contentContainerStyle,
}: EntityListPageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: entities = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEntities(client);
  const createEntity = useCreateEntity(client);

  const personalEntities = entities.filter(e => e.entityType === 'personal');
  const organizationEntities = entities.filter(
    e => e.entityType === 'organization'
  );

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateFormData(EMPTY_FORM);
    setCreateError(null);
  };

  const handleCreateSubmit = async () => {
    setCreateError(null);

    if (!createFormData.displayName.trim()) {
      setCreateError('Display name is required');
      return;
    }

    try {
      await createEntity.mutateAsync({
        displayName: createFormData.displayName.trim(),
        description: createFormData.description.trim() || undefined,
      });
      closeCreateForm();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create organization');
    }
  };

  return (
    <View className='flex-1 bg-background'>
      {/* Create Form Modal */}
      <FormModal
        visible={showCreateForm}
        title='Create Organization'
        onClose={closeCreateForm}
        onSave={handleCreateSubmit}
        saving={createEntity.isPending}
        canSave={!createEntity.isPending}
        saveLabel={createEntity.isPending ? 'Creating...' : 'Create'}
        size='small'
      >
        <View className='gap-4'>
          <View>
            <Text className='mb-1 text-sm font-medium text-foreground'>
              Display Name
            </Text>
            <Input
              value={createFormData.displayName}
              onChangeText={displayName =>
                setCreateFormData(prev => ({ ...prev, displayName }))
              }
              placeholder='My Organization'
              error={!!createError}
              accessibilityLabel='Display Name'
              autoFocus
            />
          </View>
          <View>
            <Text className='mb-1 text-sm font-medium text-foreground'>
              Description (optional)
            </Text>
            <TextArea
              value={createFormData.description}
              onChangeText={description =>
                setCreateFormData(prev => ({ ...prev, description }))
              }
              placeholder='What is this organization for?'
              numberOfLines={3}
              accessibilityLabel='Description (optional)'
            />
          </View>
          {createError ? (
            <Text
              className='text-sm text-destructive'
              accessibilityRole='alert'
            >
              {createError}
            </Text>
          ) : null}
        </View>
      </FormModal>

      <PageHeader
        title='Workspaces'
        subtitle='Manage your personal and organization workspaces'
        action={
          <HeaderActionButton
            label='New Organization'
            accessibilityLabel='Create new organization'
            onPress={() => setShowCreateForm(true)}
          />
        }
      />

      <ScrollView
        className='flex-1'
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps='handled'
        refreshControl={
          <RefreshControl
            refreshing={!!isRefetching && !isLoading}
            onRefresh={() => refetch()}
          />
        }
      >
        <View className='p-4'>
          {/* Error State */}
          {isError && (
            <ErrorPanel
              title='Failed to load workspaces'
              message={
                (error as Error)?.message || 'An unexpected error occurred'
              }
              retryLabel='Retry loading workspaces'
              onRetry={() => refetch()}
              className='mb-6'
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <ListSkeleton rows={3} height={72} label='Loading workspaces' />
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              {/* Personal Workspace */}
              {personalEntities.length > 0 && (
                <View className='mb-6'>
                  <Text
                    className='mb-3 text-lg font-semibold text-foreground'
                    accessibilityRole='header'
                  >
                    Personal Workspace
                  </Text>
                  <EntityList
                    entities={personalEntities}
                    onSelect={onSelectEntity}
                  />
                </View>
              )}

              {/* Organizations */}
              <View>
                <Text
                  className='mb-3 text-lg font-semibold text-foreground'
                  accessibilityRole='header'
                >
                  Organizations
                </Text>
                {organizationEntities.length === 0 ? (
                  <EmptyPanel>
                    <Text className='text-base text-muted-foreground'>
                      No organizations yet
                    </Text>
                    <Pressable
                      {...pressProps(() => setShowCreateForm(true))}
                      accessibilityRole='button'
                      className='mt-2 rounded active:opacity-70'
                    >
                      <Text className='text-base text-primary'>
                        Create your first organization
                      </Text>
                    </Pressable>
                  </EmptyPanel>
                ) : (
                  <EntityList
                    entities={organizationEntities}
                    onSelect={onSelectEntity}
                  />
                )}
              </View>

              {/* Empty State - No entities at all */}
              {entities.length === 0 && (
                <EmptyPanel dashed={false}>
                  <Text className='mb-2 text-lg font-medium text-muted-foreground'>
                    No workspaces found
                  </Text>
                  <Text className='text-sm text-muted-foreground'>
                    Create an organization to get started.
                  </Text>
                </EmptyPanel>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
