import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Users,
  XCircle,
  Search,
  ChevronRight,
  ClockIcon,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  Badge,
  Card,
  PageHeader,
  SectionHeader,
  StatCard,
  Toolbar,
} from "../components/ui/SharedUI";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StateDisplays";

type VolStatus = "all" | "pending" | "approved" | "rejected" | "inactive";

interface Volunteer {
  _id: string;
  user: {
    _id: string;
    displayName: string;
    email: string;
    profilePicture?: string;
    volunteerHours?: number;
  };
  phone?: string;
  address?: string;
  motivation?: string;
  availability?: string[];
  skills?: string[];
  status: "pending" | "approved" | "rejected" | "inactive";
  totalHours: number;
  notes?: string;
  reviewedAt?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  createdAt: string;
}

const STATUS_TABS: { label: string; value: VolStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Inactive", value: "inactive" },
  { label: "All", value: "all" },
];

function statusVariant(
  s: string,
): "success" | "warning" | "danger" | "default" {
  if (s === "approved") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "danger";
  return "default";
}

export default function Volunteer() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VolStatus>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Volunteer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [hoursInput, setHoursInput] = useState("");
  const [hoursNote, setHoursNote] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { addToast } = useToast();

  const fetchVolunteers = async (status: VolStatus = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      const params =
        status !== "all" ? `?status=${status}&limit=100` : "?limit=100";
      const res = await api.get(`/volunteers${params}`);
      setVolunteers(res.data.volunteers || res.data || []);
    } catch (e: any) {
      setError("Could not load volunteer applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: VolStatus) => {
    setActiveTab(tab);
    setSelected(null);
  };

  const handleUpdateStatus = async (
    vol: Volunteer,
    status: "approved" | "rejected",
  ) => {
    setSubmitting(true);
    try {
      await api.put(`/volunteers/${vol._id}/status`, {
        status,
        notes: adminNotes,
      });
      addToast("success", `${vol.user.displayName} ${status}.`);
      setSelected(null);
      setAdminNotes("");
      fetchVolunteers(activeTab);
    } catch (e: any) {
      addToast(
        "error",
        e.response?.data?.message || "Could not update status.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogHours = async () => {
    if (!selected) return;
    const hrs = parseFloat(hoursInput);
    if (!hrs || hrs <= 0) {
      addToast("error", "Please enter a valid number of hours.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/volunteers/${selected._id}/hours`, {
        hours: hrs,
        note: hoursNote,
      });
      addToast(
        "success",
        `${hrs} hour(s) logged for ${selected.user.displayName}.`,
      );
      setShowHours(false);
      setHoursInput("");
      setHoursNote("");
      fetchVolunteers(activeTab);
    } catch (e: any) {
      addToast("error", e.response?.data?.message || "Could not log hours.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = volunteers.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.user?.displayName || "").toLowerCase().includes(q) ||
      (v.user?.email || "").toLowerCase().includes(q) ||
      (v.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const totalApproved = volunteers.filter(
    (v) => v.status === "approved",
  ).length;
  const totalPending = volunteers.filter((v) => v.status === "pending").length;
  const totalHours = volunteers.reduce(
    (acc, v) => acc + (v.totalHours || 0),
    0,
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Volunteers"
        description="Review applications, approve volunteers, and track service hours."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users size={24} />}
          label="Total"
          value={volunteers.length.toString()}
          tone="emerald"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Pending"
          value={totalPending.toString()}
          tone="amber"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Approved"
          value={totalApproved.toString()}
          tone="blue"
        />
        <StatCard
          icon={<Star size={24} />}
          label="Total Hours"
          value={totalHours.toString()}
          tone="purple"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left list */}
        <Card noPadding>
          <Toolbar>
            <SectionHeader
              title="Applications"
              description={`${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            />
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search name, email, skill…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </Toolbar>

          {loading ? (
            <LoadingState message="Loading volunteers…" />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={() => fetchVolunteers(activeTab)}
            />
          ) : filtered.length === 0 ? (
            <EmptyState message="No volunteer applications in this category." />
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((vol) => (
                <button
                  key={vol._id}
                  onClick={() => setSelected(vol)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${selected?._id === vol._id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                    {vol.user?.profilePicture ? (
                      <img
                        src={vol.user.profilePicture}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-emerald-700 font-bold text-sm">
                        {vol.user?.displayName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">
                      {vol.user?.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {vol.user?.email}
                    </p>
                    {(vol.skills || []).length > 0 && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {vol.skills!.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(vol.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={statusVariant(vol.status)}>
                      {vol.status}
                    </Badge>
                    {vol.totalHours > 0 && (
                      <span className="text-xs text-slate-500">
                        {vol.totalHours}h
                      </span>
                    )}
                    <ChevronRight size={16} className="text-slate-300 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right detail */}
        <div>
          {selected ? (
            <Card>
              {/* Header */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {selected.user?.profilePicture ? (
                    <img
                      src={selected.user.profilePicture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-700 font-bold text-xl">
                      {selected.user?.displayName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">
                    {selected.user?.displayName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selected.user?.email}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <Badge variant={statusVariant(selected.status)}>
                      {selected.status}
                    </Badge>
                    {selected.totalHours > 0 && (
                      <Badge variant="info">
                        {selected.totalHours}h logged
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm mb-5">
                {selected.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    {selected.phone}
                  </div>
                )}
                {selected.address && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin
                      size={14}
                      className="text-slate-400 shrink-0 mt-0.5"
                    />
                    {selected.address}
                  </div>
                )}
                {(selected.availability || []).length > 0 && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <ClockIcon
                      size={14}
                      className="text-slate-400 shrink-0 mt-0.5"
                    />
                    <span>{selected.availability!.join(", ")}</span>
                  </div>
                )}
              </div>

              {(selected.skills || []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills!.map((s) => (
                      <Badge key={s} variant="info">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selected.motivation && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Motivation
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                    {selected.motivation}
                  </p>
                </div>
              )}

              {selected.emergencyContact?.name && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Emergency Contact
                  </p>
                  <p className="text-sm text-slate-600">
                    {selected.emergencyContact.name} (
                    {selected.emergencyContact.relationship}) —{" "}
                    {selected.emergencyContact.phone}
                  </p>
                </div>
              )}

              {selected.notes && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Admin Notes
                  </p>
                  <p className="text-sm text-slate-600 italic">
                    {selected.notes}
                  </p>
                </div>
              )}

              {/* Admin Notes input for approve/reject */}
              {selected.status === "pending" && (
                <div className="mb-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Add a note for this decision…"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {selected.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selected, "approved")}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selected, "rejected")}
                      disabled={submitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}

                {selected.status === "approved" && (
                  <>
                    {!showHours ? (
                      <button
                        onClick={() => setShowHours(true)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Star size={16} /> Log Hours
                      </button>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-bold text-slate-700">
                          Log Volunteer Hours
                        </p>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={hoursInput}
                          onChange={(e) => setHoursInput(e.target.value)}
                          placeholder="Hours (e.g. 3)"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={hoursNote}
                          onChange={(e) => setHoursNote(e.target.value)}
                          placeholder="Note (e.g. Morning dog walk)"
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleLogHours}
                            disabled={submitting}
                            className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {submitting ? "Saving…" : "Save Hours"}
                          </button>
                          <button
                            onClick={() => {
                              setShowHours(false);
                              setHoursInput("");
                              setHoursNote("");
                            }}
                            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(selected, "rejected")}
                      disabled={submitting}
                      className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors"
                    >
                      Deactivate Volunteer
                    </button>
                  </>
                )}

                {(selected.status === "rejected" ||
                  selected.status === "inactive") && (
                  <button
                    onClick={() => handleUpdateStatus(selected, "approved")}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 size={16} /> Re-approve Volunteer
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">Select a volunteer</p>
              <p className="text-sm text-slate-400 mt-1">
                Click any row to review details and take action.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
