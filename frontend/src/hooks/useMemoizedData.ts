import { useMemo } from 'react';
import type { School, Crime, SafetyScore, Area, FilterState, SafetyScoreResult } from '../types';
import {
  filterAreas,
  filterSchools,
  filterCrimes,
  filterSafetyScores
} from '../utils/filters';
import { calculateStatistics } from '../utils/statistics';
import { getAvailableCrimeCategories } from '../utils/helpers';

interface UseMemoizedDataProps {
  areas: Area[];
  schools: School[];
  crimes: Crime[];
  safetyScores: SafetyScore[];
  calculatedSafetyScores: SafetyScoreResult[];
  filterState: FilterState;
}

export const useMemoizedData = ({
  areas,
  schools,
  crimes,
  safetyScores,
  calculatedSafetyScores,
  filterState
}: UseMemoizedDataProps) => {
  const filteredAreas = useMemo(
    () => filterAreas(areas, filterState.searchTerm),
    [areas, filterState.searchTerm]
  );

  const filteredSchools = useMemo(
    () => filterSchools(schools, filterState),
    [schools, filterState]
  );

  const filteredCrimes = useMemo(
    () => filterCrimes(crimes, filterState),
    [crimes, filterState]
  );

  const availableCrimeCategories = useMemo(
    () => getAvailableCrimeCategories(crimes),
    [crimes]
  );

  const filteredSafetyScores = useMemo(
    () => filterSafetyScores(safetyScores, filterState),
    [safetyScores, filterState]
  );

  const statisticsData = useMemo(
    () => calculateStatistics(filteredSchools, filteredCrimes, filteredSafetyScores),
    [filteredSchools, filteredCrimes, filteredSafetyScores]
  );

  const filteredCalculatedScores = useMemo(
    () => calculatedSafetyScores.filter(score => 
      filteredSchools.some(school => school.id === score.school_id)
    ),
    [calculatedSafetyScores, filteredSchools]
  );

  return {
    filteredAreas,
    filteredSchools,
    filteredCrimes,
    availableCrimeCategories,
    filteredSafetyScores,
    statisticsData,
    filteredCalculatedScores
  };
};
