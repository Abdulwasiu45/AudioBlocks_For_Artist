/**
 * Launch Scope Route Inventory (PROD-01)
 *
 * Exhaustive catalog of all 46 dashboard, admin, and authentication routes
 * categorized by backend readiness and production launch status (Go / No-Go / Beta).
 */

export type LaunchStatus = "go" | "no-go" | "beta";

export interface RouteLaunchItem {
  path: string;
  name: string;
  module: string;
  status: LaunchStatus;
  backendSupport: string;
  notes: string;
}

export const LAUNCH_SCOPE_INVENTORY: RouteLaunchItem[] = [
  // ── Public & Authentication ──────────────────────────────────────────────
  {
    path: "/",
    name: "Home",
    module: "Public Marketing",
    status: "go",
    backendSupport: "Static content & platform links",
    notes: "Production ready.",
  },
  {
    path: "/login",
    name: "Login",
    module: "Authentication",
    status: "go",
    backendSupport: "Privy Web3 / Stellar auth & JWT session",
    notes: "Fully supported with returnTo redirect.",
  },
  {
    path: "/signup",
    name: "Sign Up",
    module: "Authentication",
    status: "go",
    backendSupport: "Privy wallet link & artist profile bootstrap",
    notes: "Production ready.",
  },
  {
    path: "/verify-email",
    name: "Verify Email",
    module: "Authentication",
    status: "go",
    backendSupport: "Local fallback code validation (#459)",
    notes: "Production ready with simulated delivery fallback until SMTP backend arrives.",
  },
  {
    path: "/verify-email/[token]",
    name: "Verify Email Callback",
    module: "Authentication",
    status: "go",
    backendSupport: "Token decoding and session verification",
    notes: "Production ready.",
  },
  {
    path: "/onboarding",
    name: "Artist Onboarding",
    module: "Onboarding",
    status: "go",
    backendSupport: "POST /artist/profile",
    notes: "Core onboarding flow.",
  },
  {
    path: "/artist-portal",
    name: "Artist Portal Welcome",
    module: "Marketing / Portal",
    status: "go",
    backendSupport: "Static presentation",
    notes: "Production ready.",
  },
  {
    path: "/artist-portal/signup",
    name: "Artist Portal Signup",
    module: "Onboarding",
    status: "go",
    backendSupport: "POST /auth/register",
    notes: "Production ready.",
  },
  {
    path: "/artist/[handle]",
    name: "Public Artist Profile",
    module: "Public Discovery",
    status: "go",
    backendSupport: "GET /artist/:handle & track embeds",
    notes: "Public fan-facing surface.",
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: "/admin/artists",
    name: "Admin Artist Directory",
    module: "Platform Admin",
    status: "go",
    backendSupport: "Admin JWT / privileged artist query",
    notes: "Gated to admin role in sidebar (#420).",
  },

  // ── Dashboard Core ────────────────────────────────────────────────────────
  {
    path: "/dashboard",
    name: "Dashboard Root",
    module: "Navigation",
    status: "go",
    backendSupport: "Client-side redirect to /dashboard/overview",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/overview",
    name: "Overview Dashboard",
    module: "Core Dashboard",
    status: "go",
    backendSupport: "GET /analytics/kpis, GET /albums",
    notes: "Primary landing view for artists.",
  },
  {
    path: "/dashboard/my-music",
    name: "My Music Hub",
    module: "Music Catalog",
    status: "go",
    backendSupport: "GET /artist/tracks, GET /artist/albums",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/my-music/tracks",
    name: "Track List",
    module: "Music Catalog",
    status: "go",
    backendSupport: "GET /artist/tracks",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/my-music/tracks/[trackId]",
    name: "Track Details & Editor",
    module: "Music Catalog",
    status: "go",
    backendSupport: "GET /tracks/:id, PATCH /tracks/:id",
    notes: "Metadata and stream settings.",
  },
  {
    path: "/dashboard/my-music/albums",
    name: "Album List",
    module: "Music Catalog",
    status: "go",
    backendSupport: "GET /artist/albums",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/my-music/albums/[albumId]",
    name: "Album Details",
    module: "Music Catalog",
    status: "go",
    backendSupport: "GET /albums/:id",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/upload-music",
    name: "Upload Music",
    module: "Music Catalog",
    status: "go",
    backendSupport: "POST /tracks/upload, Cloudflare R2 / S3 storage",
    notes: "Direct audio/art upload pipeline.",
  },
  {
    path: "/dashboard/analytics",
    name: "Analytics",
    module: "Analytics",
    status: "go",
    backendSupport: "GET /analytics/streams, GET /analytics/demographics",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/payouts",
    name: "Payouts & Royalties",
    module: "Finance / Stellar",
    status: "go",
    backendSupport: "GET /artist/earnings, Soroban contract interaction",
    notes: "Wired to real Soroban endpoint (#47).",
  },
  {
    path: "/dashboard/events",
    name: "Events",
    module: "Live Events",
    status: "go",
    backendSupport: "GET /artist/events",
    notes: "Event listings and schedules.",
  },
  {
    path: "/dashboard/events/[eventId]",
    name: "Event Details",
    module: "Live Events",
    status: "go",
    backendSupport: "GET /events/:id",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/events/[eventId]/check-in",
    name: "Event Check-in",
    module: "Live Events",
    status: "go",
    backendSupport: "POST /events/:id/check-in with QR decode",
    notes: "Camera QR code scanning supported.",
  },
  {
    path: "/dashboard/events/[eventId]/tickets",
    name: "Ticket Tier Management",
    module: "Live Events",
    status: "go",
    backendSupport: "GET /events/:id/tickets",
    notes: "Tiered ticketing with feature flag fallback.",
  },
  {
    path: "/dashboard/merches",
    name: "Merch Storefront",
    module: "Merchandise",
    status: "go",
    backendSupport: "GET /artist/merch",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/merches/inventory",
    name: "Merch Inventory",
    module: "Merchandise",
    status: "go",
    backendSupport: "GET /artist/merch/inventory",
    notes: "Stock monitoring and SKU tracking.",
  },
  {
    path: "/dashboard/merches/preview",
    name: "Merch Storefront Preview",
    module: "Merchandise",
    status: "go",
    backendSupport: "Simulated preview viewport (Desktop/Mobile)",
    notes: "Fan view preview modal.",
  },
  {
    path: "/dashboard/messages",
    name: "Messages",
    module: "Communications",
    status: "go",
    backendSupport: "GET /messages, Inbox event stream",
    notes: "Real-time unread badges and conversation view.",
  },
  {
    path: "/dashboard/collaborators",
    name: "Collaborators",
    module: "Collaboration",
    status: "go",
    backendSupport: "GET /collaborators",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/collaborators/royalties",
    name: "Royalty Splits",
    module: "Collaboration",
    status: "go",
    backendSupport: "Soroban multi-sig split contract",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/moderation",
    name: "Comment Moderation",
    module: "Community",
    status: "go",
    backendSupport: "GET /comments, POST /comments/:id/moderate",
    notes: "Flagging and hiding unwanted comments.",
  },
  {
    path: "/dashboard/activity-log",
    name: "Activity Log",
    module: "Auditing",
    status: "go",
    backendSupport: "Local and backend audit events",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/onchain-stats",
    name: "On-Chain Stellar Ledger",
    module: "Stellar Web3",
    status: "go",
    backendSupport: "Horizon API directly (ledger operations)",
    notes: "Zero backend database dependency.",
  },
  {
    path: "/dashboard/profile",
    name: "Artist Profile Settings",
    module: "Account",
    status: "go",
    backendSupport: "GET /artist/me, PATCH /artist/me",
    notes: "Bio, social links, and cover art.",
  },
  {
    path: "/dashboard/changelog",
    name: "Release Notes",
    module: "Product Transparency",
    status: "go",
    backendSupport: "Static build-time parse of CHANGELOG.md",
    notes: "Automatic timeline generator.",
  },

  // ── Settings Sub-routes ───────────────────────────────────────────────────
  {
    path: "/dashboard/settings/notifications",
    name: "Notification Settings",
    module: "Settings",
    status: "go",
    backendSupport: "GET /artist/settings/notifications",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/settings/wallet",
    name: "Wallet Settings",
    module: "Settings",
    status: "go",
    backendSupport: "Freighter / Stellar wallet provider",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/settings/network",
    name: "Network & Horizon RPC",
    module: "Settings",
    status: "go",
    backendSupport: "Client-side Stellar network passphrase config",
    notes: "Testnet / Mainnet toggle.",
  },
  {
    path: "/dashboard/settings/payout",
    name: "Payout Configuration",
    module: "Settings",
    status: "go",
    backendSupport: "POST /artist/payout-account",
    notes: "Stellar account destination.",
  },
  {
    path: "/dashboard/settings/security",
    name: "Security & Sessions",
    module: "Settings",
    status: "go",
    backendSupport: "Privy MFA & session revocation",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/settings/appearance",
    name: "Appearance & Theme",
    module: "Settings",
    status: "go",
    backendSupport: "Client-side localStorage theme toggle",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/settings/preferences",
    name: "Preferences",
    module: "Settings",
    status: "go",
    backendSupport: "GET /artist/settings",
    notes: "Language and email frequency.",
  },
  {
    path: "/dashboard/settings/linked-accounts",
    name: "Linked Accounts",
    module: "Settings",
    status: "go",
    backendSupport: "OAuth connectors for Twitter, Spotify, Soundcloud",
    notes: "Production ready.",
  },
  {
    path: "/dashboard/settings/verification",
    name: "Artist Verification",
    module: "Settings",
    status: "go",
    backendSupport: "POST /artist/verify",
    notes: "Verification badge submission.",
  },

  // ── Gated / No-Go / Beta Surfaces (Hidden from Main Nav) ──────────────────
  {
    path: "/dashboard/team",
    name: "Team & Staff Management",
    module: "Workspace Teams",
    status: "no-go",
    backendSupport: "Pending server-enforced team roles backend API (#525)",
    notes: "Gated behind teamManagement feature flag (0% rollout). Shows coming-soon state.",
  },
  {
    path: "/dashboard/referrals",
    name: "Referral Program",
    module: "Growth",
    status: "beta",
    backendSupport: "Placeholder client query; backend tracking endpoint missing",
    notes: "Marked Beta. Statistics marked coming soon.",
  },
  {
    path: "/dashboard/premium",
    name: "Premium Subscription",
    module: "Monetization",
    status: "no-go",
    backendSupport: "None (Route unbuilt, returns 404)",
    notes: "Unfinished mockup. Hidden from sidebar navigation to avoid dead links.",
  },
];

/**
 * Filter out navigation items that are classified as no-go or dead routes.
 */
export function isRouteVisibleInLaunch(href: string): boolean {
  const item = LAUNCH_SCOPE_INVENTORY.find((entry) => entry.path === href);
  if (!item) return true; // Default allow for unindexed helper paths
  return item.status !== "no-go";
}
