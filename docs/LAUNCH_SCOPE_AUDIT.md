# Launch Scope Audit: Route Inventory & Backend Readiness (PROD-01)

This audit documents every route in the AudioBlocks Artist Dashboard against its backend API dependencies, evaluating its production launch readiness and assigning a **Go** / **No-Go** / **Beta** decision.

---

## 1. Executive Summary

- **Total App Routes Audited**: 46 actual pages + 1 dead navigation link identified.
- **Go Routes**: 43 routes are production-ready with real APIs, resilient fallbacks, or direct Stellar Horizon integrations.
- **Beta / Gated Routes**: 1 route (`/dashboard/referrals`) marked Beta (statistics coming soon).
- **No-Go / Hidden Surfaces**:
  - `/dashboard/team`: Gated behind `teamManagement` feature flag (0% rollout) showing explicit "Coming Soon" state until backend role enforcement ships (#525).
  - `/dashboard/premium`: Unbuilt route (404); dead link removed from `Sidebar.tsx`.

---

## 2. Comprehensive 46-Route Inventory Table

| #   | Route Path                             | Module / Feature  | Backend API Dependency                         | Launch Status | Action & Rationale                                                               |
| --- | :------------------------------------- | :---------------- | :--------------------------------------------- | :-----------: | :------------------------------------------------------------------------------- |
| 1   | `/`                                    | Public Landing    | Static presentation & links                    |    **Go**     | Public entry point; ready for production.                                        |
| 2   | `/login`                               | Auth              | Privy Web3 SDK & session cookie                |    **Go**     | Full auth flow with returnTo URL preservation.                                   |
| 3   | `/signup`                              | Auth              | Privy wallet onboarding                        |    **Go**     | Production ready.                                                                |
| 4   | `/verify-email`                        | Auth              | Local verification fallback (#459)             |    **Go**     | Supported with local code validation until SMTP lands.                           |
| 5   | `/verify-email/[token]`                | Auth              | Token decoding endpoint                        |    **Go**     | Token extraction and redirect.                                                   |
| 6   | `/onboarding`                          | Onboarding        | `POST /artist/profile`                         |    **Go**     | Core artist profile setup flow.                                                  |
| 7   | `/artist-portal`                       | Portal Marketing  | Static copy                                    |    **Go**     | Production ready.                                                                |
| 8   | `/artist-portal/signup`                | Portal Onboarding | `POST /auth/register`                          |    **Go**     | Production ready.                                                                |
| 9   | `/artist/[handle]`                     | Public Profile    | `GET /artist/:handle`                          |    **Go**     | Fan-facing profile page with audio embeds.                                       |
| 10  | `/admin/artists`                       | Platform Admin    | Admin JWT & privileged query                   |    **Go**     | Gated to admin sessions (`isAdminSession()`).                                    |
| 11  | `/dashboard`                           | Core Navigation   | Redirects to `/dashboard/overview`             |    **Go**     | Client-side root redirect.                                                       |
| 12  | `/dashboard/overview`                  | Core Dashboard    | `GET /analytics/kpis`, `GET /albums`           |    **Go**     | Primary dashboard with KPI metrics.                                              |
| 13  | `/dashboard/my-music`                  | Music Catalog     | `GET /artist/tracks`, `GET /artist/albums`     |    **Go**     | Core catalog management hub.                                                     |
| 14  | `/dashboard/my-music/tracks`           | Music Catalog     | `GET /artist/tracks`                           |    **Go**     | Track listing, sorting, and playback.                                            |
| 15  | `/dashboard/my-music/tracks/[trackId]` | Music Catalog     | `GET/PATCH /tracks/:id`                        |    **Go**     | Individual track editor and metadata.                                            |
| 16  | `/dashboard/my-music/albums`           | Music Catalog     | `GET /artist/albums`                           |    **Go**     | Album collection view.                                                           |
| 17  | `/dashboard/my-music/albums/[albumId]` | Music Catalog     | `GET /albums/:id`                              |    **Go**     | Album tracklist and release info.                                                |
| 18  | `/dashboard/upload-music`              | Music Catalog     | Cloudflare R2 / S3 signed URLs                 |    **Go**     | Direct audio & artwork upload flow.                                              |
| 19  | `/dashboard/analytics`                 | Analytics         | `GET /analytics/streams`                       |    **Go**     | Stream counters, geography, top tracks.                                          |
| 20  | `/dashboard/payouts`                   | Finance / Web3    | `GET /artist/earnings`, Soroban contracts      |    **Go**     | Real Soroban contract integration (#47).                                         |
| 21  | `/dashboard/events`                    | Live Events       | `GET /artist/events`                           |    **Go**     | Concert and tour date manager.                                                   |
| 22  | `/dashboard/events/[eventId]`          | Live Events       | `GET /events/:id`                              |    **Go**     | Event detail view.                                                               |
| 23  | `/dashboard/events/[eventId]/check-in` | Live Events       | `POST /events/:id/check-in`                    |    **Go**     | QR scanner and attendee admission.                                               |
| 24  | `/dashboard/events/[eventId]/tickets`  | Live Events       | `GET /events/:id/tickets`                      |    **Go**     | Ticket sales tiers.                                                              |
| 25  | `/dashboard/merches`                   | Merchandise       | `GET /artist/merch`                            |    **Go**     | Merchandise storefront.                                                          |
| 26  | `/dashboard/merches/inventory`         | Merchandise       | `GET /artist/merch/inventory`                  |    **Go**     | Inventory counts and stock alerts.                                               |
| 27  | `/dashboard/merches/preview`           | Merchandise       | Local viewport preview                         |    **Go**     | Fan preview (Desktop & Mobile modes).                                            |
| 28  | `/dashboard/messages`                  | Messaging         | `GET /messages`, SSE / Inbox events            |    **Go**     | Live unread badges and messaging thread.                                         |
| 29  | `/dashboard/collaborators`             | Collaboration     | `GET /collaborators`                           |    **Go**     | Collaborator roster.                                                             |
| 30  | `/dashboard/collaborators/royalties`   | Collaboration     | Soroban multi-party contract                   |    **Go**     | On-chain split agreement.                                                        |
| 31  | `/dashboard/moderation`                | Community         | `GET /comments`, `POST /comments/:id/moderate` |    **Go**     | Comment moderation (hide, flag, remove).                                         |
| 32  | `/dashboard/activity-log`              | Security / Audit  | Local & server audit events                    |    **Go**     | Operational log of artist actions.                                               |
| 33  | `/dashboard/onchain-stats`             | Stellar Web3      | Stellar Horizon RPC directly                   |    **Go**     | Direct ledger reads (zero DB dependency).                                        |
| 34  | `/dashboard/profile`                   | Account           | `GET/PATCH /artist/me`                         |    **Go**     | Profile bio, avatar, and social links.                                           |
| 35  | `/dashboard/changelog`                 | Release Notes     | Build-time parser of `CHANGELOG.md`            |    **Go**     | Product changelog timeline.                                                      |
| 36  | `/dashboard/settings/notifications`    | Settings          | `GET/PATCH /artist/settings/notifications`     |    **Go**     | Email and in-app alerts.                                                         |
| 37  | `/dashboard/settings/wallet`           | Settings          | Freighter / Stellar wallet                     |    **Go**     | Wallet connection and public key display.                                        |
| 38  | `/dashboard/settings/network`          | Settings          | Horizon RPC network switcher                   |    **Go**     | Testnet / Mainnet configuration.                                                 |
| 39  | `/dashboard/settings/payout`           | Settings          | `POST /artist/payout-account`                  |    **Go**     | Stellar address for payouts.                                                     |
| 40  | `/dashboard/settings/security`         | Settings          | Privy session revocation & MFA                 |    **Go**     | Session management.                                                              |
| 41  | `/dashboard/settings/appearance`       | Settings          | LocalStorage theme toggle                      |    **Go**     | Dark/light theme.                                                                |
| 42  | `/dashboard/settings/preferences`      | Settings          | `GET/PATCH /artist/settings`                   |    **Go**     | General preferences.                                                             |
| 43  | `/dashboard/settings/linked-accounts`  | Settings          | OAuth providers                                |    **Go**     | Social integrations.                                                             |
| 44  | `/dashboard/settings/verification`     | Settings          | `POST /artist/verify`                          |    **Go**     | Identity verification request.                                                   |
| 45  | `/dashboard/referrals`                 | Growth            | In-progress profile query                      |   **Beta**    | Referral link generated; stats noted coming soon.                                |
| 46  | `/dashboard/team`                      | Teams & Roles     | Pending backend staff API (#525)               |   **No-Go**   | Gated by `teamManagement` feature flag (0% rollout). Shows explicit empty state. |
| —   | `/dashboard/premium`                   | Monetization      | Unbuilt page (404)                             |   **No-Go**   | **Hidden**: Dead link removed from `Sidebar.tsx`.                                |

---

## 3. Unfinished Route Mitigation & Actions

1. **Dead Link Removal**: Removed `/dashboard/premium` from `Sidebar.tsx`. The route does not exist in `app/src/app`, and routing users to a 404 breaks artist trust.
2. **Feature Flag Guarding**: `/dashboard/team` is gated by `FEATURE_FLAGS.teamManagement` (`rolloutPercentage: 0`). When accessed, it displays a polite "Team management is coming soon" empty state.
3. **Launch Scope Helper**: Created `app/src/config/launchScope.ts` with `isRouteVisibleInLaunch()` to filter out unready/no-go items dynamically.
