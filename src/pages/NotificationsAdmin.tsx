import { Bell, Send, Users, Clock, CheckCircle2, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Card, PageHeader, SectionHeader, StatCard, Badge } from '../components/ui/SharedUI';
import { useToast } from '../context/ToastContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'adoption' | 'health' | 'volunteer' | 'foster';
  recipients: number;
  sentAt: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  deliveryRate?: number;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Vaccination Reminder',
    message: 'Emma\'s rabies booster is due on June 15',
    category: 'health',
    recipients: 1,
    sentAt: '2 hours ago',
    status: 'sent',
    deliveryRate: 100,
  },
  {
    id: '2',
    title: 'Adoption Application Update',
    message: 'Your application for Max has been approved!',
    category: 'adoption',
    recipients: 1,
    sentAt: '5 hours ago',
    status: 'sent',
    deliveryRate: 100,
  },
  {
    id: '3',
    title: 'New Volunteer Event',
    message: 'Adoption Drive this Saturday - Sign up now!',
    category: 'volunteer',
    recipients: 28,
    sentAt: '1 day ago',
    status: 'sent',
    deliveryRate: 96,
  },
  {
    id: '4',
    title: 'Foster Health Check Due',
    message: 'Koko\'s health check is due in 3 days',
    category: 'foster',
    recipients: 1,
    sentAt: 'Scheduled for Jun 7',
    status: 'scheduled',
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Jun 15 from 2-4 PM',
    category: 'system',
    recipients: 0,
    sentAt: 'Draft',
    status: 'draft',
  },
];

const categoryColors: Record<string, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  system: 'default',
  adoption: 'success',
  health: 'warning',
  volunteer: 'info',
  foster: 'danger',
};

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent' | 'failed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.status === filter);

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    addToast('success', 'Notification deleted');
  };

  const handleSend = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'sent' as const, sentAt: 'now' } : n));
    addToast('success', 'Notification sent');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Notifications Management"
        description="Create, schedule, and track notifications to adopters, volunteers, and staff."
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
          >
            <Plus size={18} />
            New Notification
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Send size={24} />} label="Sent This Month" value="24" tone="emerald" />
        <StatCard icon={<Clock size={24} />} label="Scheduled" value={notifications.filter(n => n.status === 'scheduled').length.toString()} tone="amber" />
        <StatCard icon={<Users size={24} />} label="Total Recipients" value="156" tone="blue" />
        <StatCard icon={<AlertCircle size={24} />} label="Draft" value={notifications.filter(n => n.status === 'draft').length.toString()} tone="slate" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'draft', 'scheduled', 'sent', 'failed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No {filter !== 'all' ? filter : ''} notifications</p>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <Card key={notification.id} noPadding className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 flex items-start gap-4">
                {/* Icon */}
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  notification.status === 'sent' ? 'bg-emerald-100' :
                  notification.status === 'scheduled' ? 'bg-amber-100' :
                  notification.status === 'draft' ? 'bg-slate-100' :
                  'bg-red-100'
                }`}>
                  {notification.status === 'sent' ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : notification.status === 'scheduled' ? (
                    <Clock size={24} className="text-amber-600" />
                  ) : notification.status === 'draft' ? (
                    <Bell size={24} className="text-slate-600" />
                  ) : (
                    <AlertCircle size={24} className="text-red-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{notification.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    </div>
                    <Badge variant={categoryColors[notification.category]}>
                      {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
                    <span>📤 {notification.recipients} recipients</span>
                    {notification.deliveryRate !== undefined && (
                      <span>✓ {notification.deliveryRate}% delivered</span>
                    )}
                    <span>🕐 {notification.sentAt}</span>
                    <span>
                      <Badge variant={
                        notification.status === 'sent' ? 'success' :
                        notification.status === 'scheduled' ? 'warning' :
                        notification.status === 'draft' ? 'default' :
                        'danger'
                      }>
                        {notification.status}
                      </Badge>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {notification.status === 'draft' && (
                    <button
                      onClick={() => handleSend(notification.id)}
                      className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm transition-colors"
                    >
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">Create Notification</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input type="text" placeholder="Notification title" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                <textarea placeholder="Message content" rows={4} className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Health</option>
                  <option>Adoption</option>
                  <option>Volunteer</option>
                  <option>Foster</option>
                  <option>System</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    addToast('success', 'Notification created');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
