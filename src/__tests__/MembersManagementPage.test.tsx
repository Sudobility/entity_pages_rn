import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Alert } from 'react-native';
import { render, firePress, changeText, flushPromises } from './test-utils';
import { MembersManagementPage } from '../pages/MembersManagementPage';

const mockUseEntityMembers = vi.fn();
const mockUseUpdateMemberRole = vi.fn();
const mockUseRemoveMember = vi.fn();
const mockUseEntityInvitations = vi.fn();
const mockUseCreateInvitation = vi.fn();
const mockUseCancelInvitation = vi.fn();

vi.mock('@sudobility/entity_client', () => ({
  useEntityMembers: (...args: any[]) => mockUseEntityMembers(...args),
  useUpdateMemberRole: (...args: any[]) => mockUseUpdateMemberRole(...args),
  useRemoveMember: (...args: any[]) => mockUseRemoveMember(...args),
  useEntityInvitations: (...args: any[]) => mockUseEntityInvitations(...args),
  useCreateInvitation: (...args: any[]) => mockUseCreateInvitation(...args),
  useCancelInvitation: (...args: any[]) => mockUseCancelInvitation(...args),
}));

const mockClient = {} as any;
const ownerEntity = {
  id: 'e1',
  entitySlug: 'acme',
  displayName: 'Acme Corp',
  userRole: 'owner',
};
const memberEntity = { ...ownerEntity, userRole: 'member' };

const ada = {
  id: 'm1',
  userId: 'u1',
  role: 'owner',
  user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada' },
};
const bob = {
  id: 'm2',
  userId: 'u2',
  role: 'member',
  user: { id: 'u2', email: 'bob@example.com', displayName: 'Bob' },
};

function setMembers(over: Record<string, any> = {}) {
  mockUseEntityMembers.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  });
}

function setInvitations(data: any[] = []) {
  mockUseEntityInvitations.mockReturnValue({ data, refetch: vi.fn() });
}

const byLabel = (container: HTMLElement, label: string) =>
  container.querySelector(`[accessibilitylabel="${label}"]`) as HTMLElement;

function renderPage(entity: any = ownerEntity, currentUserId = 'u1') {
  return render(
    <MembersManagementPage
      client={mockClient}
      entity={entity}
      currentUserId={currentUserId}
    />
  );
}

