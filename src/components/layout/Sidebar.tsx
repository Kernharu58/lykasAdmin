import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  PawPrint,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
  HeartHandshake,
  ClipboardList,
  Shield,
  X,
  AlertTriangle,
  Activity,
  UserCheck,
  HeartPulse,
  BarChart3,
  HandHeart,
  UsersRound,
  Bell,
  Monitor,
  Images,
  UserCog,
  Handshake,
  Package,
  CalendarClock,
  Wallet,
  ShieldCheck,
  Siren,
  FileText,
  LineChart,
  BookOpen,
  Building2,
  Boxes,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isImpersonating, stopImpersonation } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login");
  };

  const navItems = [
    // ── Main ──────────────────────────────────────────────────────────────────
    { name: "Dashboard", path: "/", icon: <Home size={20} />, section: "Main" },
    {
      name: "Pets",
      path: "/pets",
      icon: <PawPrint size={20} />,
      section: "Main",
    },
    {
      name: "Gallery",
      path: "/gallery",
      icon: <Images size={20} />,
      section: "Main",
    },
    {
      name: "Adoptions",
      path: "/adoptions",
      icon: <ClipboardList size={20} />,
      section: "Main",
    },
    {
      name: "Fostering",
      path: "/fosters",
      icon: <HandHeart size={20} />,
      section: "Main",
    },
    {
      name: "Adopters & Risk",
      path: "/adopters",
      icon: <UserCheck size={20} />,
      section: "Main",
    },
    {
      name: "Adoption Scheduling",
      path: "/adoption-scheduling",
      icon: <CalendarClock size={20} />,
      section: "Main",
    },
    {
      name: "Risk Assessments",
      path: "/risk-assessments",
      icon: <ShieldAlert size={20} />,
      section: "Main",
    },
    {
      name: "User Verification",
      path: "/verification",
      icon: <ShieldCheck size={20} />,
      section: "Main",
    },
    {
      name: "Document Review",
      path: "/documents",
      icon: <FileText size={20} />,
      section: "Main",
    },

    // ── Operations ────────────────────────────────────────────────────────────
    {
      name: "Shifts",
      path: "/shifts",
      icon: <UsersRound size={20} />,
      section: "Operations",
    },
    {
      name: "Volunteers",
      path: "/volunteers",
      icon: <Handshake size={20} />,
      section: "Operations",
    },
    {
      name: "Events",
      path: "/events",
      icon: <CalendarDays size={20} />,
      section: "Operations",
    },
    {
      name: "Emergency Reports",
      path: "/emergency-reports",
      icon: <Siren size={20} />,
      section: "Operations",
    },
    {
      name: "Shelter Management",
      path: "/shelters",
      icon: <Building2 size={20} />,
      section: "Operations",
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: <Boxes size={20} />,
      section: "Operations",
    },

    // ── Finance ───────────────────────────────────────────────────────────────
    {
      name: "Donations",
      path: "/donations",
      icon: <HeartHandshake size={20} />,
      section: "Finance",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Goods Donations",
      path: "/goods-donations",
      icon: <Package size={20} />,
      section: "Finance",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Payments",
      path: "/payments",
      icon: <Wallet size={20} />,
      section: "Finance",
      roles: ["admin", "super_admin"],
    },

    // ── Insights ──────────────────────────────────────────────────────────────
    {
      name: "Health",
      path: "/health",
      icon: <HeartPulse size={20} />,
      section: "Insights",
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <LineChart size={20} />,
      section: "Insights",
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart3 size={20} />,
      section: "Insights",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Monitoring",
      path: "/monitoring",
      icon: <Monitor size={20} />,
      section: "Insights",
    },

    // ── Comms ─────────────────────────────────────────────────────────────────
    {
      name: "Notifications",
      path: "/notifications",
      icon: <Bell size={20} />,
      section: "Comms",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Live Chat",
      path: "/chat",
      icon: <MessageSquare size={20} />,
      section: "Comms",
    },
    {
      name: "Feedback & Reviews",
      path: "/feedback",
      icon: <MessageSquareText size={20} />,
      section: "Comms",
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
      section: "Admin",
    },
    {
      name: "Content Management",
      path: "/content",
      icon: <BookOpen size={20} />,
      section: "Admin",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Staff",
      path: "/staff",
      icon: <UserCog size={20} />,
      section: "Admin",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Accounts",
      path: "/accounts",
      icon: <Shield size={20} />,
      section: "Admin",
      roles: ["admin", "super_admin"],
    },
    {
      name: "Audit Logs",
      path: "/audit-logs",
      icon: <Activity size={20} />,
      section: "Admin",
      roles: ["super_admin"],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(user?.role || "")) return false;
    return true;
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} shadow-2xl lg:shadow-none border-r border-slate-800`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PawPrint size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-white tracking-tight">
                CarePaws
              </h1>
              <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.role === "admin"
                    ? "Admin Portal"
                    : "Staff Portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 shrink-0">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">Impersonating Mode</span>
            </div>
            <p className="text-xs text-amber-200 mb-3 truncate">
              User: {user?.displayName}
            </p>
            <button
              onClick={stopImpersonation}
              className="w-full py-2 bg-amber-500 text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Stop Impersonating
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-5 px-4 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item, index) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");

            const showSection =
              index === 0 ||
              filteredNavItems[index - 1].section !== item.section;

            return (
              <div key={item.name}>
                {showSection && (
                  <p className="px-4 pb-2 pt-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 first:pt-0">
                    {item.section}
                  </p>
                )}
                <Link
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 font-semibold shadow-inner"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`mr-3 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/30">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center justify-center px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl w-full transition-colors font-medium text-sm"
          >
            <LogOut size={18} className="mr-2" /> Sign Out
          </button>
        </div>
      </div>

      {/* Logout confirm modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <LogOut className="text-rose-600 w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sign Out</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm ml-1">
              Are you sure you want to securely sign out of the admin session?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
