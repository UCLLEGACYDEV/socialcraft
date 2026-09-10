import { useState, useCallback } from "react";

export interface ScheduledPostInitialItem {
  title: string;
  imageUrls: string[];
  prompt?: string;
}

export function useStudioModals() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showCreditUpgrade, setShowCreditUpgrade] = useState(false);
  const [showBrandProfileManager, setShowBrandProfileManager] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPostForMeSetup, setShowPostForMeSetup] = useState(false);
  const [show30DayBatch, setShow30DayBatch] = useState(false);
  const [showMcp, setShowMcp] = useState(false);
  const [editing, setEditing] = useState<{ jobId?: string; slideId: string } | null>(null);

  const [schedulerInitialItem, setSchedulerInitialItem] = useState<ScheduledPostInitialItem | null>(null);
  const [schedulerSubTab, setSchedulerSubTab] = useState<"queue" | "composer" | "channels">("queue");

  const openAuth = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuth = useCallback(() => setShowAuthModal(false), []);
  const openProfile = useCallback(() => setShowProfileModal(true), []);
  const closeProfile = useCallback(() => setShowProfileModal(false), []);
  const openDatenschutz = useCallback(() => setShowDatenschutz(true), []);
  const closeDatenschutz = useCallback(() => setShowDatenschutz(false), []);
  const openCreditUpgrade = useCallback(() => setShowCreditUpgrade(true), []);
  const closeCreditUpgrade = useCallback(() => setShowCreditUpgrade(false), []);
  const openBrandProfileManager = useCallback(() => setShowBrandProfileManager(true), []);
  const closeBrandProfileManager = useCallback(() => setShowBrandProfileManager(false), []);
  const openBrandKit = useCallback(() => setShowBrandKit(true), []);
  const closeBrandKit = useCallback(() => setShowBrandKit(false), []);
  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const openPostForMeSetup = useCallback(() => setShowPostForMeSetup(true), []);
  const closePostForMeSetup = useCallback(() => setShowPostForMeSetup(false), []);
  const open30DayBatch = useCallback(() => setShow30DayBatch(true), []);
  const close30DayBatch = useCallback(() => setShow30DayBatch(false), []);
  const openMcp = useCallback(() => setShowMcp(true), []);
  const closeMcp = useCallback(() => setShowMcp(false), []);
  const openSlideEdit = useCallback((target: { jobId?: string; slideId: string }) => setEditing(target), []);
  const closeSlideEdit = useCallback(() => setEditing(null), []);

  return {
    // Visibility states
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    showProfileModal,
    setShowProfileModal,
    showDatenschutz,
    setShowDatenschutz,
    showCreditUpgrade,
    setShowCreditUpgrade,
    showBrandProfileManager,
    setShowBrandProfileManager,
    showBrandKit,
    setShowBrandKit,
    showSettings,
    setShowSettings,
    showPostForMeSetup,
    setShowPostForMeSetup,
    show30DayBatch,
    setShow30DayBatch,
    showMcp,
    setShowMcp,
    editing,
    setEditing,
    schedulerInitialItem,
    setSchedulerInitialItem,
    schedulerSubTab,
    setSchedulerSubTab,

    // Action handlers
    openAuth,
    closeAuth,
    openProfile,
    closeProfile,
    openDatenschutz,
    closeDatenschutz,
    openCreditUpgrade,
    closeCreditUpgrade,
    openBrandProfileManager,
    closeBrandProfileManager,
    openBrandKit,
    closeBrandKit,
    openSettings,
    closeSettings,
    openPostForMeSetup,
    closePostForMeSetup,
    open30DayBatch,
    close30DayBatch,
    openMcp,
    closeMcp,
    openSlideEdit,
    closeSlideEdit,
  };
}
