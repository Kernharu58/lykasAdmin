import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, MessageSquare, User as UserIcon, XCircle, Clock, Filter } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateDisplays';
import { Badge, Card, PageHeader, SectionHeader } from '../components/ui/SharedUI';
import { useToast } from '../context/ToastContext';

type AppStatus = 'pending' | 'approved' | 'rejected';

interface AdoptionRequest {
  _id: string;
  phone: string;
  address: string;
  experience: string;
  status: AppStatus;
  reviewedAt?: string;
  applicant?: {
    _id?: string;
    displayName?: string;
    email?: string;
    profilePicture?: string;
  } | null;
  pet?: {
    _id?: string;
    name?: string;
    breed?: string;
    age?: number | string;
    imageUrl?: string;
  } | null;
}

// FIX (Critical #3): Show all statuses with a filter tab, not just pending
const STATUS_TABS: { label: string; value: AppStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

function statusVariant(status: AppStatus): 'success' | 'warning' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
}

export default function Adoptions() {
  const [applications, setApplications] = useState<AdoptionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<AppStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | '';
    applicationId: string;
    petName: string;
    userName: string;
  }>({
    isOpen: false,
    type: '',
    applicationId: '',
    petName: '',
    userName: '',
  });

  const navigate = useNavigate();
  const { addToast } = useToast();

  const resetConfirmAction = () => {
    setConfirmAction({ isOpen: false, type: '', applicationId: '', petName: '', userName: '' });
  };

  const fetchApplications = async (status: AppStatus | 'all' = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      // FIX (Critical #3): Fetch based on selected tab, no longer hardcoded to pending
      const url = status === 'all' ? '/applications' : `/applications?status=${status}`;
      const response = await api.get(url);
      setApplications(response.data.applications || response.data);
    } catch (fetchError) {
      console.error('Error fetching adoptions:', fetchError);
      setError('Unable to load adoption applications right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(activeTab);
  }, [activeTab]);

  const executeAction = async () => {
    try {
      if (confirmAction.type === 'approve') {
        await api.put(`/applications/${confirmAction.applicationId}/status`, { status: 'approved' });
        addToast('success', `${confirmAction.userName || 'The applicant'} was approved for ${confirmAction.petName}.`);
      } else if (confirmAction.type === 'reject') {
        await api.put(`/applications/${confirmAction.applicationId}/status`, { status: 'rejected' });
        addToast('warning', `Application for ${confirmAction.petName} was rejected.`);
      }
      fetchApplications(activeTab);
    } catch (actionError) {
      console.error(`Error trying to ${confirmAction.type} adoption:`, actionError);
      addToast('error', `Failed to ${confirmAction.type || 'update'} the adoption request.`);
    } finally {
      resetConfirmAction();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Adoption Applications"
        description="Review requests, coordinate with applicants, and make safe adoption decisions."
      />

      <Card noPadding>
        {/* FIX (Critical #3): Status filter tabs */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center gap-4">
          <SectionHeader
            title="Applications"
            description="Filter by status to review current and historical records."
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter size={13} className="inline mr-1.5 -mt-0.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <ErrorState message={error} onRetry={() => fetchApplications(activeTab)} />
          ) : loading ? (
            <LoadingState message="Loading adoption applications..." />
          ) : applications.length === 0 ? (
            <EmptyState
              title={`No ${activeTab === 'all' ? '' : activeTab} applications`}
              message={
                activeTab === 'pending'
                  ? 'New adoption requests will appear here when users apply through the mobile app.'
                  : `No ${activeTab} applications found.`
              }
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {applications.map((application) => (
                <div key={application._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex flex-col md:flex-row p-5 gap-6 border-b border-slate-100 flex-1">
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applicant Details</h3>
                        {/* FIX (Critical #4): Show rejection/approval status badge so it's not invisible */}
                        <Badge variant={statusVariant(application.status)}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200 flex-shrink-0">
                          {application.applicant?.profilePicture ? (
                            <img src={application.applicant.profilePicture} alt="Adopter" className="w-full h-full object-cover" />
                          ) : (
                            application.applicant?.displayName ? application.applicant.displayName.charAt(0).toUpperCase() : <UserIcon size={24} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{application.applicant?.displayName || 'Unknown User'}</h4>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Mail size={14} /> {application.applicant?.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p><span className="font-bold text-slate-700">Phone:</span> {application.phone}</p>
                        <p><span className="font-bold text-slate-700">Address:</span> {application.address}</p>
                        <p><span className="font-bold text-slate-700">Experience:</span> {application.experience}</p>
                        {application.reviewedAt && (
                          <p className="flex items-center gap-1 text-slate-400">
                            <Clock size={12} />
                            Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {application.applicant?._id && (
                        <button
                          onClick={() => navigate('/chat', { state: { selectedUserId: application.applicant?._id } })}
                          className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare size={18} />
                          Message Applicant
                        </button>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pet Requested</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                          {application.pet?.imageUrl ? (
                            <img src={application.pet.imageUrl} alt={application.pet.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{application.pet?.name || 'Unknown Pet'}</h4>
                          <p className="text-sm text-slate-500 mt-1">
                            {application.pet?.breed || 'Unknown breed'} - {application.pet?.age || '?'} Years
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FIX (Critical #4): Only show action buttons for pending applications */}
                  {application.status === 'pending' && (
                    <div className="p-4 bg-slate-50/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                      <button
                        onClick={() =>
                          setConfirmAction({
                            isOpen: true,
                            type: 'reject',
                            applicationId: application._id,
                            petName: application.pet?.name || 'this pet',
                            userName: application.applicant?.displayName || 'the applicant',
                          })
                        }
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-colors shadow-sm"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          setConfirmAction({
                            isOpen: true,
                            type: 'approve',
                            applicationId: application._id,
                            petName: application.pet?.name || 'this pet',
                            userName: application.applicant?.displayName || 'the applicant',
                          })
                        }
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <CheckCircle size={18} />
                        Approve Application
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        title={confirmAction.type === 'approve' ? 'Approve Adoption' : 'Reject Adoption'}
        message={
          confirmAction.type === 'approve'
            ? `Approve ${confirmAction.userName} to adopt ${confirmAction.petName}? This will mark the application as approved and the pet as adopted.`
            : `Reject the request for ${confirmAction.petName}? The applicant will be notified.`
        }
        confirmText={confirmAction.type === 'approve' ? 'Approve Request' : 'Reject Request'}
        isDestructive={confirmAction.type !== 'approve'}
        onConfirm={executeAction}
        onCancel={resetConfirmAction}
      />
    </div>
  );
}
