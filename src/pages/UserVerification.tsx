import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, FileText,
  Mail, Phone, MapPin, CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard, Toolbar } from '../components/ui/SharedUI';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/StateDisplays';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationUser {
  _id: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  addressConfirmed?: boolean;
  identityVerificationStatus: VerificationStatus;
  identityVerificationNotes?: string;
  identityVerifiedBy?: { displayName: string; email: string } | null;
  identityVerifiedAt?: string | null;
  status: 'active' | 'suspended' | 'locked';
  createdAt: string;
}

interface IdentityDocument {
  _id: string;
  type: string;
  label: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

const STATUS_META: Record<VerificationStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: ReactNode }> = {
  unverified: { label: 'Unverified', variant: 'default', icon: <ShieldQuestion size={22} /> },
  pending:    { label: 'Pending Review', variant: 'warning', icon: <ShieldAlert size={22} /> },
  verified:   { label: 'Verified', variant: 'success', icon: <ShieldCheck size={22} /> },
  rejected:   { label: 'Rejected', variant: 'danger', icon: <ShieldX size={22} /> },
};

export default function UserVerification() {
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending');

  const [selected, setSelected] = useState<VerificationUser | null>(null);
  const [docs, setDocs] = useState<IdentityDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get('/auth/users/verification-queue');
      setUsers(res.data || []);
    } catch {
      setError('Could not load the verification queue.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const counts = useMemo(() => ({
    pending:    users.filter(u => u.identityVerificationStatus === 'pending').length,
    verified:   users.filter(u => u.identityVerificationStatus === 'verified').length,
    unverified: users.filter(u => u.identityVerificationStatus === 'unverified').length,
    rejected:   users.filter(u => u.identityVerificationStatus === 'rejected').length,
  }), [users]);

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.identityVerificationStatus === filter);

  const openReview = async (user: VerificationUser) => {
    setSelected(user);
    setNotes(user.identityVerificationNotes || '');
    setDocs([]);
    setDocsLoading(true);
    try {
      const res = await api.get(`/documents?userId=${user._id}&type=government_id`);
      setDocs(res.data.documents || []);
    } catch {
      setDocs([]);
    } finally { setDocsLoading(false); }
  };

  const decide = async (status: 'verified' | 'rejected') => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/auth/users/${selected._id}/verification`, { status, notes });
      addToast('success', `${selected.displayName} marked as ${status}.`);
      setSelected(null);
      fetchUsers();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not update verification.');
    } finally { setSubmitting(false); }
  };

  const requestResubmission = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.put(`/auth/users/${selected._id}/verification`, { status: 'unverified', notes });
      addToast('success', `Resubmission requested from ${selected.displayName}.`);
      setSelected(null);
      fetchUsers();
    } catch (e: any) {
      addToast('error', e.response?.data?.message || 'Could not request resubmission.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="User Verification"
        description="Review identity, contact, and address details before applicants can submit an adoption application."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<ShieldAlert size={22} />}    label="Pending Review" value={counts.pending.toString()}    tone="amber" />
        <StatCard icon={<ShieldCheck size={22} />}    label="Verified"       value={counts.verified.toString()}   tone="emerald" />
        <StatCard icon={<ShieldQuestion size={22} />} label="Unverified"     value={counts.unverified.toString()} tone="slate" />
        <StatCard icon={<ShieldX size={22} />}        label="Rejected"       value={counts.rejected.toString()}   tone="rose" />
      </div>

      {loading && <LoadingState message="Loading verification queue..." />}
      {error && <ErrorState message={error} onRetry={fetchUsers} />}

      {!loading && !error && (
        <Card noPadding>
          <Toolbar>
            <SectionHeader title="Applicants" description="Unverified users can browse pets but cannot submit adoption applications." />
            <div className="flex gap-2 flex-wrap">
              {(['pending', 'unverified', 'rejected', 'verified', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Toolbar>

          {filteredUsers.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No users in this view" message="Try a different filter, or check back once new applicants sign up." icon={<ShieldQuestion size={28} />} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => {
                    const meta = STATUS_META[u.identityVerificationStatus] || STATUS_META.unverified;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{u.displayName}</p>
                          <p className="text-xs text-slate-400">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{u.email}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5"><Phone size={12} />{u.phone || 'No phone on file'}</p>
                        </td>
                        <td className="px-5 py-4">
                          {u.status === 'active'
                            ? <Badge variant="success">Active</Badge>
                            : <Badge variant="danger" className="capitalize">{u.status}</Badge>}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openReview(u)}
                            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">{selected.displayName}</h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
              </div>
              <Badge variant={STATUS_META[selected.identityVerificationStatus].variant}>
                {STATUS_META[selected.identityVerificationStatus].label}
              </Badge>
            </div>

            {/* Verification checklist */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold ${selected.emailVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {selected.emailVerified ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Email verified
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold ${selected.phoneVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {selected.phoneVerified ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Phone verified
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold ${selected.addressConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {selected.addressConfirmed ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Address confirmed
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold ${selected.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                {selected.status === 'active' ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Account active
              </div>
            </div>

            <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-600 flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{selected.address || 'No address on file yet.'}</span>
            </div>

            {/* Uploaded government ID */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Government ID</p>
              {docsLoading ? (
                <p className="text-xs text-slate-400">Loading documents…</p>
              ) : docs.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                  No ID uploaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map(d => (
                    <a
                      key={d._id}
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        <FileText size={16} className="text-slate-400" /> {d.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant={d.status === 'verified' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'}>{d.status}</Badge>
                        <ExternalLink size={14} className="text-slate-400" />
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Reason for approval / rejection, or what's needed to resubmit…"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => decide('verified')}
                disabled={submitting}
                className="bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={requestResubmission}
                disabled={submitting}
                className="bg-amber-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Request Resubmit
              </button>
              <button
                onClick={() => decide('rejected')}
                disabled={submitting}
                className="bg-rose-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-full border border-slate-200 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
