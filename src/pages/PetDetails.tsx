import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clipboard,
  Edit,
  HeartPulse,
  PawPrint,
  Syringe,
  Stethoscope,
  Weight,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { Badge, Card, SectionHeader } from "../components/ui/SharedUI";
import { LoadingState, ErrorState } from "../components/ui/StateDisplays";

interface Pet {
  _id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size?: string;
  weight?: string;
  status: string;
  imageUrl: string;
  healthStatus?: string;
  description: string;
  createdAt?: string;
}

interface Vaccination {
  _id: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  administeredBy?: string;
  notes?: string;
}

interface VetVisit {
  _id: string;
  date: string;
  reason: string;
  diagnosis?: string;
  treatment?: string;
  vetName?: string;
  notes?: string;
}

interface MedicalRecord {
  _id: string;
  date: string;
  type: string;
  description: string;
  notes?: string;
}

function statusVariant(s: string): "success" | "warning" | "info" | "default" {
  if (s === "Available") return "success";
  if (s === "Pending") return "warning";
  if (s === "Foster") return "info";
  return "default";
}

export default function PetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccinations, setVacc] = useState<Vaccination[]>([]);
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "vaccinations" | "vet-visits" | "records"
  >("vaccinations");

  const fetchAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [petRes, vaccRes, vetRes, recRes] = await Promise.allSettled([
        api.get(`/pets/${id}`),
        api.get(`/medical/vaccinations/${id}`),
        api.get(`/medical/vet-visits/${id}`),
        api.get(`/medical/records/${id}`),
      ]);

      if (petRes.status === "fulfilled") setPet(petRes.value.data);
      else {
        setError("Pet not found or could not be loaded.");
        return;
      }

      if (vaccRes.status === "fulfilled") setVacc(vaccRes.value.data || []);
      if (vetRes.status === "fulfilled") setVetVisits(vetRes.value.data || []);
      if (recRes.status === "fulfilled") setRecords(recRes.value.data || []);
    } catch (e: any) {
      setError("Could not load pet details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  if (loading)
    return (
      <div className="p-8">
        <LoadingState message="Loading pet details…" />
      </div>
    );
  if (error || !pet)
    return (
      <div className="p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <ErrorState message={error || "Pet not found."} onRetry={fetchAll} />
      </div>
    );

  const TABS = [
    {
      key: "vaccinations" as const,
      label: `Vaccinations (${vaccinations.length})`,
      icon: <Syringe size={15} />,
    },
    {
      key: "vet-visits" as const,
      label: `Vet Visits (${vetVisits.length})`,
      icon: <Stethoscope size={15} />,
    },
    {
      key: "records" as const,
      label: `Medical Records (${records.length})`,
      icon: <Clipboard size={15} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={16} /> Back to Gallery
      </button>

      {/* Hero card */}
      <Card className="mb-6" noPadding>
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-72 shrink-0">
            {pet.imageUrl ? (
              <img
                src={pet.imageUrl}
                alt={pet.name}
                className="w-full h-64 md:h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-slate-100 flex items-center justify-center rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                <PawPrint size={48} className="text-slate-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {pet.name}
                </h1>
                <p className="text-slate-500 font-medium mt-0.5">
                  {pet.breed} · {pet.species}
                </p>
              </div>
              <Badge variant={statusVariant(pet.status)}>{pet.status}</Badge>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Age", value: pet.age, icon: <Calendar size={14} /> },
                {
                  label: "Gender",
                  value: pet.gender,
                  icon: <PawPrint size={14} />,
                },
                {
                  label: "Size",
                  value: pet.size || "—",
                  icon: <Weight size={14} />,
                },
                {
                  label: "Weight",
                  value: pet.weight || "—",
                  icon: <Weight size={14} />,
                },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    {item.icon}
                    <span className="uppercase tracking-wider font-bold">
                      {item.label}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Health status */}
            {pet.healthStatus && (
              <div className="flex items-start gap-2 mb-4">
                <HeartPulse
                  size={15}
                  className="text-emerald-500 mt-0.5 shrink-0"
                />
                <p className="text-sm text-slate-600">{pet.healthStatus}</p>
              </div>
            )}

            {/* Description */}
            {pet.description && (
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">
                {pet.description}
              </p>
            )}

            {pet.createdAt && (
              <p className="text-xs text-slate-400 mt-4">
                Registered {new Date(pet.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Medical Records */}
      <Card noPadding>
        {/* Tabs */}
        <div className="border-b border-slate-100 px-5 pt-2">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.key ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* Vaccinations */}
          {activeTab === "vaccinations" &&
            (vaccinations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No vaccination records found.
              </p>
            ) : (
              <div className="space-y-3">
                {vaccinations.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Syringe size={14} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {v.vaccineName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Given:{" "}
                          {new Date(v.dateAdministered).toLocaleDateString()}
                        </p>
                        {v.administeredBy && (
                          <p className="text-xs text-slate-500">
                            By: {v.administeredBy}
                          </p>
                        )}
                        {v.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            {v.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {v.nextDueDate && (
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Next Due
                        </p>
                        <p
                          className={`text-xs font-semibold mt-0.5 ${new Date(v.nextDueDate) < new Date() ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          {new Date(v.nextDueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {/* Vet Visits */}
          {activeTab === "vet-visits" &&
            (vetVisits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No vet visit records found.
              </p>
            ) : (
              <div className="space-y-3">
                {vetVisits.map((v) => (
                  <div
                    key={v._id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Stethoscope size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 text-sm">
                            {v.reason}
                          </p>
                          <p className="text-xs text-slate-400 shrink-0">
                            {new Date(v.date).toLocaleDateString()}
                          </p>
                        </div>
                        {v.vetName && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Vet: {v.vetName}
                          </p>
                        )}
                        {v.diagnosis && (
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="font-semibold">Diagnosis:</span>{" "}
                            {v.diagnosis}
                          </p>
                        )}
                        {v.treatment && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold">Treatment:</span>{" "}
                            {v.treatment}
                          </p>
                        )}
                        {v.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            {v.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* General Medical Records */}
          {activeTab === "records" &&
            (records.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No general medical records found.
              </p>
            ) : (
              <div className="space-y-3">
                {records.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Clipboard size={14} className="text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 text-sm">
                            {r.type}
                          </p>
                          <p className="text-xs text-slate-400 shrink-0">
                            {new Date(r.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {r.description}
                        </p>
                        {r.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">
                            {r.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
