# entity_pages_rn - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it. Stay on the current branch — no feature branches.

## What it is

React Native **library** (`@sudobility/entity_pages_rn`) of page components for
entity/organization management: entity listing, member management, invitations,
API keys, plus a Firebase-auth app shell. Business logic/data fetching lives in
`@sudobility/entity_client` (TanStack Query hooks); styling is NativeWind. RN
counterpart of the web package `@sudobility/entity_pages`.

Not an app — no Expo, no native project, nothing to "run". It builds to `dist/`
and is published to **GitHub Packages**.

## Stack

- ESM (`"type": "module"`), TypeScript ~6.0, target ES2020, `moduleResolution: bundler`, strict.
- Package manager **Bun** (never npm). License BUSL-1.1.
- Build output `dist/` (JS + `.d.ts` + maps).
- Tests: Vitest (jsdom) — `react-native` is aliased to a mock (`src/__tests__/mocks/react-native.ts`).

## Commands (verified)

```bash
bun run build         # tsc -p tsconfig.build.json + scripts/fix-esm-imports.mjs
bun run typecheck     # tsc --noEmit
bun run lint          # eslint, --max-warnings 0
bun run lint:fix      # eslint --fix
bun run format        # prettier --write
bun run format:check  # prettier --check
bun run test:unit     # vitest run   (NOTE: script is test:unit, not "test")
```

## Layout

```
src/
├── index.ts          # Barrel: pages + app shell + types
├── pages/
│   ├── index.ts
│   ├── EntityListPage.tsx          # entity list + inline create-org form
│   ├── MembersManagementPage.tsx   # members, role changes, invite, pending invites
│   ├── InvitationsPage.tsx         # user's pending invitations, accept/decline
│   └── ApiKeysPage.tsx             # entity API keys: list/create/toggle/revoke
├── app/
│   ├── index.ts
│   └── SudobilityAppWithFirebaseAuthAndEntities.tsx  # Firebase-auth app shell
└── __tests__/        # vitest specs + RN mock + setup (excluded from build)
```

## Exports

- Pages: `EntityListPage`, `MembersManagementPage`, `InvitationsPage`, `ApiKeysPage`
  (+ matching `*Props` types).
- `SudobilityAppWithFirebaseAuthAndEntities` (+ `...Props`) — app shell extending
  `SudobilityAppRNWithFirebaseAuthProps` from `@sudobility/building_blocks_rn/firebase`;
  subscription-agnostic, layer providers via the `AppProviders` slot (inside the entity context).
- `useCurrentEntity` — re-exported from `@sudobility/entity_client`.

> There is no `TosScreen` (removed; older docs referenced it).

## Peer dependencies

`react>=18`, `react-native>=0.74`, `nativewind>=4`, `@tanstack/react-query>=5`,
`@sudobility/building_blocks_rn ^0.0.116`, `@sudobility/design ^1.1.69`,
`@sudobility/entity_client ^0.0.58`, `@sudobility/types ^1.9.78`,
`firebase ^11||^12` (optional — only the app shell needs it).

## Conventions

- **Dependency injection, not context:** every page takes an `EntityClient` prop and
  calls `entity_client` hooks (`useEntities`, `useEntityMembers`, `useCreateEntity`, …).
- **NativeWind** (`className` + Tailwind utilities). Consuming apps must add this
  package's source to their `tailwind.config.js` `content` paths.
- **Native `Alert.alert`** for destructive confirmations (remove member, revoke key, decline).
- Each page handles loading (`ActivityIndicator`), error (with retry), and empty states.

## Gotchas

- **Build, don't bare-`tsc`.** `scripts/fix-esm-imports.mjs` runs after `tsc` and rewrites
  relative specifiers to fully-qualified paths (`./core` → `./core/index.js`) so Node's
  native ESM loader resolves the output. Skipping it ships unresolvable imports.
- **GitHub Packages auth.** `.npmrc` points `@sudobility` at `https://npm.pkg.github.com`;
  installs need a `read:packages` token (`GH_PACKAGES_READ_TOKEN`). CI publishes via
  `.github/workflows/ci-cd.yml` (reusable `johnqh/workflows` `unified-cicd`, `publish-target: github`).
- Version bumps + `building_blocks_rn` bumps dominate the git history; keep them in sync.

## Screen rendering — safe area & scroll insets

Honour the device safe area on **every** screen. Use `useSafeAreaInsets()` from
`react-native-safe-area-context` (or `SafeAreaView` with explicit `edges`) and pad by the
actual inset value. **Never hard-code a padding/margin in place of an inset** — a magic
number like `paddingBottom: 80` clears today's phone and is wrong on the next.

Decide per axis, by whether that axis scrolls:

- **NOT vertically scrollable** (fixed screen, pinned footer/CTA, camera overlay): content
  stops at the top and bottom insets — pad top by `insets.top`, bottom by `insets.bottom`.
  It must not reach the physical edge.
- **Vertically scrollable**: render full-bleed to top/bottom and give top/bottom scroll
  insets equal to the safe area (`contentInset` + `scrollIndicatorInsets`, or
  `contentInsetAdjustmentBehavior="automatic"`).
- **Horizontal**: not scrollable → pad `insets.left`/`insets.right`; scrollable → render to
  the edges with left/right scroll insets.

**Bottom CTAs under a tab bar — the trap:** inside a tab navigator, `insets.bottom` already
includes the tab-bar height. A pinned bottom bar padded by `insets.bottom` already lands
above the tab bar. DO pad by `insets.bottom` and nothing more. DON'T add tab-bar height on
top, DON'T reserve it again on the screen root, DON'T pass a `tabBarHeight` that swaps the
inset for a flat gap. Canonical fixed-screen shape: flex-column root → content/scroll region
→ bottom action bar as the last child padding by `insets.bottom`. Copy a screen already doing
this correctly rather than re-deriving the padding.
