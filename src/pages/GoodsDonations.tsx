/**
 * GoodsDonations.tsx — Admin page for managing physical goods donations
 * ────────────────────────────────────────────────────────────────────────
 * 1. Copy this file to:  lykasServer/src/pages/GoodsDonations.tsx
 *
 * 2. Add import + route in lykasServer/src/App.tsx:
 *      import GoodsDonations from './pages/GoodsDonations';
 *      // inside <Routes>:
 *      <Route path="/goods-donations" element={<GoodsDonations />} />
 *
 * 3. Add nav item in lykasServer/src/components/layout/Sidebar.tsx:
 *      { name: 'Goods Donations', path: '/goods-donations', icon: <Package size={20} />, section: 'Finance' }
 *    (import Package from 'lucide-react')
 * ────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Search,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import api from "../services/api";
import {
  ErrorState,
  LoadingState,
  EmptyState,
} from "../components/ui/StateDisplays";
import {
  Badge,
  Card,
  PageHeader,
  StatCard,
  Toolbar,
} from "../components/ui/SharedUI";
import { useToast } from "../context/ToastContext";

// ─── Types ────────────────────────────────────────────────────
interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
}

interface GoodsDonation {
  _id: string;
  donatedBy: {
    _id: string;
    displayName: string;
    email: string;
  };
  items: DonationItem[];
  dropOff: "walk_in" | "schedule" | "courier";
  notes: string;
  status: "pending" | "confirmed" | "received" | "cancelled";
  staffNote: string;
  receivedAt: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "confirmed" | "received" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────
function statusVariant(
  s: string,
): "success" | "warning" | "danger" | "info" | "default" {
  if (s === "received") return "success";
  if (s === "confirmed") return "info";
  if (s === "pending") return "warning";
  if (s === "cancelled") return "danger";
  return "default";
}

function dropOffLabel(d: string) {
  if (d === "walk_in") return "Walk-in";
  if (d === "schedule") return "Pickup";
  if (d === "courier") return "Courier";
  return d;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Status Update Modal ──────────────────────────────────────
function StatusModal({
  donation,
  onClose,
  onUpdated,
}: {
  donation: GoodsDonation;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [newStatus, setNewStatus] = useState<
    "confirmed" | "received" | "cancelled"
  >("confirmed");
  const [staffNote, setStaffNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.patch(`/donations/goods/${donation._id}/status`, {
        status: newStatus,
        staffNote,
      });
      addToast("success", "Status updated successfully");
      onUpdated();
      onClose();
    } catch (e: any) {
      addToast(
        e?.response?.data?.message || "Could not update status",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Update Donation Status
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Donor info */}
        <div className="px-6 pt-4 pb-3 bg-slate-50/60 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">
            {donation.donatedBy?.displayName}
          </p>
          <p className="text-xs text-slate-500">{donation.donatedBy?.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {donation.items.map((item, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold"
              >
                {item.quantity} {item.unit} {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Status select */}
        <div className="px-6 pt-5 pb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            New Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "confirmed", label: "Confirmed", color: "blue" },
                { value: "received", label: "Received", color: "emerald" },
                { value: "cancelled", label: "Cancelled", color: "rose" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setNewStatus(opt.value)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  newStatus === opt.value
                    ? opt.color === "blue"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : opt.color === "emerald"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="block text-sm font-bold text-slate-700 mb-2 mt-4">
            Staff Note{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={staffNote}
            onChange={(e) => setStaffNote(e.target.value)}
            rows={3}
            placeholder="Add a note for the donor or internal records…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────
function DetailDrawer({
  donation,
  onClose,
  onUpdateClick,
}: {
  donation: GoodsDonation;
  onClose: () => void;
  onUpdateClick: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-800">
            Goods Donation Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={statusVariant(donation.status)}>
              {donation.status.charAt(0).toUpperCase() +
                donation.status.slice(1)}
            </Badge>
            <span className="text-xs text-slate-400">
              {formatDate(donation.createdAt)}
            </span>
          </div>

          {/* Donor */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Donor
            </p>
            <p className="font-semibold text-slate-800">
              {donation.donatedBy?.displayName}
            </p>
            <p className="text-sm text-slate-500">
              {donation.donatedBy?.email}
            </p>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Donated Items
            </p>
            <div className="space-y-2">
              {donation.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {item.name}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drop-off */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Drop-off Method
            </p>
            <p className="text-sm text-slate-700 font-semibold">
              {dropOffLabel(donation.dropOff)}
            </p>
          </div>

          {/* Notes */}
          {donation.notes && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Donor Notes
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {donation.notes}
              </p>
            </div>
          )}

          {/* Staff note */}
          {donation.staffNote && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Staff Note
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {donation.staffNote}
              </p>
            </div>
          )}

          {/* Received at */}
          {donation.receivedAt && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Received At
              </p>
              <p className="text-sm text-slate-700">
                {formatDate(donation.receivedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {donation.status !== "received" && donation.status !== "cancelled" && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-white">
            <button
              onClick={onUpdateClick}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              Update Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function GoodsDonations() {
  const [donations, setDonations] = useState<GoodsDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<GoodsDonation | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDonations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url =
        statusFilter !== "all"
          ? `/donations/goods?status=${statusFilter}`
          : "/donations/goods";
      const res = await api.get(url);
      setDonations(res.data.donations || []);
    } catch {
      setError("Could not load goods donations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [statusFilter]);

  // Stats
  const total = donations.length;
  const pending = donations.filter((d) => d.status === "pending").length;
  const confirmed = donations.filter((d) => d.status === "confirmed").length;
  const received = donations.filter((d) => d.status === "received").length;

  // Filter by search
  const filtered = donations.filter((d) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      d.donatedBy?.displayName?.toLowerCase().includes(q) ||
      d.donatedBy?.email?.toLowerCase().includes(q) ||
      d.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "received", label: "Received" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Goods Donations"
        description="Track and manage physical items pledged by donors"
        action={
          <button
            onClick={fetchDonations}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-colors"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Package size={22} />}
          label="Total Pledges"
          value={total}
          tone="emerald"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Pending"
          value={pending}
          tone="amber"
        />
        <StatCard
          icon={<Truck size={22} />}
          label="Confirmed"
          value={confirmed}
          tone="blue"
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Received"
          value={received}
          tone="emerald"
        />
      </div>

      {/* Table card */}
      <Card noPadding>
        {/* Status tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                statusFilter === tab.value
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.value === "pending" && pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                  {pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <Toolbar>
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by donor or item…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </Toolbar>

        {/* Content */}
        {isLoading ? (
          <LoadingState message="Loading goods donations…" />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDonations} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No donations found"
            message="Try adjusting your search or filter."
            icon={<Package size={28} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Drop-off
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((d) => (
                  <tr
                    key={d._id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {d.donatedBy?.displayName || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {d.donatedBy?.email || ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {d.items.slice(0, 2).map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100"
                          >
                            {item.quantity}× {item.name}
                          </span>
                        ))}
                        {d.items.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold">
                            +{d.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {dropOffLabel(d.dropOff)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant(d.status)}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(d)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
          <span>
            Showing {filtered.length} of {donations.length} donations
          </span>
        </div>
      </Card>

      {/* Detail drawer */}
      {selected && !showModal && (
        <DetailDrawer
          donation={selected}
          onClose={() => setSelected(null)}
          onUpdateClick={() => setShowModal(true)}
        />
      )}

      {/* Status update modal */}
      {selected && showModal && (
        <StatusModal
          donation={selected}
          onClose={() => setShowModal(false)}
          onUpdated={() => {
            setShowModal(false);
            setSelected(null);
            fetchDonations();
          }}
        />
      )}
    </div>
  );
}
