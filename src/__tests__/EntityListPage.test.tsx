import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, firePress, changeText, flushPromises } from './test-utils';
import { EntityListPage } from '../pages/EntityListPage';

const mockUseEntities = vi.fn();
const mockUseCreateEntity = vi.fn();

vi.mock('@sudobility/entity_client', () => ({
  useEntities: (...args: any[]) => mockUseEntities(...args),
  useCreateEntity: (...args: any[]) => mockUseCreateEntity(...args),
}));

const mockClient = {} as any;

const personal = {
  id: 'p1',
  entitySlug: 'me',
  entityType: 'personal',
  displayName: 'Ada',
  description: null,
  avatarUrl: null,
  userRole: 'owner',
};
const organization = {
  id: 'o1',
  entitySlug: 'acme',
  entityType: 'organization',
  displayName: 'Acme Corp',
  description: 'Laundromats',
  avatarUrl: null,
  userRole: 'manager',
};

function setEntities(over: Record<string, any> = {}) {
  mockUseEntities.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  });
}

describe('EntityListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateEntity.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders the header as the web page does', async () => {
    setEntities();
    const { getByText } = await render(<EntityListPage client={mockClient} />);

    expect(getByText('Workspaces')).toBeTruthy();
    expect(
      getByText('Manage your personal and organization workspaces')
    ).toBeTruthy();
    expect(getByText('New Organization')).toBeTruthy();
  });

  it('shows skeleton rows, not the sections, while loading', async () => {
    setEntities({ data: undefined, isLoading: true });
    const { container, queryByText } = await render(
      <EntityListPage client={mockClient} />
    );

    expect(container.querySelectorAll('[data-testid="Skeleton"]').length).toBe(
      3
    );
    expect(queryByText('Organizations')).toBeNull();
  });

  it('shows the error panel with the message, and retries', async () => {
    const refetch = vi.fn();
    setEntities({
      data: undefined,
      isError: true,
      error: { message: 'Network error' },
      refetch,
    });
    const { getByText } = await render(<EntityListPage client={mockClient} />);

    expect(getByText('Failed to load workspaces')).toBeTruthy();
    expect(getByText('Network error')).toBeTruthy();
    firePress(getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('falls back to a generic error message', async () => {
    setEntities({ data: undefined, isError: true, error: null });
    const { getByText } = await render(<EntityListPage client={mockClient} />);

    expect(getByText('An unexpected error occurred')).toBeTruthy();
  });

  it('shows both empty states when there are no entities', async () => {
    setEntities();
    const { getByText } = await render(<EntityListPage client={mockClient} />);

    expect(getByText('No organizations yet')).toBeTruthy();
    expect(getByText('Create your first organization')).toBeTruthy();
    expect(getByText('No workspaces found')).toBeTruthy();
  });

  it('splits entities into personal workspace and organizations', async () => {
    setEntities({ data: [personal, organization] });
    const { getByText, queryByText } = await render(
      <EntityListPage client={mockClient} />
    );

    expect(getByText('Personal Workspace')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('Personal workspace')).toBeTruthy();
    expect(getByText('Organizations')).toBeTruthy();
    expect(getByText('Acme Corp')).toBeTruthy();
    expect(getByText('Organization')).toBeTruthy();
    expect(getByText('Laundromats')).toBeTruthy();
    // Role badges
    expect(getByText('owner')).toBeTruthy();
    expect(getByText('manager')).toBeTruthy();
    expect(queryByText('No organizations yet')).toBeNull();
    expect(queryByText('No workspaces found')).toBeNull();
  });

  it('omits the personal section when there is no personal workspace', async () => {
    setEntities({ data: [organization] });
    const { queryByText } = await render(
      <EntityListPage client={mockClient} />
    );

    expect(queryByText('Personal Workspace')).toBeNull();
  });

  it('calls onSelectEntity when a card is pressed', async () => {
    const onSelectEntity = vi.fn();
    setEntities({ data: [organization] });
    const { getByText } = await render(
      <EntityListPage client={mockClient} onSelectEntity={onSelectEntity} />
    );

    firePress(getByText('Acme Corp'));
    expect(onSelectEntity).toHaveBeenCalledWith(organization);
  });

  it('opens the create dialog from the header and from the empty state', async () => {
    setEntities();
    const { getByText, queryByText, container } = await render(
      <EntityListPage client={mockClient} />
    );

    expect(queryByText('Create Organization')).toBeNull();
    firePress(getByText('New Organization'));
    expect(getByText('Create Organization')).toBeTruthy();
    expect(getByText('Display Name')).toBeTruthy();
    expect(getByText('Description (optional)')).toBeTruthy();

    firePress(
      container.querySelector('[data-testid="FormModal-close"]') as HTMLElement
    );
    expect(queryByText('Create Organization')).toBeNull();

    firePress(getByText('Create your first organization'));
    expect(getByText('Create Organization')).toBeTruthy();
  });

  it('requires a display name', async () => {
    const mutateAsync = vi.fn();
    mockUseCreateEntity.mockReturnValue({ mutateAsync, isPending: false });
    setEntities();
    const { getByText, container } = await render(
      <EntityListPage client={mockClient} />
    );

    firePress(getByText('New Organization'));
    firePress(
      container.querySelector('[data-testid="FormModal-save"]') as HTMLElement
    );
    await flushPromises();

    expect(getByText('Display name is required')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('creates an organization with a trimmed name and description, then closes', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateEntity.mockReturnValue({ mutateAsync, isPending: false });
    setEntities();
    const { getByText, queryByText, container } = await render(
      <EntityListPage client={mockClient} />
    );

    firePress(getByText('New Organization'));
    changeText(
      container.querySelector('[data-testid="Input"]') as HTMLInputElement,
      '  Acme  '
    );
    changeText(
      container.querySelector(
        '[data-testid="TextArea"]'
      ) as HTMLTextAreaElement,
      ' Laundromats '
    );
    firePress(
      container.querySelector('[data-testid="FormModal-save"]') as HTMLElement
    );
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      displayName: 'Acme',
      description: 'Laundromats',
    });
    expect(queryByText('Create Organization')).toBeNull();
  });

  it('keeps the dialog open and shows the error when creating fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Slug taken'));
    mockUseCreateEntity.mockReturnValue({ mutateAsync, isPending: false });
    setEntities();
    const { getByText, container } = await render(
      <EntityListPage client={mockClient} />
    );

    firePress(getByText('New Organization'));
    changeText(
      container.querySelector('[data-testid="Input"]') as HTMLInputElement,
      'Acme'
    );
    firePress(
      container.querySelector('[data-testid="FormModal-save"]') as HTMLElement
    );
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      displayName: 'Acme',
      description: undefined,
    });
    expect(getByText('Slug taken')).toBeTruthy();
    expect(getByText('Create Organization')).toBeTruthy();
  });
});
