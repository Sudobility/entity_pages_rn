/**
 * @fileoverview Invitations Page (React Native)
 *
 * The RN mirror of @sudobility/entity_pages' InvitationsPage: the invitations
 * the signed-in user has received, each with Accept and Decline. Declining is
 * confirmed first, with a native alert in place of the web's dialog.
 *
 * Renders full-size; the host supplies scroll insets through
 * `contentContainerStyle`.
 */

import React from 'react';
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
  useMyInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
  type EntityClient,
} from '@sudobility/entity_client';
import {
  EmptyPanel,
  ErrorPanel,
  InvitationList,
  ListSkeleton,
  PageHeader,
} from '../components';

export interface InvitationsPageProps {
  /** Entity API client */
  client: EntityClient;
  /** Callback when an invitation is accepted */
  onInvitationAccepted?: () => void;
  /** Style for the scroll content, e.g. the host's safe-area scroll insets */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Page for viewing and responding to pending invitations.
 */
export function InvitationsPage({
  client,
  onInvitationAccepted,
  contentContainerStyle,
}: InvitationsPageProps) {
  const {
    data: invitations = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyInvitations(client);
  const acceptInvitation = useAcceptInvitation(client);
  const declineInvitation = useDeclineInvitation(client);

  const handleAccept = async (token: string) => {
    try {
      await acceptInvitation.mutateAsync(token);
      onInvitationAccepted?.();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept invitation');
    }
  };

  const handleConfirmDecline = async (token: string) => {
    try {
      await declineInvitation.mutateAsync(token);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to decline invitation');
    }
  };

  const handleDecline = (token: string) => {
    const invitation = invitations.find(inv => inv.token === token);
    const entityName = invitation?.entity?.displayName || 'this organization';
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to join ${entityName}? You will need a new invitation to join later.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            void handleConfirmDecline(token);
          },
        },
      ]
    );
  };

  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending'
  );
  const pendingCount = pendingInvitations.length;

  return (
    <View className='flex-1 bg-background'>
      <PageHeader
        title='Invitations'
        subtitle={
          pendingCount > 0
            ? `You have ${pendingCount} pending invitation${pendingCount > 1 ? 's' : ''}`
            : 'No pending invitations'
        }
      />

      <ScrollView
        className='flex-1'
        contentContainerStyle={contentContainerStyle}
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
              title='Failed to load invitations'
              message={
                (error as Error)?.message || 'An unexpected error occurred'
              }
              retryLabel='Retry loading invitations'
              onRetry={() => refetch()}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <ListSkeleton rows={2} height={72} label='Loading invitations' />
          )}

          {/* Content */}
          {!isLoading &&
            !isError &&
            (pendingCount === 0 ? (
              <EmptyPanel>
                <Text className='mb-1 text-lg font-medium text-muted-foreground'>
                  No invitations
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {"You don't have any pending invitations"}
                </Text>
              </EmptyPanel>
            ) : (
              <InvitationList
                invitations={pendingInvitations}
                mode='user'
                onAccept={handleAccept}
                onDecline={handleDecline}
                disabled={
                  acceptInvitation.isPending || declineInvitation.isPending
                }
                emptyMessage="You don't have any pending invitations"
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
