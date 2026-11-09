# @sudobility/entity_pages_rn

React Native page components for entity/organization management, built on
`@sudobility/entity_client` hooks and TanStack Query. The React Native
counterpart of `@sudobility/entity_pages` (web).

This is a **library** (published to GitHub Packages), not a runnable app — it has
no Expo config and no native project. It ships ESM TypeScript built to `dist/`.

## Installation

Packages in the `@sudobility` scope are hosted on **GitHub Packages**, not the
public npm registry. The repo's `.npmrc` already points the scope there:

```
@sudobility:registry=https://npm.pkg.github.com
```

Consuming projects need a GitHub token with `read:packages` on their own
`.npmrc` (commonly `GH_PACKAGES_READ_TOKEN`) to install:

```
@sudobility:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_READ_TOKEN}
```

```bash
bun add @sudobility/entity_pages_rn
```

Styling uses **NativeWind** (`className` props). Consuming apps must add this
package's source to the `content` paths in their `tailwind.config.js` so the
utility classes are generated.

## Usage

```tsx
import {
  EntityListPage,
  MembersManagementPage,
  InvitationsPage,
  ApiKeysPage,
} from '@sudobility/entity_pages_rn';

import { EntityClient } from '@sudobility/entity_client';

const client = new EntityClient({ baseUrl, networkClient });

// Entity list with inline create-organization form
<EntityListPage
  client={client}
  onSelectEntity={(entity) => navigate('EntityDetail', { slug: entity.entitySlug })}
/>

// Member management for a specific entity
<MembersManagementPage
  client={client}
  entity={{ id, entitySlug, displayName, userRole }}
  currentUserId={userId}
/>
```

### App shell

`SudobilityAppWithFirebaseAuthAndEntities` is a Firebase-auth app shell (the RN
counterpart of the `entity_pages` web wrapper) that wires the entity context
around your app. It extends `SudobilityAppRNWithFirebaseAuthProps` from
`@sudobility/building_blocks_rn/firebase` and is subscription-agnostic — layer an
entity-aware subscription provider via the `AppProviders` slot (rendered inside
the entity context). `useCurrentEntity` (re-exported from
`@sudobility/entity_client`) reads the selected entity.

## API

### Pages

| Component | Description |
|-----------|-------------|
| `EntityListPage` | Lists user entities with an inline create-organization form |
| `MembersManagementPage` | Member list, role changes, invite form, pending invitations |
| `InvitationsPage` | User's pending invitations with accept/decline actions |
| `ApiKeysPage` | Entity API key management (list, create, toggle active, revoke) |

### Props

| Interface | Key props |
|-----------|-----------|
| `EntityListPageProps` | `client`, `onSelectEntity?`, `onNavigateToSettings?` |
| `MembersManagementPageProps` | `client`, `entity` (`{ id, entitySlug, displayName, userRole }`), `currentUserId` |
| `InvitationsPageProps` | `client`, `onInvitationAccepted?` |
| `ApiKeysPageProps` | `client`, `entity` (`EntityWithRole`) |
| `SudobilityAppWithFirebaseAuthAndEntitiesProps` | extends `SudobilityAppRNWithFirebaseAuthProps`; adds `apiUrl?`, `AuthAwareEntityProvider?`, `AppProviders?` |

### Also exported

- `SudobilityAppWithFirebaseAuthAndEntities` — Firebase-auth app shell
- `useCurrentEntity` — current selected entity (from `@sudobility/entity_client`)

### Peer dependencies

| Package | Version |
|---------|---------|
| `react` | >=18 |
| `react-native` | >=0.74 |
| `nativewind` | >=4 |
| `@tanstack/react-query` | >=5 |
| `@sudobility/building_blocks_rn` | ^0.0.116 |
| `@sudobility/design` | ^1.1.69 |
| `@sudobility/entity_client` | ^0.0.58 |
| `@sudobility/types` | ^1.9.78 |
| `firebase` | ^11 \|\| ^12 (optional; needed for the app shell) |

## Development

Uses **Bun** (not npm). TypeScript ~6.0, ESM output.

```bash
bun install
bun run build         # tsc -p tsconfig.build.json, then scripts/fix-esm-imports.mjs
bun run typecheck     # tsc --noEmit
bun run lint          # eslint (max-warnings 0)
bun run lint:fix      # eslint --fix
bun run format        # prettier --write
bun run format:check  # prettier --check
bun run test:unit     # vitest run
```

The build runs a post-step (`scripts/fix-esm-imports.mjs`) that rewrites
relative import specifiers in the emitted JS/declarations to fully-qualified
paths (`./core` → `./core/index.js`), so Node's native ESM loader can resolve
them. Build via the `build` script, not bare `tsc`.

## License

BUSL-1.1
