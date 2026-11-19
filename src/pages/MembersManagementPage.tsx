/**
 * @fileoverview Members Management Page (React Native)
 *
 * The RN mirror of @sudobility/entity_pages' MembersManagementPage: the
 * members list under a header carrying the title and an "Invite" button, which
 * opens an "Invite Member" panel under the header without leaving the page.
 *
 * One addition to the web page: an owner also sees the invitations still
 * pending for this entity, and can cancel them — there is nowhere else in an
 * RN app to do that. Destructive actions are confirmed with a native alert in
 * place of the web's dialog.
 *
 * Renders full-size; the host supplies scroll insets through
 * `contentContainerStyle`.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  useEntityMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useEntityInvitations,
  useCreateInvitation,
  useCancelInvitation,
  type EntityClient,
} from '@sudobility/entity_client';
import type {
  EntityRole,
  EntityWithRole,
  InviteMemberRequest,
} from '@sudobility/types';
import {
  EmptyPanel,
  ErrorPanel,
  HeaderActionButton,
  InvitationForm,
  InvitationList,
  ListSkeleton,
  MemberList,
  PageHeader,
} from '../components';

export interface MembersManagementPageProps {
  /** Entity API client */
  client: EntityClient;
  /**
   * Entity to manage. A navigator that carries only the fields it needs may
   * pass that subset; with no `entityType` the entity is treated as an
   * organization.
   */
  entity: Pick<EntityWithRole, 'id' | 'entitySlug' | 'displayName'> & {
    userRole: EntityRole | string;
    entityType?: EntityWithRole['entityType'] | string;
  };
  /** Current user's ID */
  currentUserId: string;
  /** Style for the scroll content, e.g. the host's safe-area scroll insets */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Page for managing an entity's members.
 */
export function MembersManagementPage({
  client,
  entity,
  currentUserId,
  contentContainerStyle,
}: MembersManagementPageProps) {
  const canManage = entity.userRole === 'owner';
  const isPersonal = entity.entityType === 'personal';

  /** Whether the "Invite Member" panel under the header is expanded. */
  const [inviteOpen, setInviteOpen] = useState(false);

  // Members
  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    error: membersErrorObj,
    refetch: refetchMembers,
    isRefetching: membersRefetching,
  } = useEntityMembers(client, entity.entitySlug);
  const updateRole = useUpdateMemberRole(client);
  const removeMember = useRemoveMember(client);

  // Invitations sent for this entity
  const { data: invitations = [], refetch: refetchInvitations } =
    useEntityInvitations(client, entity.entitySlug);
  const createInvitation = useCreateInvitation(client);
  const cancelInvitation = useCancelInvitation(client);

  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending'
  );

  const handleRoleChange = async (userId: string, role: EntityRole) => {
    try {
      await updateRole.mutateAsync({
        entitySlug: entity.entitySlug,
        memberId: userId,
        role,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update role');
    }
  };

  const handleConfirmRemove = async (userId: string) => {
    try {
      await removeMember.mutateAsync({
        entitySlug: entity.entitySlug,
        memberId: userId,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to remove member');
    }
  };

  const handleRemoveMember = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    const label =
      member?.user?.displayName || member?.user?.email || 'this member';
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${label}? They will lose access to this organization.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void handleConfirmRemove(userId);
          },
        },
      ]
    );
  };

  const handleInvite = async (request: InviteMemberRequest) => {
    await createInvitation.mutateAsync({
      entitySlug: entity.entitySlug,
      request,
    });
    // Collapse the panel only after a successful invite; on error the form
    // stays open so the user can correct and retry.
    setInviteOpen(false);
  };

  const handleConfirmCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({
        entitySlug: entity.entitySlug,
        invitationId,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to cancel invitation');
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    Alert.alert(
      'Cancel Invitation',
      `Cancel the invitation to ${invitation?.email || 'this person'}? They will need a new invitation to join.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Invitation',
          style: 'destructive',
          onPress: () => {
            void handleConfirmCancelInvitation(invitationId);
          },
        },
      ]
    );
  };

  // Personal entities don't have members to manage.
  if (isPersonal) {
    return (
      <View className='flex-1 bg-background'>
        <PageHeader title='Members' />
        <ScrollView
          className='flex-1'
          contentContainerStyle={contentContainerStyle}
        >
          <View className='items-center px-4 py-12'>
            <Text className='text-center text-base text-muted-foreground'>
              Personal workspaces cannot have additional members.
            </Text>
            <Text className='mt-2 text-center text-base text-muted-foreground'>
              Create an organization to collaborate with others.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      <PageHeader
        title='Members'
        subtitle={`${members.length} member${members.length === 1 ? '' : 's'} in ${entity.displayName}`}
        action={
          canManage ? (
            <HeaderActionButton
              label='Invite'
              onPress={() => setInviteOpen(open => !open)}
              expanded={inviteOpen}
            />
          ) : undefined
        }
      >
        {/* Invite Member panel (extends the header) */}
        {canManage && inviteOpen ? (
          <View className='border-t border-border px-4 py-3'>
            <Text className='mb-3 text-sm font-semibold text-foreground'>
              Invite Member
            </Text>
            <InvitationForm
              onSubmit={handleInvite}
              isSubmitting={createInvitation.isPending}
            />
          </View>
        ) : null}
      </PageHeader>

      <ScrollView
        className='flex-1'
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps='handled'
        refreshControl={
          <RefreshControl
            refreshing={!!membersRefetching && !membersLoading}
            onRefresh={() => {
              refetchMembers();
              refetchInvitations?.();
            }}
          />
        }
      >
        <View className='p-4'>
          {membersError ? (
            <ErrorPanel
              title='Failed to load members'
              message={
                (membersErrorObj as Error)?.message ||
                'An unexpected error occurred'
              }
              retryLabel='Retry loading members'
              onRetry={() => refetchMembers()}
            />
          ) : membersLoading ? (
            <ListSkeleton rows={3} height={64} label='Loading members' />
          ) : members.length === 0 ? (
            <EmptyPanel>
              <Text className='text-base text-muted-foreground'>
                No members yet
              </Text>
              {canManage && (
                <Text className='mt-1 text-sm text-muted-foreground'>
                  Use the Invite button to add members.
                </Text>
              )}
            </EmptyPanel>
          ) : (
            <MemberList
              members={members}
              currentUserId={currentUserId}
              canManage={canManage}
              onRoleChange={handleRoleChange}
              onRemove={handleRemoveMember}
            />
          )}

          {/* Invitations sent and not yet answered */}
          {canManage && pendingInvitations.length > 0 ? (
            <View className='mt-6'>
              <Text
                className='mb-3 text-lg font-semibold text-foreground'
                accessibilityRole='header'
              >
                Pending Invitations
              </Text>
              <InvitationList
                invitations={pendingInvitations}
                mode='admin'
                onCancel={handleCancelInvitation}
                disabled={cancelInvitation.isPending}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
