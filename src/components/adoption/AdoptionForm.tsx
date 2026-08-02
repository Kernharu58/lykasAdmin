import { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FieldGrid, FormActions, FormField, FormSection, TextAreaInput, TextInput,
} from '../ui/FormUI';

interface UserOption {
  _id: string;
  displayName: string;
  email: string;
  identityVerificationStatus?: string;
}

interface PetOption {
  _id: string;
  name: string;
  species: string;
  breed: string;
  status: string;
  imageUrl: string;
}

interface AdoptionFormProps {
  onSuccess: (application: any) => void;
  onCancel: () => void;
}

// The reusable "create a new application" form. There is no
// POST /api/applications in the real backend — applications are only ever
// created through POST /api/pets/:petId/adopt, which the mobile app calls
// for the logged-in user themselves. This component drives the same
// endpoint but with an explicit `applicant`, which the backend now accepts
// from staff/admin/super_admin (see petController.js's adoptPet) — that's
// what makes "log a walk-in/phone application" possible from here at all.
export default function AdoptionForm({ onSuccess, onCancel }: AdoptionFormProps) {
  const { addToast } = useToast();

  const [applicantQuery, setApplicantQuery] = useState('');
  const [applicantResults, setApplicantResults] = useState<UserOption[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<UserOption | null>(null);

  const [petQuery, setPetQuery] = useState('');
  const [petResults, setPetResults] = useState<PetOption[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetOption | null>(null);

  const [type, setType] = useState<'adoption' | 'foster'>('adoption');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [householdSize, setHouseholdSize] = useState('');
  const [isRenting, setIsRenting] = useState(false);
  const [landlordApproval, setLandlordApproval] = useState(false);
  const [fosterPeriod, setFosterPeriod] = useState('Flexible');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedApplicant || !applicantQuery.trim()) { setApplicantResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/auth/users', { params: { q: applicantQuery, role: 'user', limit: 8 } });
        setApplicantResults(res.data.users || []);
      } catch (err) {
        console.error('Applicant search failed:', err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [applicantQuery, selectedApplicant]);

  useEffect(() => {
    if (selectedPet || !petQuery.trim()) { setPetResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get('/pets/admin', { params: { q: petQuery, status: 'Available', limit: 8 } });
        setPetResults(res.data.pets || []);
      } catch (err) {
        console.error('Pet search failed:', err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [petQuery, selectedPet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedApplicant) return setFormError('Search for and select the applicant.');
    if (!selectedPet) return setFormError('Search for and select the pet.');
    if (!phone.trim() || !address.trim() || !experience.trim()) {
      return setFormError('Phone, address, and pet-care experience are all required.');
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/pets/${selectedPet._id}/adopt`, {
        applicant: selectedApplicant._id,
        type,
        phone: phone.trim(),
        address: address.trim(),
        experience: experience.trim(),
        householdSize: householdSize || undefined,
        isRenting,
        landlordApproval,
        fosterPeriod: type === 'foster' ? fosterPeriod : undefined,
      });
      addToast('success', res.data.message);
      onSuccess(res.data.application);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to log this application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl px-4 py-3">
          {formError}
        </div>
      )}

      <FormSection title="Applicant" description="The adopter this application is being logged for.">
        {selectedApplicant ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div>
              <p className="font-bold text-emerald-800">{selectedApplicant.displayName}</p>
              <p className="text-sm text-emerald-700">{selectedApplicant.email}</p>
              {selectedApplicant.identityVerificationStatus !== 'verified' && (
                <p className="text-xs font-semibold text-amber-600 mt-1">
                  ⚠ Not identity-verified yet — adoption (not foster) applications will be blocked until they are.
                </p>
              )}
            </div>
            <button type="button" onClick={() => setSelectedApplicant(null)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-full">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={applicantQuery}
              onChange={(e) => setApplicantQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            {applicantResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {applicantResults.map((u) => (
                  <li key={u._id}>
                    <button
                      type="button"
                      onClick={() => { setSelectedApplicant(u); setApplicantQuery(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center justify-between gap-2"
                    >
                      <span>
                        <span className="font-semibold text-slate-800">{u.displayName}</span>{' '}
                        <span className="text-slate-500">{u.email}</span>
                      </span>
                      <Check size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </FormSection>

      <FormSection title="Pet" description="Only pets currently marked Available are shown.">
        {selectedPet ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={selectedPet.imageUrl} alt={selectedPet.name} className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="font-bold text-emerald-800">{selectedPet.name}</p>
                <p className="text-sm text-emerald-700">{selectedPet.species} &middot; {selectedPet.breed}</p>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedPet(null)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-full">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by pet name or breed..."
              value={petQuery}
              onChange={(e) => setPetQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            {petResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {petResults.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => { setSelectedPet(p); setPetQuery(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-3"
                    >
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      <span>
                        <span className="font-semibold text-slate-800">{p.name}</span>{' '}
                        <span className="text-slate-500">{p.species} &middot; {p.breed}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </FormSection>

      <FormSection title="Application Details">
        <FormField label="Application Type" required>
          <div className="flex gap-2">
            {(['adoption', 'foster'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  type === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'adoption' ? 'Adoption' : 'Foster'}
              </button>
            ))}
          </div>
        </FormField>

        {type === 'foster' && (
          <FormField label="Foster Period">
            <select
              value={fosterPeriod}
              onChange={(e) => setFosterPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
            >
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="Flexible">Flexible</option>
            </select>
          </FormField>
        )}

        <FieldGrid>
          <FormField label="Phone" required>
            <TextInput required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Household Size">
            <TextInput type="number" min="1" value={householdSize} onChange={(e) => setHouseholdSize(e.target.value)} />
          </FormField>
        </FieldGrid>

        <FormField label="Address" required>
          <TextInput required value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>

        <FormField label="Pet-care Experience" required hint="Prior pets owned, relevant experience, etc.">
          <TextAreaInput required rows={4} value={experience} onChange={(e) => setExperience(e.target.value)} />
        </FormField>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={isRenting} onChange={(e) => setIsRenting(e.target.checked)} className="rounded accent-emerald-600" />
            Applicant is renting
          </label>
          {isRenting && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer ml-6">
              <input type="checkbox" checked={landlordApproval} onChange={(e) => setLandlordApproval(e.target.checked)} className="rounded accent-emerald-600" />
              Landlord has approved pets
            </label>
          )}
        </div>
      </FormSection>

      <FormActions onCancel={onCancel} submitLabel="Log Application" loadingLabel="Submitting..." loading={submitting} />
    </form>
  );
}
