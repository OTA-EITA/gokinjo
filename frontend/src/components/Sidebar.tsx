import React, { useState } from 'react';
import type { 
  Area, 
  School, 
  Crime, 
  SafetyScore, 
  LayerState, 
  FilterState, 
  StatisticsData,
  SafetyScoreResult,
  MapControlSettings
} from '../types';
import { LABELS } from '../constants';
import { LayerControls } from './LayerControls';
import { SearchFilters } from './SearchFilters';
import EnhancedMapControls from './EnhancedMapControls';
import { StatisticsDashboard } from './StatisticsDashboard';
import AreaComparison from './AreaComparison';
import TimeSeriesAnalysis from './TimeSeriesAnalysis';
import SafeRouteSearch from './SafeRouteSearch';
import { SelectedAreaInfo } from './SelectedAreaInfo';
import { AreasList } from './AreasList';
import type { AreaComparisonData } from '../types';

declare const L: any;

interface SidebarProps {
  loading: boolean;
  schools: School[];
  crimes: Crime[];
  calculatedSafetyScores: SafetyScoreResult[];
  selectedArea: Area | null;
  layerState: LayerState;
  showBoundaries: boolean;
  filterState: FilterState;
  showFilters: boolean;
  filteredSchools: School[];
  filteredCrimes: Crime[];
  filteredSafetyScores: SafetyScore[];
  filteredAreas: Area[];
  availableCrimeCategories: string[];
  searchSuggestions: string[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  showStatistics: boolean;
  statisticsData: StatisticsData | null;
  crimeChartRef: React.RefObject<HTMLCanvasElement>;
  safetyChartRef: React.RefObject<HTMLCanvasElement>;
  schoolTypeChartRef: React.RefObject<HTMLCanvasElement>;
  mapSettings: MapControlSettings;
  showComparison: boolean;
  comparisonData: AreaComparisonData[];
  showTimeSeries: boolean;
  showRouteSearch: boolean;
  map: any;
  onLayerToggle: (layer: keyof LayerState) => void;
  onBoundariesToggle: () => void;
  onToggleFilters: () => void;
  onSearchChange: (searchTerm: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onSchoolTypeToggle: (type: School['type']) => void;
  onCrimeCategoryToggle: (category: string) => void;
  onSafetyScoreRangeChange: (range: [number, number]) => void;
  onPublicPrivateToggle: (type: 'public' | 'private') => void;
  onClearFilters: () => void;
  onToggleStatistics: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onAreaClick: (area: Area) => void;
  onMapSettingsChange: (settings: MapControlSettings) => void;
  onZoomToFit: () => void;
  onResetView: () => void;
  onToggleComparison: () => void;
  onExportComparisonCSV: (selectedAreas: AreaComparisonData[]) => void;
  onToggleTimeSeries: () => void;
  onToggleRouteSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  loading,
  schools,
  crimes,
  calculatedSafetyScores,
  selectedArea,
  layerState,
  showBoundaries,
  filterState,
  showFilters,
  filteredSchools,
  filteredCrimes,
  filteredSafetyScores,
  filteredAreas,
  availableCrimeCategories,
  searchSuggestions,
  showSuggestions,
  selectedSuggestionIndex,
  showStatistics,
  statisticsData,
  crimeChartRef,
  safetyChartRef,
  schoolTypeChartRef,
  mapSettings,
  showComparison,
  comparisonData,
  showTimeSeries,
  showRouteSearch,
  map,
  onLayerToggle,
  onBoundariesToggle,
  onToggleFilters,
  onSearchChange,
  onSearchKeyDown,
  onSearchFocus,
  onSearchBlur,
  onSuggestionClick,
  onSchoolTypeToggle,
  onCrimeCategoryToggle,
  onSafetyScoreRangeChange,
  onPublicPrivateToggle,
  onClearFilters,
  onToggleStatistics,
  onExportCSV,
  onExportPDF,
  onAreaClick,
  onMapSettingsChange,
  onZoomToFit,
  onResetView,
  onToggleComparison,
  onExportComparisonCSV,
  onToggleTimeSeries,
  onToggleRouteSearch
}) => {
  return (
    <div className="sidebar">
      <h1 style={{color: '#1890ff', marginTop: 0, fontSize: '24px'}}>{LABELS.UI.APP_TITLE}</h1>
      <h2 style={{color: '#666', fontSize: '14px', marginTop: 0}}>{LABELS.UI.APP_SUBTITLE}</h2>

      {loading && <div className="loading">{LABELS.UI.LOADING}</div>}
      {!loading && schools.length > 0 && crimes.length > 0 && calculatedSafetyScores.length === 0 && (
        <div className="loading" style={{background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591', padding: '10px', borderRadius: '4px', fontSize: '12px'}}>
          Calculating safety scores...
        </div>
      )}

      <LayerControls
        layerState={layerState}
        showBoundaries={showBoundaries}
        filteredSchools={filteredSchools.length}
        filteredCrimes={filteredCrimes.length}
        onLayerToggle={onLayerToggle}
        onBoundariesToggle={onBoundariesToggle}
      />

      <EnhancedMapControls
        settings={mapSettings}
        onSettingsChange={onMapSettingsChange}
        onZoomToFit={onZoomToFit}
        onResetView={onResetView}
      />

      <SearchFilters
        filterState={filterState}
        showFilters={showFilters}
        filteredSchools={filteredSchools.length}
        filteredCrimes={filteredCrimes.length}
        searchSuggestions={searchSuggestions}
        showSuggestions={showSuggestions}
        selectedSuggestionIndex={selectedSuggestionIndex}
        availableCrimeCategories={availableCrimeCategories}
        onToggleFilters={onToggleFilters}
        onSearchChange={onSearchChange}
        onSearchKeyDown={onSearchKeyDown}
        onSearchFocus={onSearchFocus}
        onSearchBlur={onSearchBlur}
        onSuggestionClick={onSuggestionClick}
        onSchoolTypeToggle={onSchoolTypeToggle}
        onCrimeCategoryToggle={onCrimeCategoryToggle}
        onSafetyScoreRangeChange={onSafetyScoreRangeChange}
        onPublicPrivateToggle={onPublicPrivateToggle}
        onClearFilters={onClearFilters}
      />

      <button onClick={onToggleStatistics} className="toggle-statistics-btn" style={{marginTop: '10px', width: '100%'}}>
        {showStatistics ? LABELS.UI.HIDE_STATISTICS : LABELS.UI.SHOW_STATISTICS}
        {selectedArea && showStatistics && (
          <span className="auto-display-indicator" style={{fontSize: '10px', marginLeft: '6px', opacity: 0.7}}>(自動表示)</span>
        )}
      </button>

      <button 
        onClick={onToggleComparison} 
        className="toggle-comparison-btn" 
        style={{marginTop: '10px', width: '100%'}}
      >
        {showComparison ? 'Hide Comparison' : 'Show Area Comparison'}
        {comparisonData.length > 0 && (
          <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.8}}>({comparisonData.length} areas)</span>
        )}
      </button>

      <button 
        onClick={onToggleTimeSeries} 
        className="toggle-timeseries-btn" 
        style={{marginTop: '10px', width: '100%'}}
      >
        {showTimeSeries ? 'Hide Time Series' : 'Show Time Series Analysis'}
        {filteredCrimes.length > 0 && (
          <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.8}}>({filteredCrimes.length} crimes)</span>
        )}
      </button>

