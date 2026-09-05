import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Check,
  Coins,
  Cpu,
  Download,
  Flame,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  type User,
  type UserRole,
  getStoredCurrentUser,
  getStoredUsers,
  saveStoredCurrentUser,
  saveStoredUsers,
} from "../auth";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  currentUser: User | null;
  onNavigateLanding: () => void;
  onNavigateStudio: () => void;
  onLogout: () => void;
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  targetUser?: string;
  details: string;
}

const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-09-05 06:12",
    adminName: "Daniel (Socialcraft AI Admin)",
    action: "Credits gutgeschrieben",
    targetUser: "Elena Rostova",
    details: "+2.000 Credits (Profi-Paket Update)",
  },
  {
    id: "log-2",
    timestamp: "2026-09-05 04:30",
    adminName: "Daniel (Socialcraft AI Admin)",
    action: "System Update",
    details: "Nano Banana 2 Proxy Cache optimiert",
  },
  {
    id: "log-3",
    timestamp: "2026-09-04 19:45",
    adminName: "Daniel (Socialcraft AI Admin)",
    action: "Rolle aktualisiert",
    targetUser: "Robert Brian",
    details: "Hochgestuft auf 'pro'",
  },
  {
    id: "log-4",
    timestamp: "2026-09-04 11:20",
    adminName: "Daniel (Socialcraft AI Admin)",
    action: "Neuer Benutzer",
    targetUser: "Cody Fisher",
    details: "Registrierung bestätigt (+500 Welcome Credits)",
  },
];

