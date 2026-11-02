import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Alert } from 'react-native';
import { render, firePress } from './test-utils';

const mockUseEntityApiKeys = vi.fn();
const mockUseCreateApiKey = vi.fn();
const mockUseUpdateApiKey = vi.fn();
const mockUseRevokeApiKey = vi.fn();

vi.mock('@sudobility/entity_client', () => ({
  EntityClient: vi.fn(),
  useEntityApiKeys: (...args: any[]) => mockUseEntityApiKeys(...args),
  useCreateApiKey: (...args: any[]) => mockUseCreateApiKey(...args),
  useUpdateApiKey: (...args: any[]) => mockUseUpdateApiKey(...args),
  useRevokeApiKey: (...args: any[]) => mockUseRevokeApiKey(...args),
}));

vi.mock('@sudobility/types', () => ({
  EntityRole: { OWNER: 'OWNER', MANAGER: 'MANAGER', MEMBER: 'MEMBER' },
  getPermissionsForRole: (role: string) => ({
    canManageApiKeys: role === 'OWNER' || role === 'MANAGER',
  }),
}));

import { ApiKeysPage } from '../pages/ApiKeysPage';

const mockClient = {} as any;
const ownerEntity = {
  id: 'e1',
  entitySlug: 'acme',
  displayName: 'Acme',
  userRole: 'OWNER',
} as any;
const memberEntity = { ...ownerEntity, userRole: 'MEMBER' } as any;

const activeKey = {
  id: 'key-1',
  entityId: 'e1',
  keyName: 'CI deploy',
  keyPrefix: 'shyft_a1b2c3',
  isActive: true,
  lastUsedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
} as any;

const defaultMutation = { mutateAsync: vi.fn(), isPending: false };

function setApiKeys(over: Record<string, any> = {}) {
  mockUseEntityApiKeys.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  });
}

describe('ApiKeysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateApiKey.mockReturnValue(defaultMutation);
    mockUseUpdateApiKey.mockReturnValue(defaultMutation);
    mockUseRevokeApiKey.mockReturnValue(defaultMutation);
  });

  it('shows a loading indicator', async () => {
    setApiKeys({ isLoading: true });
    const { container } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    expect(
      container.querySelector('[data-testid="ActivityIndicator"]')
    ).not.toBeNull();
  });

  it('shows an error with a retry that refetches', async () => {
    const refetch = vi.fn();
    setApiKeys({ isError: true, error: new Error('boom'), refetch });
    const { queryByText, getByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    expect(queryByText('Failed to load API keys')).not.toBeNull();
    firePress(getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the owner empty-state hint', async () => {
    setApiKeys();
    const { queryByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    expect(queryByText('No API keys yet.')).not.toBeNull();
    expect(
      queryByText(
        'Create a key to let scripts and integrations call the API as this workspace.'
      )
    ).not.toBeNull();
  });

  it('shows the read-only empty-state hint to a member', async () => {
    setApiKeys();
    const { queryByText } = await render(
      <ApiKeysPage client={mockClient} entity={memberEntity} />
    );
    expect(
      queryByText('You need Manager or Owner access to create API keys.')
    ).not.toBeNull();
  });

  it('renders a key with its active badge', async () => {
    setApiKeys({ data: [activeKey] });
    const { queryByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    expect(queryByText('CI deploy')).not.toBeNull();
    expect(queryByText('Active')).not.toBeNull();
  });

  it('lets an owner open the create panel', async () => {
    setApiKeys();
    const { getByText, queryByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    expect(queryByText('Key name')).toBeNull();
    firePress(getByText('+ New Key'));
    expect(queryByText('Key name')).not.toBeNull();
  });

  it('hides management controls from a member', async () => {
    setApiKeys({ data: [activeKey] });
    const { queryByText } = await render(
      <ApiKeysPage client={mockClient} entity={memberEntity} />
    );
    expect(queryByText('+ New Key')).toBeNull();
    expect(queryByText('Revoke')).toBeNull();
    expect(queryByText('Deactivate')).toBeNull();
  });

  it('toggles a key active state through the client', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseUpdateApiKey.mockReturnValue({ mutateAsync, isPending: false });
    setApiKeys({ data: [activeKey] });
    const { getByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    firePress(getByText('Deactivate'));
    expect(mutateAsync).toHaveBeenCalledWith({
      entitySlug: 'acme',
      keyId: 'key-1',
      request: { is_active: false },
    });
  });

  it('confirms before revoking a key', async () => {
    setApiKeys({ data: [activeKey] });
    const { getByText } = await render(
      <ApiKeysPage client={mockClient} entity={ownerEntity} />
    );
    firePress(getByText('Revoke'));
    expect(Alert.alert).toHaveBeenCalled();
    expect((Alert.alert as any).mock.calls[0][0]).toBe('Revoke API Key');
  });
});
