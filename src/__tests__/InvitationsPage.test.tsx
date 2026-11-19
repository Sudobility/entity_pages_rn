import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Alert } from 'react-native';
import { render, firePress, flushPromises } from './test-utils';
import { InvitationsPage } from '../pages/InvitationsPage';

const mockUseMyInvitations = vi.fn();
const mockUseAcceptInvitation = vi.fn();
const mockUseDeclineInvitation = vi.fn();

vi.mock('@sudobility/entity_client', () => ({
  useMyInvitations: (...args: any[]) => mockUseMyInvitations(...args),
  useAcceptInvitation: (...args: any[]) => mockUseAcceptInvitation(...args),
  useDeclineInvitation: (...args: any[]) => mockUseDeclineInvitation(...args),
}));

const mockClient = {} as any;
const DAY = 24 * 60 * 60 * 1000;

function invitation(over: Record<string, any> = {}) {
  return {
    id: 'inv-1',
    email: 'me@example.com',
    role: 'manager',
    status: 'pending',
    token: 'tok-1',
    expiresAt: new Date(Date.now() + 3 * DAY - 1000).toISOString(),
    entity: { displayName: 'Acme Corp' },
    ...over,
  };
}

function setInvitations(over: Record<string, any> = {}) {
  mockUseMyInvitations.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  });
}

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAcceptInvitation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseDeclineInvitation.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('shows skeleton rows while loading', async () => {
    setInvitations({ data: undefined, isLoading: true });
    const { container, queryByText } = await render(
      <InvitationsPage client={mockClient} />
    );

    expect(container.querySelectorAll('[data-testid="Skeleton"]').length).toBe(
      2
    );
    expect(queryByText('No invitations')).toBeNull();
  });

  it('shows the error panel with the message, and retries', async () => {
    const refetch = vi.fn();
    setInvitations({
      data: undefined,
      isError: true,
      error: { message: 'Server error' },
      refetch,
    });
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    expect(getByText('Failed to load invitations')).toBeTruthy();
    expect(getByText('Server error')).toBeTruthy();
    firePress(getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the empty state', async () => {
    setInvitations();
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    expect(getByText('Invitations')).toBeTruthy();
    expect(getByText('No pending invitations')).toBeTruthy();
    expect(getByText('No invitations')).toBeTruthy();
    expect(getByText("You don't have any pending invitations")).toBeTruthy();
  });

  it('renders an invitation with its organization, role, expiry and actions', async () => {
    setInvitations({ data: [invitation()] });
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    expect(getByText('You have 1 pending invitation')).toBeTruthy();
    expect(getByText('Acme Corp')).toBeTruthy();
    expect(getByText('manager')).toBeTruthy();
    expect(getByText('Expires in 3 days')).toBeTruthy();
    expect(getByText('Accept')).toBeTruthy();
    expect(getByText('Decline')).toBeTruthy();
  });

  it('pluralizes the count and ignores invitations that are not pending', async () => {
    setInvitations({
      data: [
        invitation(),
        invitation({ id: 'inv-2', token: 'tok-2' }),
        invitation({ id: 'inv-3', token: 'tok-3', status: 'declined' }),
      ],
    });
    const { getByText, getAllByText } = await render(
      <InvitationsPage client={mockClient} />
    );

    expect(getByText('You have 2 pending invitations')).toBeTruthy();
    expect(getAllByText('Accept').length).toBe(2);
  });

  it('shows the invited email when the invitation carries no entity', async () => {
    setInvitations({ data: [invitation({ entity: undefined })] });
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    expect(getByText('me@example.com')).toBeTruthy();
  });

  it('marks an expired invitation and does not let it be accepted', async () => {
    const mutateAsync = vi.fn();
    mockUseAcceptInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setInvitations({
      data: [
        invitation({ expiresAt: new Date(Date.now() - DAY).toISOString() }),
      ],
    });
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    expect(getByText('Expired')).toBeTruthy();
    firePress(getByText('Accept'));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('accepts an invitation and reports it', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    const onInvitationAccepted = vi.fn();
    mockUseAcceptInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setInvitations({ data: [invitation()] });
    const { getByText } = await render(
      <InvitationsPage
        client={mockClient}
        onInvitationAccepted={onInvitationAccepted}
      />
    );

    firePress(getByText('Accept'));
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith('tok-1');
    expect(onInvitationAccepted).toHaveBeenCalled();
  });

  it('alerts when accepting fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Expired token'));
    const onInvitationAccepted = vi.fn();
    mockUseAcceptInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setInvitations({ data: [invitation()] });
    const { getByText } = await render(
      <InvitationsPage
        client={mockClient}
        onInvitationAccepted={onInvitationAccepted}
      />
    );

    firePress(getByText('Accept'));
    await flushPromises();

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Expired token');
    expect(onInvitationAccepted).not.toHaveBeenCalled();
  });

  it('confirms before declining, then declines', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseDeclineInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setInvitations({ data: [invitation()] });
    const { getByText } = await render(<InvitationsPage client={mockClient} />);

    firePress(getByText('Decline'));

    const [title, message, buttons] = (Alert.alert as any).mock.calls[0];
    expect(title).toBe('Decline Invitation');
    expect(message).toBe(
      'Are you sure you want to decline the invitation to join Acme Corp? You will need a new invitation to join later.'
    );
    expect(buttons.map((b: any) => b.text)).toEqual(['Keep', 'Decline']);
    expect(mutateAsync).not.toHaveBeenCalled();

    buttons[1].onPress();
    await flushPromises();
    expect(mutateAsync).toHaveBeenCalledWith('tok-1');
  });
});
