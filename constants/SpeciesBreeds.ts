// Fallback data for when database is not available
export const UNIFIED_SPECIES_BREEDS = {
  'Dog': [
    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Poodle',
    'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Siberian Husky',
    'Boxer', 'Great Dane', 'Chihuahua', 'Shih Tzu', 'Boston Terrier',
    'Pomeranian', 'Australian Shepherd', 'Maltese', 'Cocker Spaniel', 'Border Collie'
  ],
  'Cat': [
    'Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'British Shorthair',
    'Abyssinian', 'Russian Blue', 'American Shorthair', 'Scottish Fold', 'Sphynx',
    'Bengal', 'Birman', 'Oriental Shorthair', 'Burmese', 'Manx',
    'Norwegian Forest Cat', 'Exotic Shorthair', 'Devon Rex', 'Turkish Angora', 'Himalayan'
  ],
  'Bird': [
    'Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure',
    'African Grey Parrot', 'Macaw', 'Cockatoo', 'Finch', 'Parakeet',
    'Eclectus', 'Caique', 'Quaker Parrot', 'Sun Conure', 'Senegal Parrot'
  ],
  'Rabbit': [
    'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant',
    'English Angora', 'Dutch', 'New Zealand', 'Californian', 'Rex'
  ],
  'Fish': [
    'Goldfish', 'Betta', 'Guppy', 'Angelfish', 'Neon Tetra',
    'Molly', 'Platy', 'Swordtail', 'Corydoras', 'Discus'
  ],
  'Hamster': [
    'Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster', 'Chinese Hamster', 'European Hamster'
  ],
  'Guinea Pig': [
    'American Guinea Pig', 'Peruvian Guinea Pig', 'Abyssinian Guinea Pig', 'Silkie Guinea Pig', 'Texel Guinea Pig'
  ],
  'Reptile': [
    'Bearded Dragon', 'Leopard Gecko', 'Ball Python', 'Corn Snake', 'Blue-tongued Skink',
    'Green Iguana', 'Red-eared Slider', 'Russian Tortoise', 'Crested Gecko', 'Chameleon'
  ]
};

// Synchronous functions using static data (for backward compatibility)

// Synchronous fallback functions (for backward compatibility)
export const getSpeciesListSync = (): string[] => {
  return Object.keys(UNIFIED_SPECIES_BREEDS);
};

export const getBreedsBySpeciesSync = (species: string): string[] => {
  return UNIFIED_SPECIES_BREEDS[species] || [];
};

export const getAllBreedsSync = (): string[] => {
  return Object.values(UNIFIED_SPECIES_BREEDS).flat();
};

// Backward compatibility aliases
export const getSpeciesList = getSpeciesListSync;
export const getBreedsBySpecies = getBreedsBySpeciesSync;
export const getAllBreeds = getAllBreedsSync;