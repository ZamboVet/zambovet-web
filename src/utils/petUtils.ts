import { SPECIES_LIST, BREED_DATA, CUSTOM_SPECIES_KEY } from '@/constants/petData';

// Utility functions for pet species and breed management

/**
 * Get all available species including custom ones from local storage
 * Safe for SSR - returns base species list on server, full list on client
 */
export const getAllSpecies = (): string[] => {
  if (typeof window === 'undefined') return SPECIES_LIST;
  
  try {
    const customSpecies = localStorage.getItem(CUSTOM_SPECIES_KEY);
    const savedCustomSpecies = customSpecies ? JSON.parse(customSpecies) : [];
    
    // Remove 'Others' from the original list and add custom species, then add 'Others' at the end
    const baseSpecies = SPECIES_LIST.filter(species => species !== 'Others');
    const allSpecies = [...baseSpecies, ...savedCustomSpecies];
    
    // Remove duplicates and add 'Others' at the end
    const uniqueSpecies = Array.from(new Set(allSpecies));
    return [...uniqueSpecies, 'Others'];
  } catch (error) {
    console.error('Error reading custom species from localStorage:', error);
    return SPECIES_LIST;
  }
};

/**
 * Get base species list (SSR-safe)
 */
export const getBaseSpecies = (): string[] => {
  return SPECIES_LIST;
};

/**
 * Save a custom species to local storage
 */
export const saveCustomSpecies = (speciesName: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const trimmedSpecies = speciesName.trim();
    if (!trimmedSpecies) return;
    
    // Get existing custom species
    const customSpecies = localStorage.getItem(CUSTOM_SPECIES_KEY);
    const savedCustomSpecies = customSpecies ? JSON.parse(customSpecies) : [];
    
    // Check if species already exists (case-insensitive)
    const existingSpecies = getAllSpecies().map(s => s.toLowerCase());
    if (!existingSpecies.includes(trimmedSpecies.toLowerCase())) {
      // Add new species
      const updatedCustomSpecies = [...savedCustomSpecies, trimmedSpecies];
      localStorage.setItem(CUSTOM_SPECIES_KEY, JSON.stringify(updatedCustomSpecies));
    }
  } catch (error) {
    console.error('Error saving custom species to localStorage:', error);
  }
};

/**
 * Get predefined breeds for a specific species
 */
export const getBreedsForSpecies = (species: string): string[] => {
  if (!species || species === 'Others') return [];
  
  return BREED_DATA[species] || [];
};

/**
 * Check if a species has predefined breeds
 */
export const hasPredefindedBreeds = (species: string): boolean => {
  return species && species !== 'Others' && BREED_DATA[species] && BREED_DATA[species].length > 0;
};

/**
 * Format species name for display (capitalize first letter)
 */
export const formatSpeciesName = (species: string): string => {
  return species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
};

/**
 * Get custom species from local storage
 */
export const getCustomSpecies = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const customSpecies = localStorage.getItem(CUSTOM_SPECIES_KEY);
    return customSpecies ? JSON.parse(customSpecies) : [];
  } catch (error) {
    console.error('Error reading custom species from localStorage:', error);
    return [];
  }
};

/**
 * Clear all custom species from local storage
 */
export const clearCustomSpecies = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CUSTOM_SPECIES_KEY);
  } catch (error) {
    console.error('Error clearing custom species from localStorage:', error);
  }
};