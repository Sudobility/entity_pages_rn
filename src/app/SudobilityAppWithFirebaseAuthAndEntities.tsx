/**
 * SudobilityAppWithFirebaseAuthAndEntities (React Native)
 *
 * RN counterpart of the web wrapper in @sudobility/entity_pages. Extends
 * building_blocks_rn's SudobilityAppRNWithFirebaseAuth with a
 * CurrentEntityProvider (entity_client) wired to the signed-in user.
 *
 * Subscription-agnostic by design: entities and subscriptions are independent,
 * so entity_pages_rn has NO dependency on @sudobility/subscription_pages_rn. An
 * app that wants entity-aware subscriptions layers its own provider via
 * `AppProviders` (which renders inside the entity context, so it can read
 * `useCurrentEntity()` and drive RevenueCat).
 */
import React, { useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  SudobilityAppRNWithFirebaseAuth,
  type SudobilityAppRNWithFirebaseAuthProps,
  useApiSafe,
} from '@sudobility/building_blocks_rn/firebase';
import {
  CurrentEntityProvider,
  EntityClient,
  useCurrentEntity,
} from '@sudobility/entity_client';

// Re-exported for apps that compose their own entity-aware subscription
// provider in `AppProviders`.
export { useCurrentEntity };

export interface SudobilityAppWithFirebaseAuthAndEntitiesProps extends Omit<
  SudobilityAppRNWithFirebaseAuthProps,
  'AppProviders'
> {
  /**
   * Base URL for the API. Used to construct the EntityClient
   * (`${apiUrl}/api/v1`). The ApiProviderComponent still owns the network
   * client itself; this only tells the entity client where to call.
   */
  apiUrl?: string;

  /** @deprecated Use apiUrl instead. */
  entityApiUrl?: string;

  /**
   * Custom AuthAwareEntityProvider (optional). Defaults to a built-in provider
   * that builds an EntityClient from the ApiProvider's network client.
   */
  AuthAwareEntityProvider?: ComponentType<{ children: ReactNode }>;

  /**
   * Additional providers rendered INSIDE the entity context. Use this to layer
   * app-specific providers such as an entity-aware subscription provider.
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;
}

/**
 * Default entity provider: builds an EntityClient from the ApiProvider network
 * client and scopes it to the signed-in user (uid from the API context).
 */
function DefaultAuthAwareEntityProvider({
  children,
  entityUrl,
}: {
  children: ReactNode;
  entityUrl: string;
}) {
  const api = useApiSafe();
  const networkClient = api?.networkClient;
  const userId = api?.userId ?? null;

  const entityClient = useMemo(
    () =>
      entityUrl && networkClient
        ? new EntityClient({ baseUrl: entityUrl, networkClient })
        : null,
    [entityUrl, networkClient]
  );

  const authUser = useMemo(
    () => (userId ? { uid: userId, email: null } : null),
    [userId]
  );

  if (!entityClient) {
    return <>{children}</>;
  }

  return (
    <CurrentEntityProvider client={entityClient} user={authUser}>
      {children}
    </CurrentEntityProvider>
  );
}

/**
 * Entity-aware RN app wrapper: Firebase auth + entities.
 *
 * @example
 * ```tsx
 * import { SudobilityAppWithFirebaseAuthAndEntities } from '@sudobility/entity_pages_rn';
 *
 * export default function App() {
 *   return (
 *     <SudobilityAppWithFirebaseAuthAndEntities
 *       i18n={i18n}
 *       AuthProvider={AuthProvider}
 *       ApiProviderComponent={ApiProvider}
 *       apiUrl={CONSTANTS.API_URL}
 *       AppProviders={EntityAwareSubscriptionProvider} // app-owned, optional
 *     >
 *       <RootNavigator />
 *     </SudobilityAppWithFirebaseAuthAndEntities>
 *   );
 * }
 * ```
 */
export function SudobilityAppWithFirebaseAuthAndEntities({
  apiUrl,
  entityApiUrl,
  AuthAwareEntityProvider: AuthAwareEntityProviderProp,
  AppProviders,
  children,
  ...authProps
}: SudobilityAppWithFirebaseAuthAndEntitiesProps) {
  const baseApiUrl = apiUrl ?? '';
  const entityUrl = entityApiUrl ?? (baseApiUrl ? `${baseApiUrl}/api/v1` : '');

  const EntityProviders: ComponentType<{ children: ReactNode }> = ({
    children: inner,
  }) => {
    let content: ReactNode = inner;

    if (AppProviders) {
      content = <AppProviders>{content}</AppProviders>;
    }

    if (AuthAwareEntityProviderProp) {
      return (
        <AuthAwareEntityProviderProp>{content}</AuthAwareEntityProviderProp>
      );
    }

    return (
      <DefaultAuthAwareEntityProvider entityUrl={entityUrl}>
        {content}
      </DefaultAuthAwareEntityProvider>
    );
  };

  return (
    <SudobilityAppRNWithFirebaseAuth
      {...authProps}
      AppProviders={EntityProviders}
    >
      {children}
    </SudobilityAppRNWithFirebaseAuth>
  );
}

export default SudobilityAppWithFirebaseAuthAndEntities;
