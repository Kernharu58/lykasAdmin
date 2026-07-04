import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  Key,
  UserCheck,
  Mail,
} from "lucide-react";
import api from "../services/api";
import { sendUserPasswordReset } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ui/ConfirmModal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StateDisplays";
import {
  Badge,
  Card,
  PageHeader,
  SectionHeader,
  StatCard,
  Toolbar,
} from "../components/ui/SharedUI";

type StaffRole = "staff" | "admin" | "super_admin";
type UserStatus = "active" | "suspended" | "locked";
type ActionType =
  | "delete"
  | "lock"
  | "suspend"
  | "activate"
  | "role"
  | "reset-password";

interface StaffUser {
  _id: string;
  displayName: string;
  email: string;
  role: StaffRole | "user";
  status?: UserStatus;
  profilePicture?: string;
  createdAt?: string;
  volunteerHours?: number;
}

interface ConfirmState {
  isOpen: boolean;
  action: ActionType | "";
  user: StaffUser | null;
  nextRole?: StaffRole;
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

function statusVariant(status?: UserStatus): "success" | "warning" | "danger" {
  if (status === "locked") return "danger";
  if (status === "suspended") return "warning";
  return "success";
}

function roleVariant(role: string): "info" | "warning" | "danger" | "default" {
  if (role === "super_admin") return "danger";
  if (role === "admin") return "warning";
  return "info";
}

export default function StaffManagement() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    action: "",
    user: null,
  });

  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/auth/users");
      const allUsers: StaffUser[] = res.data.users || res.data || [];
      const staffOnly = allUsers.filter(
        (u) =>
          u.role === "staff" || u.role === "admin" || u.role === "super_admin",
      );
      setUsers(staffOnly);
    } catch (e: any) {
      setError("Could not load staff accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin" || u.role === "super_admin")
      .length,
    staff: users.filter((u) => u.role === "staff").length,
    active: users.filter((u) => !u.status || u.status === "active").length,
  };

  const handleExecuteAction = async () => {
    const { action, user, nextRole } = confirmState;
    if (!user || !action) return;
    setIsSubmitting(true);
    try {
      if (action === "delete") {
        await api.delete(`/auth/users/${user._id}`);
        addToast("success", `${user.displayName} deleted.`);
        setSelected(null);
        await fetchStaff();
      } else if (action === "lock") {
        await api.put(`/auth/users/${user._id}/status`, { status: "locked" });
        addToast("success", `${user.displayName} locked.`);
        await fetchStaff();
      } else if (action === "suspend") {
        await api.put(`/auth/users/${user._id}/status`, {
          status: "suspended",
        });
        addToast("success", `${user.displayName} suspended.`);
        await fetchStaff();
      } else if (action === "activate") {
        await api.put(`/auth/users/${user._id}/status`, { status: "active" });
        addToast("success", `${user.displayName} reactivated.`);
        await fetchStaff();
      } else if (action === "role" && nextRole) {
        await api.put(`/auth/users/${user._id}/role`, { role: nextRole });
        addToast("success", `Role updated to ${nextRole.replace("_", " ")}.`);
        await fetchStaff();
      } else if (action === "reset-password") {
        await sendUserPasswordReset(user._id);
        addToast("success", `Password reset email sent to ${user.email}.`);
      }
    } catch (e: any) {
      addToast(
        "error",
        e.response?.data?.message || "Action failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
      setConfirmState({ isOpen: false, action: "", user: null });
    }
  };

  const confirmCopy = useMemo(() => {
    const { action, user, nextRole } = confirmState;
    if (!user || !action)
      return { title: "", message: "", confirmText: "", isDestructive: false };
    const name = user.displayName || user.email;
    switch (action) {
      case "delete":
        return {
          title: `Delete ${name}?`,
          message: "This permanently removes the account.",
          confirmText: "Delete",
          isDestructive: true,
        };
      case "lock":
        return {
          title: `Lock ${name}?`,
          message: "They will lose access immediately.",
          confirmText: "Lock Account",
          isDestructive: true,
        };
      case "suspend":
        return {
          title: `Suspend ${name}?`,
          message: "They will be blocked until reactivated.",
          confirmText: "Suspend",
          isDestructive: true,
        };
      case "activate":
        return {
          title: `Reactivate ${name}?`,
          message: "This restores their normal access.",
          confirmText: "Reactivate",
          isDestructive: false,
        };
      case "reset-password":
        return {
          title: `Send reset to ${name}?`,
          message: "A password reset email will be sent.",
          confirmText: "Send Reset Email",
          isDestructive: false,
        };
      case "role":
        return {
          title: `Change ${name} to ${nextRole?.replace("_", " ")}?`,
          message: "Role changes take effect immediately.",
          confirmText: "Save Role",
          isDestructive: nextRole === "super_admin",
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "",
          isDestructive: false,
        };
    }
  }, [confirmState]);

  const isSelf = (u: StaffUser) => u._id === currentUser?._id;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Staff Management"
        description="View and manage shelter staff, admin accounts, roles, and access status."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users size={24} />}
          label="Total Staff"
          value={stats.total.toString()}
          tone="emerald"
        />
        <StatCard
          icon={<ShieldCheck size={24} />}
          label="Admins"
          value={stats.admins.toString()}
          tone="amber"
        />
        <StatCard
          icon={<UserCheck size={24} />}
          label="Staff Members"
          value={stats.staff.toString()}
          tone="blue"
        />
        <StatCard
          icon={<UserCog size={24} />}
          label="Active"
          value={stats.active.toString()}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        {/* Left: List */}
        <Card noPadding>
          <Toolbar>
            <SectionHeader
              title="Staff Directory"
              description="Showing shelter staff and admin accounts only."
            />
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as StaffRole | "all")
                }
                className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Roles</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                onClick={fetchStaff}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </Toolbar>

          {loading ? (
            <LoadingState message="Loading staff accounts..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchStaff} />
          ) : filtered.length === 0 ? (
            <EmptyState message="No staff accounts match your filter." />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setSelected(u)}
                  className={`w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${selected?._id === u._id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.profilePicture ? (
                      <img
                        src={u.profilePicture}
                        alt={u.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-emerald-700 font-bold text-sm">
                        {u.displayName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {u.displayName}
                      </span>
                      {isSelf(u) && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={roleVariant(u.role)}>
                      {u.role?.replace("_", " ")}
                    </Badge>
                    <Badge variant={statusVariant(u.status)}>
                      {u.status || "active"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Detail panel */}
        <div>
          {selected ? (
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {selected.profilePicture ? (
                    <img
                      src={selected.profilePicture}
                      alt={selected.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-700 font-bold text-xl">
                      {selected.displayName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                    {selected.displayName}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {selected.email}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant={roleVariant(selected.role)}>
                      {selected.role?.replace("_", " ")}
                    </Badge>
                    <Badge variant={statusVariant(selected.status)}>
                      {selected.status || "active"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{selected.email}</span>
                </div>
                {selected.createdAt && (
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-slate-400 shrink-0" />
                    <span>
                      Joined {new Date(selected.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {(selected.volunteerHours ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={14}
                      className="text-slate-400 shrink-0"
                    />
                    <span>{selected.volunteerHours} volunteer hours</span>
                  </div>
                )}
              </div>

              {/* Change Role */}
              {!isSelf(selected) && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Change Role
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setConfirmState({
                            isOpen: true,
                            action: "role",
                            user: selected,
                            nextRole: opt.value,
                          });
                        }}
                        disabled={selected.role === opt.value}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${selected.role === opt.value ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Actions */}
              {!isSelf(selected) && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Access Control
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {(selected.status === "locked" ||
                      selected.status === "suspended") && (
                      <button
                        onClick={() =>
                          setConfirmState({
                            isOpen: true,
                            action: "activate",
                            user: selected,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        Reactivate
                      </button>
                    )}
                    {selected.status !== "suspended" && (
                      <button
                        onClick={() =>
                          setConfirmState({
                            isOpen: true,
                            action: "suspend",
                            user: selected,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    {selected.status !== "locked" && (
                      <button
                        onClick={() =>
                          setConfirmState({
                            isOpen: true,
                            action: "lock",
                            user: selected,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        Lock
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmState({
                          isOpen: true,
                          action: "reset-password",
                          user: selected,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Key size={12} /> Reset Password
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {!isSelf(selected) && currentUser?.role === "super_admin" && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">
                    Danger Zone
                  </p>
                  <button
                    onClick={() =>
                      setConfirmState({
                        isOpen: true,
                        action: "delete",
                        user: selected,
                      })
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={13} /> Delete Account
                  </button>
                </div>
              )}

              {isSelf(selected) && (
                <p className="text-xs text-slate-400 italic mt-2">
                  You cannot modify your own account from here.
                </p>
              )}
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <UserCog size={40} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">
                Select a staff member
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Click any row to manage their role and access.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmText={isSubmitting ? "Working…" : confirmCopy.confirmText}
        isDestructive={confirmCopy.isDestructive}
        onConfirm={handleExecuteAction}
        onCancel={() =>
          !isSubmitting &&
          setConfirmState({ isOpen: false, action: "", user: null })
        }
      />
    </div>
  );
}
