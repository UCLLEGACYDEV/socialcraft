export type UserRole = "admin" | "creator" | "pro" | "free";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  avatarUrl: string;
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt?: string | undefined;
  company?: string | undefined;
}

export interface AuthState {
  currentUser: User | null;
  users: User[];
}

const AUTH_STORAGE_KEY = "onyx.currentUser";
const USERS_STORAGE_KEY = "onyx.usersList";

export const INITIAL_USERS: User[] = [
  {
    id: "usr-admin-01",
    name: "Alexander Vance",
    email: "admin@socialcraft.ai",
    role: "admin",
    credits: 99999,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    status: "active",
    createdAt: "2025-10-01T10:00:00Z",
    lastLoginAt: "2026-09-05T06:30:00Z",
    company: "Socialcraft HQ",
  },
  {
    id: "usr-creator-02",
    name: "Elena Rostova",
    email: "creator@socialcraft.ai",
    role: "creator",
    credits: 4320,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    status: "active",
    createdAt: "2026-01-15T14:20:00Z",
    lastLoginAt: "2026-09-04T18:10:00Z",
    company: "Viral Growth Agency",
  },
  {
    id: "usr-pro-03",
    name: "Robert Brian",
    email: "robert@brianmedia.io",
    role: "pro",
    credits: 12500,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    status: "active",
    createdAt: "2026-03-12T09:00:00Z",
    lastLoginAt: "2026-09-05T05:45:00Z",
    company: "Brian Media Lab",
  },
  {
    id: "usr-pro-04",
    name: "Courtney Henry",
    email: "courtney@henrystudio.de",
    role: "pro",
    credits: 8200,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    status: "active",
    createdAt: "2026-04-20T11:30:00Z",
    lastLoginAt: "2026-09-03T20:15:00Z",
    company: "Henry Visuals",
  },
  {
    id: "usr-free-05",
    name: "Cody Fisher",
    email: "cody.fisher@gmail.com",
    role: "free",
    credits: 250,
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face",
    status: "active",
    createdAt: "2026-08-01T16:00:00Z",
    lastLoginAt: "2026-08-28T12:00:00Z",
  },
];

export function getStoredUsers(): User[] {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users:", err);
  }
}

export function getStoredCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error("Failed to save auth state:", err);
  }
}
