import { useState, useEffect } from 'react';
import { getSpecies, getBreeds, getSpeciesWithBreeds } from '@/lib/services/speciesBreedsService';

interface Species {
  id: string;
  name: string;
  createdAt?: string;
  createdBy?: string;
}

interface Breed {
  id: string;
  name: string;
  speciesId: string;
  speciesName?: string;
  createdAt?: string;
  createdBy?: string;
}

interface SpeciesWithBreeds extends Species {
  breeds: Breed[];
}

export const useSpeciesBreeds = (userEmail?: string) => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [speciesWithBreeds, setSpeciesWithBreeds] = useState<SpeciesWithBreeds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!userEmail) {
      setSpecies([]);
      setBreeds([]);
      setSpeciesWithBreeds([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [speciesData, breedsData, speciesWithBreedsData] = await Promise.all([
        getSpecies(userEmail),
        getBreeds(userEmail),
        getSpeciesWithBreeds(userEmail)
      ]);

      setSpecies(speciesData);
      setBreeds(breedsData);
      setSpeciesWithBreeds(speciesWithBreedsData);
    } catch (err) {
      console.error('Error loading species and breeds:', err);
      setError('Failed to load species and breeds data');
      setSpecies([]);
      setBreeds([]);
      setSpeciesWithBreeds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  const getBreedsBySpeciesId = (speciesId: string): Breed[] => {
    return breeds.filter(breed => breed.speciesId === speciesId);
  };

  const getBreedsBySpeciesName = (speciesName: string): Breed[] => {
    const speciesItem = species.find(s => s.name === speciesName);
    if (speciesItem) {
      return getBreedsBySpeciesId(speciesItem.id);
    }
    return [];
  };

  const getSpeciesById = (speciesId: string): Species | undefined => {
    return species.find(s => s.id === speciesId);
  };

  const getSpeciesByName = (speciesName: string): Species | undefined => {
    return species.find(s => s.name === speciesName);
  };

  const refresh = () => {
    loadData();
  };

  return {
    species,
    breeds,
    speciesWithBreeds,
    loading,
    error,
    getBreedsBySpeciesId,
    getBreedsBySpeciesName,
    getSpeciesById,
    getSpeciesByName,
    refresh,
  };
};

export default useSpeciesBreeds;