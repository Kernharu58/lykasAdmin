import { CalendarDays, Clock, Download, Edit3, MapPin, Plus, Users } from 'lucide-react';
import { Badge, Card, PageHeader, SectionHeader, StatCard } from '../components/ui/SharedUI';

const events = [
  {
    id: 'EVT-0615',
    title: 'Adoption Drive',
    type: 'Adoption Drive',
    date: 'Jun 15, 2026',
    time: '9:00 AM - 3:00 PM',
    location: 'Eastwood City Mall',
    volunteers: '3/5',
    attendees: 42,
    status: 'Upcoming',
  },
  {
    id: 'EVT-0622',
    title: 'Volunteer Handling Training',
    type: 'Training',
    date: 'Jun 22, 2026',
    time: '1:00 PM - 5:00 PM',
    location: 'CarePaws Shelter',
    volunteers: '4/4',
    attendees: 18,
    status: 'Draft',
  },
  {
    id: 'EVT-0703',
    title: 'Community Feeding Outreach',
    type: 'Community Outreach',
    date: 'Jul 3, 2026',
    time: '8:00 AM - 12:00 PM',
    location: 'Angeles City Plaza',
    volunteers: '2/8',
    attendees: 27,
    status: 'Needs Staff',
  },
];

const typeTone: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  'Adoption Drive': 'success',
  Training: 'info',
  'Community Outreach': 'warning',
};

export default function Events() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Events"
        description="Plan adoption drives, training sessions, volunteer coverage, and public RSVP capacity."
        action={
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
            <Plus size={18} />
            Create Event
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CalendarDays size={24} />} label="Upcoming Events" value="3" tone="emerald" />
        <StatCard icon={<Users size={24} />} label="Open Volunteer Slots" value="8" tone="amber" />
        <StatCard icon={<Download size={24} />} label="Registered Attendees" value="87" tone="blue" />
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <SectionHeader
            title="Event Calendar"
            description="Cards show the operational items staff need before publishing or closing an event."
            action={
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-semibold text-slate-600">
                <button className="rounded-md bg-emerald-50 px-3 py-1.5 text-emerald-800">Cards</button>
                <button className="px-3 py-1.5">List</button>
                <button className="px-3 py-1.5">Calendar</button>
              </div>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5 sm:p-6">
          {events.map((event) => (
            <article key={event.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-800 p-4 text-white flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <Badge variant={typeTone[event.type]}>{event.type}</Badge>
                  <Badge variant={event.status === 'Needs Staff' ? 'warning' : event.status === 'Draft' ? 'default' : 'success'}>
                    {event.status}
                  </Badge>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight">{event.title}</h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-emerald-700" />
                  {event.date}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={16} className="text-emerald-700" />
                  {event.time}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-emerald-700" />
                  {event.location}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Volunteers</p>
                    <p className="font-extrabold text-slate-800">{event.volunteers}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">RSVPs</p>
                    <p className="font-extrabold text-slate-800">{event.attendees}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">View</button>
                  <button className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
