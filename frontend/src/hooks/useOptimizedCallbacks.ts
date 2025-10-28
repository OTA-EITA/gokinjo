import { useCallback, Dispatch, SetStateAction } from 'react';
import type { Area, School, LayerState, FilterState } from '../types';

interface UseOptimizedCallbacksProps {
  setSelectedArea: (area: Area | null) => void;
  setShowStatistics: (show: boolean) => void;
  setChartsInitialized: (initialized: boolean) => void;
  loadAreaData: (wardCode: string, townCode: string) => Promise<void>;
  setLayerState: Dispatch<SetStateAction<LayerState>>;
  setFilterState: Dispatch<SetStateAction<FilterState>>;
  setShowFilters: (show: boolean) => void;
  setShowComparison: (show: boolean) => void;
  setShowTimeSeries: (show: boolean) => void;
  setShowRouteSearch: (show: boolean) => void;
  generateCSVData: (schools: School[], crimes: any[], safetyScores: any[]) => string;
  downloadCSV: (csvContent: string) => void;
  generatePDFReport: (statisticsData: any, areaName: string) => void;
}

export const useOptimizedCallbacks = ({
  setSelectedArea,
  setShowStatistics,
  setChartsInitialized,
  loadAreaData,
  setLayerState,
  setFilterState,
  setShowFilters,
  setShowComparison,
  setShowTimeSeries,
  setShowRouteSearch,
  generateCSVData,
  downloadCSV,
  generatePDFReport
}: UseOptimizedCallbacksProps) => {
  const handleAreaClick = useCallback((area: Area) => {
    setSelectedArea(area);
    setShowStatistics(true);
    setChartsInitialized(false);
    loadAreaData(area.ward_code, area.town_code);
  }, [setSelectedArea, setShowStatistics, setChartsInitialized, loadAreaData]);

  const handleLayerToggle = useCallback((layer: keyof LayerState) => {
    setLayerState((prev: LayerState) => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, [setLayerState]);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setFilterState(prev => ({ ...prev, searchTerm }));
  }, [setFilterState]);

  const handleSchoolTypeToggle = useCallback((type: School['type']) => {
    setFilterState(prev => ({
      ...prev,
      selectedSchoolTypes: prev.selectedSchoolTypes.includes(type)
        ? prev.selectedSchoolTypes.filter(t => t !== type)
        : [...prev.selectedSchoolTypes, type]
    }));
  }, [setFilterState]);

  const handleCrimeCategoryToggle = useCallback((category: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedCrimeCategories: prev.selectedCrimeCategories.includes(category)
        ? prev.selectedCrimeCategories.filter(c => c !== category)
        : [...prev.selectedCrimeCategories, category]
    }));
  }, [setFilterState]);

  const handleSafetyScoreRangeChange = useCallback((range: [number, number]) => {
    setFilterState(prev => ({ ...prev, safetyScoreRange: range }));
  }, [setFilterState]);

  const handlePublicPrivateToggle = useCallback((type: 'public' | 'private') => {
    setFilterState(prev => ({
      ...prev,
      showPublicOnly: type === 'public' ? !prev.showPublicOnly : prev.showPublicOnly,
      showPrivateOnly: type === 'private' ? !prev.showPrivateOnly : prev.showPrivateOnly
    }));
  }, [setFilterState]);

  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchTerm: '',
      selectedSchoolTypes: [],
      selectedCrimeCategories: [],
      safetyScoreRange: [0, 100],
      showPublicOnly: false,
      showPrivateOnly: false
    });
  }, [setFilterState]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, [setShowFilters]);

  const handleToggleStatistics = useCallback(() => {
    setShowStatistics(prev => !prev);
  }, [setShowStatistics]);

  const handleToggleComparison = useCallback(() => {
    setShowComparison(prev => !prev);
  }, [setShowComparison]);

  const handleToggleTimeSeries = useCallback(() => {
    setShowTimeSeries(prev => !prev);
  }, [setShowTimeSeries]);

  const handleToggleRouteSearch = useCallback(() => {
    setShowRouteSearch(prev => !prev);
  }, [setShowRouteSearch]);

  const handleExportCSV = useCallback((
    filteredSchools: School[],
    filteredCrimes: any[],
    filteredSafetyScores: any[]
  ) => {
    const csvContent = generateCSVData(filteredSchools, filteredCrimes, filteredSafetyScores);
    downloadCSV(csvContent);
  }, [generateCSVData, downloadCSV]);

  const handleExportPDF = useCallback((statisticsData: any, areaName: string) => {
    if (statisticsData) {
      generatePDFReport(statisticsData, areaName);
    }
  }, [generatePDFReport]);

  return {
    handleAreaClick,
    handleLayerToggle,
    handleSearchChange,
    handleSchoolTypeToggle,
    handleCrimeCategoryToggle,
    handleSafetyScoreRangeChange,
    handlePublicPrivateToggle,
    handleClearFilters,
    handleToggleFilters,
    handleToggleStatistics,
    handleToggleComparison,
    handleToggleTimeSeries,
    handleToggleRouteSearch,
    handleExportCSV,
    handleExportPDF
  };
};