export function AdminDashboard({
  currentUser,
  onNavigateLanding,
  onNavigateStudio,
  onLogout,
}: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>(getStoredUsers());
  const [activeSubTab, setActiveSubTab] = useState<"users" | "credits" | "system">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_LOGS);

  // New User Dialog State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("creator");
  const [newUserCredits, setNewUserCredits] = useState<number>(1000);

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [welcomeBonus, setWelcomeBonus] = useState(500);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const updateUsersList = (newUsers: User[]) => {
    setUsers(newUsers);
    saveStoredUsers(newUsers);
  };

  const handleAddCredits = (userId: string, amount: number) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, credits: u.credits + amount };
      }
      return u;
    });
    updateUsersList(updated);

    const target = users.find((u) => u.id === userId);
    if (target) {
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        adminName: currentUser?.name ?? "Admin",
        action: "Credits gutgeschrieben",
        targetUser: target.name,
        details: `+${amount} Credits manuell gebucht`,
      };
      setAuditLogs([newLog, ...auditLogs]);
      toast.success(`+${amount} Credits an ${target.name} gebucht!`);
    }
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    updateUsersList(updated);

    const target = users.find((u) => u.id === userId);
    if (target) {
      toast.success(`Rolle von ${target.name} auf '${newRole.toUpperCase()}' geändert.`);
    }
  };

  const handleToggleStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const newStatus = u.status === "active" ? "suspended" : "active";
        return { ...u, status: newStatus as "active" | "suspended" };
      }
      return u;
    });
    updateUsersList(updated);

    const target = users.find((u) => u.id === userId);
    if (target) {
      const next = target.status === "active" ? "gesperrt" : "aktiviert";
      toast.info(`Benutzer ${target.name} wurde ${next}.`);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("Du kannst dein eigenes Admin-Konto nicht löschen.");
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (window.confirm(`Benutzer ${target?.name} wirklich unwiderruflich löschen?`)) {
      const updated = users.filter((u) => u.id !== userId);
      updateUsersList(updated);
      toast.success(`Benutzer ${target?.name} gelöscht.`);
    }
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      credits: newUserCredits,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face`,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    updateUsersList([newUser, ...users]);
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserCredits(1000);
    toast.success(`Benutzer ${newUser.name} erfolgreich angelegt.`);
  };

  const handleGlobalCreditDrop = () => {
    const amount = 250;
    const updated = users.map((u) => ({ ...u, credits: u.credits + amount }));
    updateUsersList(updated);
    toast.success(`🎉 Globaler Drop: Alle ${users.length} Benutzer erhielten +${amount} Credits!`);
  };

  return (
    <div className="min-h-screen bg-[#0A080E] text-white selection:bg-[#FF4D17]/30">
      {/* ── Top Admin Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#100D15]/80 px-6 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Brand + Badge */}
          <div
            onClick={onNavigateStudio}
            className="flex items-center gap-3 cursor-pointer group"
            title="Zurück zum Studio"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF3B00] to-[#FFA149] shadow-[0_0_20px_-3px_#FF4D17] transition-transform group-hover:scale-105">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-primary-bright transition-colors">Socialcraft</span>
                <span className="rounded-full border border-[#FF4D17]/50 bg-[#FF4D17]/20 px-2 py-0.5 text-[10px] font-bold text-[#FFA149] uppercase tracking-wider">
                  Admin Konsole
                </span>
              </div>
              <p className="text-[11px] text-white/50">System Management & Benutzer-Administration</p>
            </div>
          </div>

          {/* Center: Navigation Pill */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setActiveSubTab("users")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeSubTab === "users"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_16px_-2px_#FF4D17]"
                  : "text-white/70 hover:text-white",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Benutzer ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("credits")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeSubTab === "credits"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_16px_-2px_#FF4D17]"
                  : "text-white/70 hover:text-white",
              )}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Credits & Logs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("system")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeSubTab === "system"
                  ? "bg-[#FF4D17] text-white shadow-[0_0_16px_-2px_#FF4D17]"
                  : "text-white/70 hover:text-white",
              )}
            >
              <Server className="h-3.5 w-3.5" />
              <span>System & APIs</span>
            </button>
          </div>

          {/* Right: Quick Action Return */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateStudio}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary-bright hover:bg-primary/30 transition-all shadow-[0_0_15px_-4px_#FF4D17]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Zum Studio</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-red-400 hover:border-red-500/30 transition-all"
              title="Abmelden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Admin Container ──────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* KPI Grid */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/60 mb-2">
              <span className="text-xs font-medium">Registrierte Benutzer</span>
              <Users className="h-4 w-4 text-primary-bright" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{users.length}</span>
              <span className="text-[11px] font-semibold text-emerald-400">+14% MoM</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Davon {users.filter(u => u.role === 'admin').length} Admins, {users.filter(u => u.role === 'pro').length} Pro</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/60 mb-2">
              <span className="text-xs font-medium">Generierte Karussells</span>
              <Flame className="h-4 w-4 text-[#FFA149]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">8.942</span>
              <span className="text-[11px] font-semibold text-emerald-400">+382 diese Woche</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Ø 6.2 Slides pro Karussell</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/60 mb-2">
              <span className="text-xs font-medium">Aktiver Credit-Pool</span>
              <Coins className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {users.reduce((acc, u) => acc + u.credits, 0).toLocaleString()} cr
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Guthaben über alle Benutzerkonten</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between text-white/60 mb-2">
              <span className="text-xs font-medium">System Uptime</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">99.98%</span>
              <span className="text-[11px] font-semibold text-white/60">Operational</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">Banana 2, Flux, Gemini online</p>
          </div>
        </div>

        {/* ── Tab Content: Users Management ────────────────────────── */}
        {activeSubTab === "users" && (
          <div className="space-y-4">
            {/* Filter and Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#120F17]/80 p-4 backdrop-blur-xl">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Benutzer suchen nach Name oder E-Mail..."
                    className="field-input w-full pl-9 pr-4 py-2 text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {["all", "admin", "creator", "pro", "free"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[11px] font-medium capitalize transition-all",
                        roleFilter === role
                          ? "bg-white/15 text-white font-semibold"
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]",
                      )}
                    >
                      {role === "all" ? "Alle Rollen" : role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGlobalCreditDrop}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>+250 cr an Alle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="cryptox-orange-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Neuer Benutzer</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#120F17]/70 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-white/60">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Benutzer</th>
                      <th className="px-4 py-3.5 font-semibold">Rolle</th>
                      <th className="px-4 py-3.5 font-semibold">Credits</th>
                      <th className="px-4 py-3.5 font-semibold">Status</th>
                      <th className="px-4 py-3.5 font-semibold">Erstellt</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredUsers.map((user) => {
                      const isMe = user.id === currentUser?.id;
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover border border-white/10"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 font-medium text-white">
                                  <span>{user.name}</span>
                                  {isMe && (
                                    <span className="rounded bg-primary/20 text-primary-bright px-1 py-0.2 text-[9px] font-bold">
                                      Du
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-white/50">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-primary/50"
                            >
                              <option value="admin" className="bg-[#120F17] text-white">Admin</option>
                              <option value="pro" className="bg-[#120F17] text-white">Pro Creator</option>
                              <option value="creator" className="bg-[#120F17] text-white">Creator</option>
                              <option value="free" className="bg-[#120F17] text-white">Free</option>
                            </select>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-amber-400">
                                {user.credits.toLocaleString()} cr
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddCredits(user.id, 500)}
                                className="rounded bg-white/[0.06] hover:bg-white/[0.12] px-1.5 py-0.5 text-[10px] font-medium text-white/80 transition-colors"
                                title="+500 Credits aufladen"
                              >
                                +500
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                                user.status === "active"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  user.status === "active" ? "bg-emerald-400" : "bg-red-400",
                                )}
                              />
                              {user.status === "active" ? "Aktiv" : "Gesperrt"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-white/50 text-[11px]">
                            {new Date(user.createdAt).toLocaleDateString("de-DE")}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user.id)}
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
                                  user.status === "active"
                                    ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
                                )}
                                title={user.status === "active" ? "Benutzer sperren" : "Benutzer aktivieren"}
                              >
                                {user.status === "active" ? (
                                  <UserX className="h-3.5 w-3.5" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Benutzer löschen"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: Credits & Logs ──────────────────────────── */}
        {activeSubTab === "credits" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Audit Log */}
            <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#120F17]/80 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary-bright" />
                Audit-Logbuch der letzten Aktionen
              </h3>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{log.action}</span>
                        {log.targetUser && (
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                            Ziel: {log.targetUser}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-white/60">{log.details}</p>
                    </div>
                    <div className="text-right text-[11px] text-white/40 whitespace-nowrap">
                      <div>{log.timestamp}</div>
                      <div className="text-primary-bright">{log.adminName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Credit Packages Config */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#120F17]/80 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Credit-Pakete & Tarife
                </h3>
                <p className="text-xs text-white/60 mb-4">
                  Standard-Startguthaben und Paketkonfigurationen für neue Creator.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div>
                      <div className="font-semibold text-white">Willkommens-Bonus</div>
                      <div className="text-[11px] text-white/50">Automatisch bei Neuregistrierung</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={welcomeBonus}
                        onChange={(e) => setWelcomeBonus(Number(e.target.value))}
                        className="w-20 field-input text-right py-1 px-2 text-xs rounded-lg"
                      />
                      <span className="text-white/60 font-mono">cr</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
                    <div className="font-semibold text-white">Verfügbare Pakete im Store</div>
                    <div className="flex justify-between text-white/70">
                      <span>Starter (10 Karussells):</span>
                      <span className="font-mono text-amber-400">1.000 cr / 19 €</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Pro Creator (50 Karussells):</span>
                      <span className="font-mono text-amber-400">5.000 cr / 49 €</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Agency Uncut (Unbegrenzt):</span>
                      <span className="font-mono text-amber-400">25.000 cr / 199 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: System & APIs ───────────────────────────── */}
        {activeSubTab === "system" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Health */}
            <div className="rounded-2xl border border-white/10 bg-[#120F17]/80 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary-bright" />
                Live API-Status der AI Provider
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { name: "Google Vertex / Gemini 2.0 Flash", latency: "240ms", status: "Operational" },
                  { name: "Nano Banana 2 Image Engine", latency: "1.4s", status: "Operational" },
                  { name: "FLUX Schnell (fal.ai / Replicate)", latency: "890ms", status: "Operational" },
                  { name: "Anthropic Claude 3.5 Sonnet", latency: "410ms", status: "Operational" },
                  { name: "Local Browser ZIP Export Engine", latency: "12ms", status: "Operational" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-[11px] text-white/40">Latenz: {item.latency}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Flags */}
            <div className="rounded-2xl border border-white/10 bg-[#120F17]/80 p-5 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Server className="h-4 w-4 text-amber-400" />
                System-Steuerung & Wartung
              </h3>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white text-xs">Wartungsmodus</div>
                  <div className="text-[11px] text-white/50">
                    Sperrt Neuregistrierungen und Karussell-Rendering temporär
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceMode(!maintenanceMode);
                    toast.info(`Wartungsmodus ${!maintenanceMode ? "AKTIVIERT" : "DEAKTIVIERT"}`);
                  }}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                    maintenanceMode
                      ? "bg-red-500 text-white shadow-[0_0_15px_-2px_#EF4444]"
                      : "bg-white/10 text-white/70 hover:text-white",
                  )}
                >
                  {maintenanceMode ? "Aktiv" : "Inaktiv"}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="font-semibold text-white text-xs mb-1">Lovable Sync Status</div>
                <div className="text-[11px] text-white/50 mb-3">
                  Repository ist live mit GitHub und Lovable Editor verbunden.
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>Branch: origin/main (Forward-Only)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal: Neuer Benutzer ─────────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
            onClick={() => setShowAddUserModal(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#120F17]/95 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <h3 className="text-base font-bold text-white mb-1">Neuen Benutzer manuell anlegen</h3>
            <p className="text-xs text-white/60 mb-4">
              Erstelle ein vorkonfiguriertes Konto mit individuellem Startguthaben.
            </p>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="z.B. Sarah Connor"
                  className="field-input w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">E-Mail</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sarah@agency.com"
                  className="field-input w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Rolle</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="field-input w-full px-3 py-2 text-xs rounded-xl"
                  >
                    <option value="creator">Creator</option>
                    <option value="pro">Pro Creator</option>
                    <option value="admin">Admin</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Start-Credits</label>
                  <input
                    type="number"
                    value={newUserCredits}
                    onChange={(e) => setNewUserCredits(Number(e.target.value))}
                    className="field-input w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/[0.04]"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="cryptox-orange-btn rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Benutzer anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
