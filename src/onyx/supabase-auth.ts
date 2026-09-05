import { supabase } from "@/integrations/supabase/client";
import {
  type User,
  type UserRole,
  getStoredCurrentUser,
  getStoredUsers,
  saveStoredCurrentUser,
  saveStoredUsers,
  INITIAL_USERS,
} from "./auth";
import { ensureUserS4Folder } from "./s4-storage";
import { ANCHORED_SUPABASE_URL, ANCHORED_SUPABASE_KEY } from "./defaults";

export interface SupabaseAuthResult {
  success: boolean;
  user: User | null;
  error?: string;
  isFallback?: boolean;
}

/**
 * Checks if active Supabase connection variables are available.
 */
export function hasSupabaseConfig(): boolean {
  const url = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || ANCHORED_SUPABASE_URL;
  const key = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || ANCHORED_SUPABASE_KEY;
  return Boolean(url && key && url.trim() && key.trim());
}

/**
 * Standard default Admin credentials suggested for this project
 */
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: "admin@socialcraft.ai",
  password: "SocialcraftAdmin2026!#",
  name: "Alexander Vance (Admin)",
  role: "admin" as UserRole,
};

/**
 * Maps Supabase profile row to local User interface
 */
function mapProfileToUser(profile: Record<string, any>, fallbackEmail: string): User {
  return {
    id: profile.id,
    name: profile.name || "Creator",
    email: profile.email || fallbackEmail,
    role: (profile.role as UserRole) || "creator",
    credits: typeof profile.credits === "number" ? profile.credits : 1000,
    avatarUrl: profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    status: profile.status === "suspended" ? "suspended" : "active",
    company: profile.company || "Socialcraft Studio",
    createdAt: profile.created_at || new Date().toISOString(),
    lastLoginAt: profile.last_login_at || new Date().toISOString(),
  };
}

/**
 * Sign In with Supabase (with fallback to local accounts)
 */
export async function signInUser(
  email: string,
  password: string
): Promise<SupabaseAuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  // If Supabase keys are provided, authenticate via Supabase Auth
  if (hasSupabaseConfig()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        return { success: false, user: null, error: authError.message };
      }

      const authUser = authData.user;
      if (!authUser) {
        return { success: false, user: null, error: "Benutzer konnte nicht geladen werden" };
      }

      // Fetch profile from isolated socialcraft_profiles table
      let userProfile: User;
      const { data: profileData, error: profileError } = await supabase
        .from("socialcraft_profiles" as any)
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileData && !profileError) {
        userProfile = mapProfileToUser(profileData, authUser.email || cleanEmail);
      } else {
        // Fallback: Create initial profile in socialcraft_profiles
        const isAdmin = cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email || authUser.user_metadata?.role === "admin";
        const newProfile = {
          id: authUser.id,
          email: authUser.email || cleanEmail,
          name: authUser.user_metadata?.name || splitEmailName(cleanEmail),
          role: isAdmin ? "admin" : "creator",
          credits: isAdmin ? 99999 : 1000,
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
          company: "Socialcraft Studio",
          status: "active",
        };

        await supabase.from("socialcraft_profiles" as any).upsert(newProfile);
        userProfile = mapProfileToUser(newProfile, cleanEmail);
      }

      if (userProfile.status === "suspended") {
        await supabase.auth.signOut();
        return { success: false, user: null, error: "Dieses Konto ist gesperrt." };
      }

      saveStoredCurrentUser(userProfile);
      void ensureUserS4Folder(userProfile);
      return { success: true, user: userProfile, isFallback: false };
    } catch (err: unknown) {
      console.warn("[SupabaseAuth] Online sign-in error, trying local fallback:", err);
    }
  }

  // Local / Offline Fallback Auth
  const users = getStoredUsers();
  let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  // If logging in with the default admin account
  if (!found && cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email) {
    found = {
      id: "usr-admin-01",
      name: DEFAULT_ADMIN_CREDENTIALS.name,
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      role: "admin",
      credits: 99999,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      status: "active",
      createdAt: new Date().toISOString(),
      company: "Socialcraft HQ",
    };
    saveStoredUsers([found, ...users]);
  }

  if (!found) {
    return { success: false, user: null, error: "Kein Konto mit dieser E-Mail-Adresse gefunden." };
  }

  if (found.status === "suspended") {
    return { success: false, user: null, error: "Dieses Konto ist vorübergehend gesperrt." };
  }

  const updatedUser: User = {
    ...found,
    lastLoginAt: new Date().toISOString(),
  };

  saveStoredCurrentUser(updatedUser);
  void ensureUserS4Folder(updatedUser);
  return { success: true, user: updatedUser, isFallback: true };
}

/**
 * Register a new User with Supabase (and local sync)
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = "creator"
): Promise<SupabaseAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // If Supabase keys are configured, sign up via Supabase Auth
  if (hasSupabaseConfig()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            app: "socialcraft",
            name: cleanName,
            role,
          },
        },
      });

      if (authError) {
        return { success: false, user: null, error: authError.message };
      }

      const authUser = authData.user;
      if (authUser) {
        const isAdmin = cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email || role === "admin";
        const newProfile = {
          id: authUser.id,
          email: cleanEmail,
          name: cleanName,
          role: isAdmin ? "admin" : role,
          credits: isAdmin ? 99999 : 1000,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`,
          company: "Socialcraft Studio",
          status: "active",
        };

        await supabase.from("socialcraft_profiles" as any).upsert(newProfile);
        const mapped = mapProfileToUser(newProfile, cleanEmail);
        saveStoredCurrentUser(mapped);
        void ensureUserS4Folder(mapped);
        return { success: true, user: mapped, isFallback: false };
      }
    } catch (err: unknown) {
      console.warn("[SupabaseAuth] Sign up error, trying local fallback:", err);
    }
  }

  // Local fallback registration
  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, user: null, error: "Ein Benutzer mit dieser E-Mail existiert bereits." };
  }

  const isAdmin = cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email || role === "admin";
  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role: isAdmin ? "admin" : role,
    credits: isAdmin ? 99999 : 1000,
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`,
    status: "active",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    company: "Socialcraft Studio",
  };

  saveStoredUsers([newUser, ...users]);
  saveStoredCurrentUser(newUser);
  void ensureUserS4Folder(newUser);
  return { success: true, user: newUser, isFallback: true };
}

/**
 * Sign out user
 */
export async function signOutUser(): Promise<void> {
  if (hasSupabaseConfig()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[SupabaseAuth] Sign out error:", err);
    }
  }
  saveStoredCurrentUser(null);
}

function splitEmailName(email: string): string {
  const prefix = email.split("@")[0] || "User";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
