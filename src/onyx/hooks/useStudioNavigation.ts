import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type User, getStoredCurrentUser, getStoredUsers, saveStoredCurrentUser } from "@/onyx/auth";
import { LS, usePersistentState } from "@/onyx/storage";
import type { TabKey } from "@/onyx/types";

export const TAB_ROUTE_MAP: Record<TabKey, string> = {
  carousel: "/studio",
  bulk: "/serie",
  "direct-prompt": "/einzelbild",
  scheduler: "/planer",
  "ai-clone": "/klon",
  "prompt-gallery": "/prompts",
  history: "/galerie",
};

export const ROUTE_TAB_MAP: Record<string, TabKey> = {
  "/studio": "carousel",
  "/serie": "bulk",
  "/einzelbild": "direct-prompt",
  "/planer": "scheduler",
  "/klon": "ai-clone",
  "/prompts": "prompt-gallery",
  "/galerie": "history",
};

export interface UseStudioNavigationOptions {
  routeTab?: TabKey;
  initialView?: "landing" | "studio" | "admin";
}

export function useStudioNavigation({ routeTab, initialView }: UseStudioNavigationOptions = {}) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser());
  const [currentView, setCurrentView] = usePersistentState<"landing" | "studio" | "admin">(
    "onyx.currentView",
    initialView || (currentUser || routeTab ? "studio" : "landing"),
  );

  const [activeTab, setActiveTab] = usePersistentState<TabKey>(
    LS.activeTab,
    routeTab || "carousel",
  );

  // SaaS rule: Authenticated users stay in the Studio workspace; never bounced to marketing landing page
  useEffect(() => {
    if ((currentUser || routeTab) && currentView === "landing") {
      setCurrentView("studio");
    }
  }, [currentUser, routeTab, currentView, setCurrentView]);

  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView, setCurrentView]);

  useEffect(() => {
    if (routeTab) {
      setActiveTab(routeTab);
      setCurrentView("studio");
    }
  }, [routeTab, setActiveTab, setCurrentView]);

  // Prevent automatic downward scroll on reload and tab switch
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentView]);

  // Sync initial URL path if opened directly without routeTab
  useEffect(() => {
    if (typeof window !== "undefined" && !routeTab) {
      const path = window.location.pathname;
      const matched = ROUTE_TAB_MAP[path];
      if (matched) {
        setActiveTab(matched);
        setCurrentView("studio");
      } else if (path === "/admin") {
        setCurrentView("admin");
      }
    }
  }, [routeTab, setActiveTab, setCurrentView]);

  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const matched = ROUTE_TAB_MAP[path];
      if (matched) {
        setActiveTab(matched);
        setCurrentView("studio");
      } else if (path === "/admin") {
        setCurrentView("admin");
      } else if (path === "/") {
        if (!currentUser) {
          setCurrentView("landing");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser, setActiveTab, setCurrentView]);

  const handleTabChange = useCallback(
    (newTab: TabKey) => {
      setActiveTab(newTab);
      const targetUrl = TAB_ROUTE_MAP[newTab];
      if (targetUrl && typeof window !== "undefined" && window.location.pathname !== targetUrl) {
        window.history.pushState(null, "", targetUrl);
      }
    },
    [setActiveTab],
  );

  const handleLogout = useCallback(() => {
    saveStoredCurrentUser(null);
    setCurrentUser(null);
    setCurrentView("landing");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
    toast.info("Erfolgreich abgemeldet.");
  }, [setCurrentView]);

  const handleAuthSuccess = useCallback(
    (user: User) => {
      setCurrentUser(user);
      setCurrentView("studio");
      toast.success(`Willkommen im Studio, ${user.name}! 🚀`, {
        description: "Deine 500 Erstellungs-Credits sind sofort einsatzbereit.",
      });
    },
    [setCurrentView],
  );

  const handleOpenAdmin = useCallback(() => {
    if (currentUser?.role !== "admin") {
      const users = getStoredUsers();
      const adminUser = users.find((u) => u.role === "admin") ?? {
        id: "usr-admin-01",
        name: "Daniel (Socialcraft AI Admin)",
        email: "admin@socialcraft.ai",
        role: "admin" as const,
        credits: 99999,
        createdAt: new Date().toISOString(),
        avatarUrl: "/images/socialcraft-admin-logo.jpg",
        status: "active" as const,
      };
      saveStoredCurrentUser(adminUser);
      setCurrentUser(adminUser);
      toast.success("Als Administrator angemeldet! 🛡️", {
        description: "Willkommen im Admin Control Center mit 99.999 Credits.",
      });
    }
    setCurrentView("admin");
    if (typeof window !== "undefined" && window.location.pathname !== "/admin") {
      window.history.pushState(null, "", "/admin");
    }
  }, [currentUser, setCurrentView]);

  return {
    currentUser,
    setCurrentUser,
    currentView,
    setCurrentView,
    activeTab,
    setActiveTab,
    handleTabChange,
    handleLogout,
    handleAuthSuccess,
    handleOpenAdmin,
  };
}
