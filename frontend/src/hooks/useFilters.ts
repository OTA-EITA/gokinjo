import { useState, useEffect, useCallback } from 'react';
import type { Area, School, Crime, SafetyScore, FilterState, StatisticsData } from '../types';
import { 
  filterAreas, 
  filterSchools, 
  filterCrimes, 
  filterSafetyScores 
} from '../utils/filters';
import { calculateStatistics } from '../utils/statistics';
import { getAvailableCrimeCategories, getSchoolTypeLabel } from '../utils/helpers';

interface UseFiltersReturn {
  filterState: FilterState;
  filteredAreas: Area[];
  filteredSchools: School[];
  filteredCrimes: Crime[];
  filteredSafetyScores: SafetyScore[];
  availableCrimeCategories: string[];
  statisticsData: StatisticsData | null;
  searchSuggestions: string[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  handleSearchChange: (searchTerm: string) => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSuggestionClick: (suggestion: string) => void;
  handleSearchBlur: () => void;
  handleSearchFocus: () => void;
  handleSchoolTypeToggle: (type: School['type']) => void;
  handleCrimeCategoryToggle: (category: string) => void;
  handleSafetyScoreRangeChange: (range: [number, number]) => void;
  handlePublicPrivateToggle: (type: 'public' | 'private') => void;
  handleClearFilters: () => void;
}

export const useFilters = (
  areas: Area[],
  schools: School[],
  crimes: Crime[],
  safetyScores: SafetyScore[]
): UseFiltersReturn => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    selectedSchoolTypes: [],
    selectedCrimeCategories: [],
    safetyScoreRange: [0, 100],
    showPublicOnly: false,
    showPrivateOnly: false
  });

  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [filteredCrimes, setFilteredCrimes] = useState<Crime[]>([]);
  const [filteredSafetyScores, setFilteredSafetyScores] = useState<SafetyScore[]>([]);
  const [availableCrimeCategories, setAvailableCrimeCategories] = useState<string[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);

  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);

  useEffect(() => {
    const newFilteredAreas = filterAreas(areas, filterState.searchTerm);
    setFilteredAreas(newFilteredAreas);

    const newFilteredSchools = filterSchools(schools, filterState);
    setFilteredSchools(newFilteredSchools);

    const newFilteredCrimes = filterCrimes(crimes, filterState);
    setFilteredCrimes(newFilteredCrimes);
    
    setAvailableCrimeCategories(getAvailableCrimeCategories(crimes));

    const newFilteredSafetyScores = filterSafetyScores(safetyScores, filterState);
    setFilteredSafetyScores(newFilteredSafetyScores);
    
    const newStatistics = calculateStatistics(newFilteredSchools, newFilteredCrimes, newFilteredSafetyScores);
    setStatisticsData(newStatistics);
  }, [areas, schools, crimes, safetyScores, filterState]);

  const generateSearchSuggestions = useCallback((searchTerm: string): string[] => {
    if (!searchTerm || searchTerm.length < 1) return [];
    
    const suggestions = new Set<string>();
    const term = searchTerm.toLowerCase();
    
    areas.forEach(area => {
      if (area.name.toLowerCase().includes(term)) {
        suggestions.add(area.name);
      }
    });
    
    schools.forEach(school => {
      if (school.name.toLowerCase().includes(term)) {
        suggestions.add(school.name);
      }
    });
    
    const schoolTypes = ['elementary', 'junior_high', 'high'] as School['type'][];
    schoolTypes.forEach(type => {
      const label = getSchoolTypeLabel(type);
      if (label.toLowerCase().includes(term)) {
        suggestions.add(label);
      }
    });
    
    if ('public'.includes(term) || 'public'.toLowerCase().includes(term)) {
      suggestions.add('Public');
    }
    if ('private'.includes(term) || 'private'.toLowerCase().includes(term)) {
      suggestions.add('Private');
    }
    
    availableCrimeCategories.forEach(category => {
      if (category.toLowerCase().includes(term)) {
        suggestions.add(category);
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [areas, schools, availableCrimeCategories]);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setFilterState(prev => ({ ...prev, searchTerm }));
    setSelectedSuggestionIndex(-1);
    
    if (searchTerm.length > 0) {
      const suggestions = generateSearchSuggestions(searchTerm);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [generateSearchSuggestions]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          const suggestion = searchSuggestions[selectedSuggestionIndex];
          setFilterState(prev => ({ ...prev, searchTerm: suggestion }));
          setShowSuggestions(false);
          setSearchSuggestions([]);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setFilterState(prev => ({ ...prev, searchTerm: suggestion }));
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setSelectedSuggestionIndex(-1);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (filterState.searchTerm.length > 0 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [filterState.searchTerm, searchSuggestions]);

  const handleSchoolTypeToggle = useCallback((type: School['type']) => {
    setFilterState(prev => ({
      ...prev,
      selectedSchoolTypes: prev.selectedSchoolTypes.includes(type)
        ? prev.selectedSchoolTypes.filter(t => t !== type)
        : [...prev.selectedSchoolTypes, type]
    }));
  }, []);

  const handleCrimeCategoryToggle = useCallback((category: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedCrimeCategories: prev.selectedCrimeCategories.includes(category)
        ? prev.selectedCrimeCategories.filter(c => c !== category)
        : [...prev.selectedCrimeCategories, category]
    }));
  }, []);

  const handleSafetyScoreRangeChange = useCallback((range: [number, number]) => {
    setFilterState(prev => ({ ...prev, safetyScoreRange: range }));
  }, []);

  const handlePublicPrivateToggle = useCallback((type: 'public' | 'private') => {
    setFilterState(prev => ({
      ...prev,
      showPublicOnly: type === 'public' ? !prev.showPublicOnly : prev.showPublicOnly,
      showPrivateOnly: type === 'private' ? !prev.showPrivateOnly : prev.showPrivateOnly
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchTerm: '',
      selectedSchoolTypes: [],
      selectedCrimeCategories: [],
      safetyScoreRange: [0, 100],
      showPublicOnly: false,
      showPrivateOnly: false
    });
  }, []);

  return {
    filterState,
    filteredAreas,
    filteredSchools,
    filteredCrimes,
    filteredSafetyScores,
    availableCrimeCategories,
    statisticsData,
    searchSuggestions,
    showSuggestions,
    selectedSuggestionIndex,
    handleSearchChange,
    handleSearchKeyDown,
    handleSuggestionClick,
    handleSearchBlur,
    handleSearchFocus,
    handleSchoolTypeToggle,
    handleCrimeCategoryToggle,
    handleSafetyScoreRangeChange,
    handlePublicPrivateToggle,
    handleClearFilters
  };
};