      <button 
        onClick={onToggleRouteSearch} 
        className="toggle-route-btn" 
        style={{marginTop: '10px', width: '100%'}}
      >
        {showRouteSearch ? 'Hide Route Search' : 'Safe Route Search'}
        {schools.length > 0 && (
          <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.8}}>({schools.length} schools)</span>
        )}
      </button>

      {showStatistics && statisticsData && (
        <StatisticsDashboard
          statisticsData={statisticsData}
          selectedArea={selectedArea}
          crimeChartRef={crimeChartRef}
          safetyChartRef={safetyChartRef}
          schoolTypeChartRef={schoolTypeChartRef}
          onExportCSV={onExportCSV}
          onExportPDF={onExportPDF}
        />
      )}

      {showComparison && comparisonData.length > 0 && (
        <AreaComparison
          areas={comparisonData}
          onExportCSV={onExportComparisonCSV}
          maxAreasToCompare={4}
        />
      )}

      {showTimeSeries && filteredCrimes.length > 0 && (
        <TimeSeriesAnalysis
          crimes={filteredCrimes}
          areaName={selectedArea?.name}
        />
      )}

      {showRouteSearch && map && L && (
        <SafeRouteSearch
          schools={filteredSchools}
          crimes={filteredCrimes}
          map={map}
          L={L}
        />
      )}

      <AreasList
        areas={filteredAreas}
        selectedArea={selectedArea}
        onAreaClick={onAreaClick}
      />

      {selectedArea && (
        <SelectedAreaInfo
          selectedArea={selectedArea}
          filteredSchools={filteredSchools}
          filteredCrimes={filteredCrimes.length}
          calculatedSafetyScores={calculatedSafetyScores}
          schools={schools}
        />
      )}
    </div>
  );
};
