import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FieldGrid,
  FormActions,
  FormField,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
  SelectInput,
  TextAreaInput,
  TextInput,
} from '../ui/FormUI';

// Matches the real Pet schema's enums exactly (lykasServer/src/models/Pet.js) —
// including temperament and energyLevel, which power the mobile catalog's
// filter UX but are missing entirely from the existing AddPetModal/EditPetModal
// forms, so pets created through those never have them set.
const SPECIES = ['Dog', 'Cat', 'Other'];
const GENDERS = ['Male', 'Female'];
const SIZES = ['Small', 'Medium', 'Large'];
const TEMPERAMENTS = ['Calm', 'Playful', 'Shy', 'Energetic', 'Affectionate', 'Independent'];
const ENERGY_LEVELS = ['Low', 'Medium', 'High'];
const STATUSES = ['Available', 'Pending', 'Adopted', 'Foster'];

export interface PetRecord {
  _id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size?: string;
  weight?: string;
  temperament?: string;
  energyLevel?: string;
  healthStatus?: string;
  description: string;
  imageUrl: string;
  status: string;
}

interface PetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When present, the modal edits this pet instead of creating a new one. */
  pet?: PetRecord | null;
}

const emptyForm = {
  name: '',
  type: 'Dog', // sent as "type"; the backend's createPet/updatePet map type -> species
  breed: '',
  age: '',
  gender: 'Male',
  size: 'Medium',
  weight: '',
  temperament: '',
  energyLevel: '',
  status: 'Available',
  description: '',
  healthStatus: '',
};

export default function PetFormModal({ isOpen, onClose, onSuccess, pet }: PetFormModalProps) {
  const isEditMode = Boolean(pet);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        type: pet.species || 'Dog',
        breed: pet.breed || '',
        age: pet.age || '',
        gender: pet.gender || 'Male',
        size: pet.size || 'Medium',
        weight: pet.weight || '',
        temperament: pet.temperament || '',
        energyLevel: pet.energyLevel || '',
        status: pet.status || 'Available',
        description: pet.description || '',
        healthStatus: pet.healthStatus || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setImageFile(null);
  }, [pet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Omit empty optional enum fields rather than sending "" — an empty
        // string isn't a valid enum value and Mongoose would reject it.
        if (value !== '') data.append(key, value);
      });
      if (imageFile) data.append('image', imageFile);

      if (isEditMode && pet) {
        await api.put(`/pets/${pet._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast('success', `${formData.name} was updated.`);
      } else {
        if (!imageFile) {
          addToast('error', 'A photo is required for a new pet listing.');
          setLoading(false);
          return;
        }
        await api.post('/pets', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast('success', `${formData.name} was added to the shelter.`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save pet', error);
      addToast('error', error?.response?.data?.message || 'Failed to save pet. Please check the form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell maxWidth="max-w-2xl">
      <ModalHeader
        title={isEditMode ? `Edit ${pet?.name}` : 'Add New Pet'}
        subtitle="Complete every field you can — temperament and energy level directly power the mobile app's filter search."
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalBody>
          <FormSection title="Profile Photo" description={isEditMode ? 'Upload a new photo to replace the current one, or leave blank to keep it.' : 'A clear photo helps adopters identify the pet quickly.'}>
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100">
              <Upload className="mx-auto mb-3 text-emerald-500" size={32} />
              <p className="text-sm font-semibold text-slate-700">
                {imageFile ? imageFile.name : isEditMode ? 'Upload a replacement photo (optional)' : 'Upload a pet photo'}
              </p>
              <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WEBP</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mt-4 w-full max-w-xs cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
              />
            </div>
          </FormSection>

          <FormSection title="Basic Details">
            <FieldGrid>
              <FormField label="Name" required>
                <TextInput required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </FormField>
              <FormField label="Species" required>
                <SelectInput value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Breed" required>
                <TextInput required value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
              </FormField>
              <FormField label="Age" required hint="e.g. '2 years' or '6 months'">
                <TextInput required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </FormField>
              <FormField label="Weight (kg)">
                <TextInput type="number" step="0.1" min="0" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
              </FormField>
              <FormField label="Gender" required>
                <SelectInput value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Size">
                <SelectInput value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })}>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </FormField>
            </FieldGrid>
          </FormSection>

          <FormSection title="Temperament & Energy" description="Used by the mobile app's pet-catalog filters — leave blank only if genuinely unknown.">
            <FieldGrid>
              <FormField label="Temperament">
                <SelectInput value={formData.temperament} onChange={(e) => setFormData({ ...formData, temperament: e.target.value })}>
                  <option value="">Not set</option>
                  {TEMPERAMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectInput>
              </FormField>
              <FormField label="Energy Level">
                <SelectInput value={formData.energyLevel} onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}>
                  <option value="">Not set</option>
                  {ENERGY_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
                </SelectInput>
              </FormField>
            </FieldGrid>
          </FormSection>

          <FormSection title="Adoption Readiness">
            <FormField label="Status">
              <SelectInput value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </FormField>
            <FormField label="Health Status">
              <TextInput
                placeholder="e.g., Healthy, Needs medication, Post-surgery recovery"
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
              />
            </FormField>
            <FormField label="Description & Medical Notes" required hint="Include personality, vaccinations, restrictions, and care instructions.">
              <TextAreaInput
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>
          </FormSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            onCancel={onClose}
            submitLabel={isEditMode ? 'Save Changes' : 'Add Pet'}
            loadingLabel="Saving..."
            loading={loading}
          />
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
