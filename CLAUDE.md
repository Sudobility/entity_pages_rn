# entity_pages_rn - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

## Overview

React Native page components for entity/organization management. Provides ready-to-use screens for entity listing, member management, invitations, and terms of service acceptance. Uses `@sudobility/entity_client` hooks for data fetching via TanStack Query.

- **Package**: `@sudobility/entity_pages_rn`
- **Version**: 0.0.3
- **License**: BUSL-1.1
- **Module format**: ESM (`"type": "module"`)
- **Package Manager**: Bun (never npm)
- **TypeScript**: ^5.5.0, target ES2020, bundler module resolution, strict mode
- **Build output**: `dist/` (declarations + JS)

## Project Structure

```
entity_pages_rn/
├── package.json
├── tsconfig.json              # Base TS config (strict, declarations, outDir: dist/)
├── tsconfig.build.json        # Build config (extends base, excludes tests)
├── nativewind-env.d.ts        # NativeWind type declarations for className props
└── src/
    ├── index.ts               # Barrel exports (all pages + prop types)
    └── pages/
        ├── index.ts           # Page barrel exports
        ├── EntityListPage.tsx  # Entity list with create organization form
        ├── MembersManagementPage.tsx  # Member list, role management, invitations
        ├── InvitationsPage.tsx # Pending invitations with accept/decline
        └── TosScreen.tsx      # Terms of service acceptance screen
```

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `EntityListPage` | component | Lists user entities, create organization inline form |
| `MembersManagementPage` | component | Member list + role changes + invite form + pending invitations |
| `InvitationsPage` | component | User's pending invitations with accept/decline actions |
| `TosScreen` | component | Scrollable terms of service with accept/cancel footer |
| `EntityListPageProps` | interface | Props: `client`, `onSelectEntity?`, `onNavigateToSettings?` |
| `MembersManagementPageProps` | interface | Props: `client`, `entity`, `currentUserId` |
| `InvitationsPageProps` | interface | Props: `client`, `onInvitationAccepted?` |
| `TosScreenProps` | interface | Props: `onAccept`, `onCancel`, `isLoading?` |

## Commands

```bash
bun run build        # Build TypeScript to dist/ (uses tsconfig.build.json)
bun run typecheck    # TypeScript check (no emit)
```

## Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | >=18 | React core |
| `react-native` | >=0.74 | React Native framework |
| `nativewind` | >=4 | NativeWind (Tailwind CSS for React Native) |
| `@tanstack/react-query` | >=5 | Data fetching and caching |
| `@sudobility/entity_client` | ^0.0.33 | Entity API client and hooks |
| `@sudobility/types` | ^1.9.61 | Shared type definitions |

## Coding Patterns

- **All pages accept an `EntityClient` instance** -- dependency injection, not context-based.
- **Uses `@sudobility/entity_client` hooks directly** -- pages call `useEntities`, `useEntityMembers`, `useCreateEntity`, etc.
- **NativeWind (Tailwind CSS) for styling** -- uses `className` props with Tailwind utility classes. Consuming apps must include this package's source in their `tailwind.config.js` content paths.
- **Alert.alert for confirmations** -- destructive actions (remove member, decline invitation) use native alerts.
- **Loading/error/empty states** -- each page handles ActivityIndicator loading, error with retry, and empty list states.

## Related Projects

- **entity_client** (`@sudobility/entity_client`) -- provides `EntityClient` and all TanStack Query hooks used by these pages.
- **entity_pages** (`@sudobility/entity_pages`) -- web counterpart of this package.

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.

## Screen rendering — safe area & scroll insets

Honour the device safe area on **every** screen. Always use `useSafeAreaInsets()`
from `react-native-safe-area-context` (or a `SafeAreaView` with explicit `edges`)
and pad by the actual inset value. **Never hard-code a padding/margin in place of
an inset** — a magic number like `paddingBottom: 80` happens to clear today's
phone and is wrong on the next one.

Decide per axis, by whether that axis scrolls:

**Vertical:**
- **NOT vertically scrollable** (a fixed screen, a pinned footer/CTA, a camera
  overlay): the content area must stop at the **top and bottom** safe-area insets
  — pad top by `insets.top`, bottom by `insets.bottom`. It must not reach the
  physical top/bottom edge (status bar / notch / home indicator).
- **Vertically scrollable**: let the scroll view render **full-bleed** to the top
  and bottom edges, and give it top/bottom **scroll insets** equal to the safe
  area (`contentInset` + `scrollIndicatorInsets`, or
  `contentInsetAdjustmentBehavior="automatic"`). Content then starts/ends clear of
  the unsafe regions while still scrolling edge-to-edge behind them.

**Horizontal** (landscape, display cutout, rounded corners):
- **NOT horizontally scrollable**: pad left/right by `insets.left` / `insets.right`.
- **Horizontally scrollable**: render to the left/right edges and give it
  left/right scroll insets.

**Bottom CTAs under a tab bar — the trap that burns everyone:** inside a tab
navigator, the bottom safe-area inset (`insets.bottom`, and what a shared
`BottomActionBar` reads) **already includes the tab-bar height**. So a pinned
bottom bar padded by `insets.bottom` already lands above the tab bar. Therefore:
- DO pad the bottom bar by `insets.bottom` and nothing more.
- DON'T add the tab-bar height on top of the inset, and DON'T reserve it again on
  the screen root — that double-counts and floats the CTA too high.
- DON'T pass a `tabBarHeight` (or similar) that makes the bar swap the inset for a
  flat fixed gap — that ignores the inset and drops the CTA under the tab bar.

Canonical fixed-screen shape: a flex-column root → the content/scroll region →
a bottom action bar as the **last child** that pads by `insets.bottom` with no
manual tab-bar math. Copy a screen already doing this correctly (e.g. a Settings
screen with a Sign-Out button) rather than re-deriving the padding.
