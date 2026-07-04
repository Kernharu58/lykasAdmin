import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, PawPrint } from "lucide-react";
import api from "../services/api";
import { PageHeader, Badge } from "../components/ui/SharedUI";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../components/ui/StateDisplays";

interface Pet {
  _id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  size?: string;
  status: string;
  imageUrl: string;
  healthStatus?: string;
}

const SPECIES = ["All", "Dog", "Cat", "Other"];
const STATUSES = ["All", "Available", "Pending", "Adopted", "Foster"];

function statusVariant(s: string): "success" | "warning" | "info" | "default" {
  if (s === "Available") return "success";
  if (s === "Pending") return "warning";
  if (s === "Foster") return "info";
  return "default";
}

export default function PetGallery() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("All");
  const [status, setStatus] = useState("All");
  const navigate = useNavigate();

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/pets?all=true");
      setPets(res.data || []);
    } catch (e: any) {
      setError("Could not load the pet gallery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const filtered = pets.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q);
    const matchSpecies = species === "All" || p.species === species;
    const matchStatus = status === "All" || p.status === status;
    return matchSearch && matchSpecies && matchStatus;
  });

  const counts = {
    available: pets.filter((p) => p.status === "Available").length,
    foster: pets.filter((p) => p.status === "Foster").length,
    adopted: pets.filter((p) => p.status === "Adopted").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Pet Gallery"
        description="Visual overview of all shelter animals. Click any pet to view full details."
        action={
          <div className="flex gap-3 text-sm text-slate-600">
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold">
              {counts.available} Available
            </span>
            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-semibold">
              {counts.foster} Foster
            </span>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold">
              {counts.adopted} Adopted
            </span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or breed…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 w-full text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={15}
            />
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
            >
              {SPECIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading gallery…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPets} />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            pets.length === 0
              ? "No pets registered in the shelter yet."
              : "No pets match your current filters."
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((pet) => (
            <button
              key={pet._id}
              onClick={() => navigate(`/pets/${pet._id}`)}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {pet.imageUrl ? (
                  <img
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PawPrint size={32} className="text-slate-300" />
                  </div>
                )}
                {/* Status badge over image */}
                <div className="absolute top-2 left-2">
                  <Badge variant={statusVariant(pet.status)}>
                    {pet.status}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-bold text-slate-800 text-sm truncate">
                  {pet.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{pet.breed}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>{pet.species}</span>
                  <span>
                    {pet.age} · {pet.gender}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="text-center text-sm text-slate-400 mt-6">
          Showing {filtered.length} of {pets.length} pets
        </p>
      )}
    </div>
  );
}
