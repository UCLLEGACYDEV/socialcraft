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
    name: "Daniel (Socialcraft AI Admin)",
    email: "admin@socialcraft.ai",
    role: "admin",
    credits: 99999,
    avatarUrl: "/images/socialcraft-admin-logo.jpg",
    status: "active",
    createdAt: "2025-10-01T10:00:00Z",
    lastLoginAt: "2026-09-05T06:30:00Z",
    company: "Socialcraft AI HQ",
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
    const parsed: User[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;

    // Auto-migrate old Alexander admin records to Daniel with brand logo
    let changed = false;
    const migrated = parsed.map((u) => {
      if (u.role === "admin" && (u.name.toLowerCase().includes("alexander") || u.avatarUrl.includes("photo-1534528741775"))) {
        changed = true;
        return {
          ...u,
          name: "Daniel (Socialcraft AI Admin)",
          avatarUrl: "/images/socialcraft-admin-logo.jpg",
          company: "Socialcraft AI HQ",
        };
      }
      return u;
    });

    if (changed) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
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
    const parsed: User = JSON.parse(raw);
    if (parsed && parsed.role === "admin" && (parsed.name.toLowerCase().includes("alexander") || parsed.avatarUrl?.includes("photo-1534528741775"))) {
      const updated = {
        ...parsed,
        name: "Daniel (Socialcraft AI Admin)",
        avatarUrl: "/images/socialcraft-admin-logo.jpg",
        company: "Socialcraft AI HQ",
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return parsed;
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
