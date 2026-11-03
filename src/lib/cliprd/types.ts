export type Role = "admin" | "clipper";
export type AccountStatus = "pending" | "active" | "inactive" | "suspended";

export type Profile = {
  userId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  status: AccountStatus;
  phone: string | null;
  agencyName: string;
  termsVersion: string;
};

export type Clip = {
  id: number;
  userId: string;
  ownerName: string;
  provider: "tiktok" | "youtube";
  platformId: string;
  declaredPlatform: string;
  classification: "confirmed" | "unconfirmed" | "conflict";
  externalId: string;
  url: string;
  title: string;
  description: string;
  channelName: string | null;
  publishedOn: string | null;
  durationSeconds: number | null;
  status: string;
  availability: string;
  statsSource: string;
  statsVerified: boolean;
  publicViews: number;
  validViews: number;
  billedViews: number;
  viewsLocked: boolean;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  flags: string[];
  statsUpdatedAt: string | null;
  statsError: string | null;
  rejectionReason: string | null;
  earning: string;
  createdAt: string;
};

export type StatPoint = { bucket: string; views: number; amount: string };
export type PlatformStat = { platformId: string; views: number; amount: string; posts: number };

export type Balance = {
  earned: string;
  committed: string;
  paid: string;
  pending: string;
  available: string;
};

export type RankRow = {
  place: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  views: number;
  posts: number;
  earnings: string;
  bestPlatform: string | null;
};

export type ReportTable = {
  title: string;
  columns: string[];
  rows: string[][];
};