describe('MembersManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mutation = { mutateAsync: vi.fn(), isPending: false };
    mockUseUpdateMemberRole.mockReturnValue(mutation);
    mockUseRemoveMember.mockReturnValue(mutation);
    mockUseCreateInvitation.mockReturnValue(mutation);
    mockUseCancelInvitation.mockReturnValue(mutation);
    setInvitations();
  });

  it('shows skeleton rows while members load', async () => {
    setMembers({ data: undefined, isLoading: true });
    const { container, getByText } = await renderPage();

    expect(getByText('Members')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="Skeleton"]').length).toBe(
      3
    );
  });

  it('shows the error panel and retries', async () => {
    const refetch = vi.fn();
    setMembers({ isError: true, error: new Error('boom'), refetch });
    const { getByText } = await renderPage();

    expect(getByText('Failed to load members')).toBeTruthy();
    expect(getByText('boom')).toBeTruthy();
    firePress(getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the empty state, with the invite hint for an owner only', async () => {
    setMembers();
    const owner = await renderPage();
    expect(owner.getByText('No members yet')).toBeTruthy();
    expect(owner.getByText('0 members in Acme Corp')).toBeTruthy();
    expect(
      owner.getByText('Use the Invite button to add members.')
    ).toBeTruthy();
    owner.unmount();

    const member = await renderPage(memberEntity);
    expect(
      member.queryByText('Use the Invite button to add members.')
    ).toBeNull();
  });

  it('tells a personal workspace it has no members to manage', async () => {
    setMembers();
    const { getByText, queryByText } = await renderPage({
      ...ownerEntity,
      entityType: 'personal',
    });

    expect(
      getByText('Personal workspaces cannot have additional members.')
    ).toBeTruthy();
    expect(queryByText('Invite')).toBeNull();
  });

  it('renders members by name and email, marking the current user', async () => {
    setMembers({ data: [ada, bob] });
    const { getByText, getAllByText } = await renderPage();

    expect(getByText('2 members in Acme Corp')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('ada@example.com')).toBeTruthy();
    expect(getAllByText('(you)').length).toBe(1);
    expect(getByText('Bob')).toBeTruthy();
    // Own row: a badge. Bob's row: a role selector.
    expect(getByText('owner')).toBeTruthy();
    expect(getByText('Member')).toBeTruthy();
  });

  it('falls back to the email, then to "Unknown user"', async () => {
    setMembers({
      data: [
        { ...bob, user: { ...bob.user, displayName: null } },
        { id: 'm3', userId: 'u3', role: 'member' },
      ],
    });
    const { getAllByText, getByText } = await renderPage();

    expect(getAllByText('bob@example.com').length).toBe(2);
    expect(getByText('Unknown user')).toBeTruthy();
  });

  it('gives a non-owner badges and no controls', async () => {
    setMembers({ data: [ada, bob] });
    const { container, queryByText, getByText } = await renderPage(
      memberEntity,
      'u2'
    );

    expect(queryByText('Invite')).toBeNull();
    expect(getByText('member')).toBeTruthy();
    expect(byLabel(container, 'Remove Ada')).toBeNull();
    expect(byLabel(container, 'Role: Owner')).toBeNull();
  });

  it('changes a role through the selector, by user id', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateMemberRole.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada, bob] });
    const { container, getByText } = await renderPage();

    firePress(byLabel(container, 'Role: Member'));
    expect(getByText('Roles')).toBeTruthy();
    expect(getByText('Can manage projects and API keys')).toBeTruthy();
    firePress(getByText('Manager'));
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      entitySlug: 'acme',
      memberId: 'u2',
      role: 'manager',
    });
  });

  it('confirms before removing a member, then removes by user id', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseRemoveMember.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada, bob] });
    const { container } = await renderPage();

    expect(byLabel(container, 'Remove Ada')).toBeNull();
    firePress(byLabel(container, 'Remove Bob'));

    const [title, message, buttons] = (Alert.alert as any).mock.calls[0];
    expect(title).toBe('Remove Member');
    expect(message).toBe(
      'Are you sure you want to remove Bob? They will lose access to this organization.'
    );
    expect(mutateAsync).not.toHaveBeenCalled();

    buttons[1].onPress();
    await flushPromises();
    expect(mutateAsync).toHaveBeenCalledWith({
      entitySlug: 'acme',
      memberId: 'u2',
    });
  });

  it('toggles the invite panel from the header', async () => {
    setMembers({ data: [ada] });
    const { getByText, queryByText } = await renderPage();

    expect(queryByText('Invite Member')).toBeNull();
    firePress(getByText('Invite'));
    expect(getByText('Invite Member')).toBeTruthy();
  });

  it('rejects a malformed email without calling the client', async () => {
    const mutateAsync = vi.fn();
    mockUseCreateInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada] });
    const { container, getByText } = await renderPage();

    firePress(getByText('Invite'));
    changeText(
      container.querySelector('[data-testid="Input"]') as HTMLInputElement,
      'not-an-email'
    );
    firePress(byLabel(container, 'Send invitation'));
    await flushPromises();

    expect(getByText('Please enter a valid email address')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('sends an invitation and collapses the panel', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada] });
    const { container, getByText, queryByText } = await renderPage();

    firePress(getByText('Invite'));
    changeText(
      container.querySelector('[data-testid="Input"]') as HTMLInputElement,
      ' new@example.com '
    );
    firePress(byLabel(container, 'Send invitation'));
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      entitySlug: 'acme',
      request: { email: 'new@example.com', role: 'member' },
    });
    expect(queryByText('Invite Member')).toBeNull();
  });

  it('keeps the panel open and shows the error when the invite fails', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(new Error('Already a member'));
    mockUseCreateInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada] });
    const { container, getByText } = await renderPage();

    firePress(getByText('Invite'));
    changeText(
      container.querySelector('[data-testid="Input"]') as HTMLInputElement,
      'bob@example.com'
    );
    firePress(byLabel(container, 'Send invitation'));
    await flushPromises();

    expect(getByText('Already a member')).toBeTruthy();
    expect(getByText('Invite Member')).toBeTruthy();
  });

  it('lists pending invitations for an owner and cancels after confirming', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCancelInvitation.mockReturnValue({ mutateAsync, isPending: false });
    setMembers({ data: [ada] });
    setInvitations([
      {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
        token: 't',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: 'inv-2',
        email: 'old@example.com',
        role: 'member',
        status: 'accepted',
        token: 't2',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    ]);
    const { container, getByText, queryByText } = await renderPage();

    expect(getByText('Pending Invitations')).toBeTruthy();
    expect(getByText('new@example.com')).toBeTruthy();
    expect(queryByText('old@example.com')).toBeNull();

    firePress(byLabel(container, 'Cancel invitation to new@example.com'));
    const [title, , buttons] = (Alert.alert as any).mock.calls[0];
    expect(title).toBe('Cancel Invitation');
    buttons[1].onPress();
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      entitySlug: 'acme',
      invitationId: 'inv-1',
    });
  });

  it('hides pending invitations from a non-owner', async () => {
    setMembers({ data: [ada, bob] });
    setInvitations([
      {
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
        status: 'pending',
        token: 't',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    ]);
    const { queryByText } = await renderPage(memberEntity, 'u2');

    expect(queryByText('Pending Invitations')).toBeNull();
  });
});
