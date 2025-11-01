import React, { useState, useEffect, useCallback } from 'react';
import type { Area, LayerState, MapControlSettings, AreaComparisonData } from './types';
import { MAP_CONFIG } from './constants';
import { 
  useMap, 
  useDataFetch, 
  useSafetyScores, 
  useFilters, 
  useCharts,
  useMapDisplay,
  useGeoJSON
} from './hooks';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { AppStyles } from './components/Styles';
import { generateCSVData, generatePDFReport, downloadCSV } from './utils/export';
import { generateAreaComparisonData, downloadAreaComparisonCSV } from './utils/areaComparison';

declare const L: any;

const App: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showTimeSeries, setShowTimeSeries] = useState<boolean>(false);
  const [showRouteSearch, setShowRouteSearch] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<AreaComparisonData[]>([]);

  const [layerState, setLayerState] = useState<LayerState>({
    showSchools: true,
    showCrimes: true,
    showSafetyScores: false,
    showHeatmap: false
  });

  const [mapSettings, setMapSettings] = useState<MapControlSettings>({
    show_area_boundaries: false,
    show_school_labels: false,
    show_crime_heatmap: false,
    show_safety_zones: true,
    cluster_markers: true,
    map_mode: 'standard',
    animation_enabled: true
  });

  const mapHook = useMap();
  const dataFetch = useDataFetch();
  const safetyScores = useSafetyScores(dataFetch.schools, dataFetch.crimes);
  const filters = useFilters(
    dataFetch.areas,
    dataFetch.schools,
    dataFetch.crimes,
    dataFetch.safetyScores
  );
  const charts = useCharts(showStatistics, filters.statisticsData);

  const mapDisplay = useMapDisplay({
    map: mapHook.map,
    layerState,
    filteredSchools: filters.filteredSchools,
    filteredCrimes: filters.filteredCrimes,
    filteredSafetyScores: filters.filteredSafetyScores,
    calculatedSafetyScores: safetyScores.calculatedSafetyScores,
    schoolMarkers: mapHook.schoolMarkers,
    crimeMarkers: mapHook.crimeMarkers,
    safetyCircles: mapHook.safetyCircles,
    heatmapLayer: mapHook.heatmapLayer,
    setSchoolMarkers: mapHook.setSchoolMarkers,
    setCrimeMarkers: mapHook.setCrimeMarkers,
    setSafetyCircles: mapHook.setSafetyCircles,
    setHeatmapLayer: mapHook.setHeatmapLayer
  });

  const handleAreaSelect = useCallback((area: Area): void => {
    setSelectedArea(area);
    setShowStatistics(true);
    dataFetch.loadAreaData(area.ward_code, area.town_code);
  }, [dataFetch]);

  useGeoJSON({
    map: mapHook.map,
    showBoundaries,
    areas: dataFetch.areas,
    schools: dataFetch.schools,
    crimes: dataFetch.crimes,
    calculatedSafetyScores: safetyScores.calculatedSafetyScores,
    onAreaSelect: handleAreaSelect
  });

  useEffect(() => {
    if (typeof L !== 'undefined' && typeof (window as any).L?.heatLayer !== 'undefined') {
      if (!mapHook.map) {
        mapHook.initializeMap();
      }
      dataFetch.checkApiHealth();
      dataFetch.loadAreas();
    } else {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    mapDisplay.displayDataOnMap();
  }, [mapDisplay.displayDataOnMap]);

  useEffect(() => {
    if (mapHook.map) {
      mapHook.changeTileLayer(mapSettings.map_mode, mapSettings.animation_enabled);
    }
  }, [mapSettings.map_mode, mapSettings.animation_enabled, mapHook.map]);

  useEffect(() => {
    if (dataFetch.areas.length > 0 && dataFetch.schools.length > 0) {
      const comparison = generateAreaComparisonData(
        dataFetch.areas,
        dataFetch.schools,
        dataFetch.crimes,
        safetyScores.calculatedSafetyScores
      );
      setComparisonData(comparison);
      console.log(`Generated comparison data for ${comparison.length} areas`);
    }
  }, [dataFetch.areas, dataFetch.schools, dataFetch.crimes, safetyScores.calculatedSafetyScores]);

  const handleLayerToggle = (layer: keyof LayerState) => {
    setLayerState(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleAreaClick = useCallback((area: Area): void => {
    handleAreaSelect(area);
  }, [handleAreaSelect]);

  const handleToggleStatistics = () => {
    setShowStatistics(prev => !prev);
  };

  const handleExportCSV = () => {
    const csvContent = generateCSVData(
      filters.filteredSchools, 
      filters.filteredCrimes, 
      filters.filteredSafetyScores
    );
    downloadCSV(csvContent);
  };

  const handleExportPDF = () => {
    if (filters.statisticsData) {
      generatePDFReport(filters.statisticsData, selectedArea?.name || '');
    }
  };

  const handleZoomToFit = () => {
    if (mapHook.map && (filters.filteredSchools.length > 0 || filters.filteredCrimes.length > 0)) {
      const allMarkers: any[] = [];
      filters.filteredSchools.forEach(school => {
        if (school.latitude && school.longitude) {
          allMarkers.push(L.marker([school.latitude, school.longitude]));
        }
      });
      filters.filteredCrimes.forEach(crime => {
        if (crime.latitude && crime.longitude) {
          allMarkers.push(L.marker([crime.latitude, crime.longitude]));
        }
      });
      if (allMarkers.length > 0) {
        const group = L.featureGroup(allMarkers);
        mapHook.map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  };

  const handleResetView = () => {
    if (mapHook.map) {
      mapHook.map.setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);
    }
  };

  const handleToggleComparison = () => {
    setShowComparison(prev => !prev);
  };

  const handleExportComparisonCSV = (selectedAreas: AreaComparisonData[]) => {
    downloadAreaComparisonCSV(selectedAreas);
    console.log(`Exported comparison data for ${selectedAreas.length} areas`);
  };

  const handleToggleTimeSeries = () => {
    setShowTimeSeries(prev => !prev);
  };

  const handleToggleRouteSearch = () => {
    setShowRouteSearch(prev => !prev);
  };

  return (
    <>
      <AppStyles />
      <div className="app">
        <Sidebar
          loading={dataFetch.loading}
          schools={dataFetch.schools}
          crimes={dataFetch.crimes}
          calculatedSafetyScores={safetyScores.calculatedSafetyScores}
          selectedArea={selectedArea}
          layerState={layerState}
          showBoundaries={showBoundaries}
          filterState={filters.filterState}
          showFilters={showFilters}
          filteredSchools={filters.filteredSchools}
          filteredCrimes={filters.filteredCrimes}
          filteredAreas={filters.filteredAreas}
          availableCrimeCategories={filters.availableCrimeCategories}
          searchSuggestions={filters.searchSuggestions}
          showSuggestions={filters.showSuggestions}
          selectedSuggestionIndex={filters.selectedSuggestionIndex}
          showStatistics={showStatistics}
          statisticsData={filters.statisticsData}
          crimeChartRef={charts.crimeChartRef}
          safetyChartRef={charts.safetyChartRef}
          schoolTypeChartRef={charts.schoolTypeChartRef}
          mapSettings={mapSettings}
          showComparison={showComparison}
          comparisonData={comparisonData}
          showTimeSeries={showTimeSeries}
          showRouteSearch={showRouteSearch}
          map={mapHook.map}
          onLayerToggle={handleLayerToggle}
          onBoundariesToggle={() => setShowBoundaries(prev => !prev)}
          onToggleFilters={() => setShowFilters(prev => !prev)}
          onSearchChange={filters.handleSearchChange}
          onSearchKeyDown={filters.handleSearchKeyDown}
          onSearchFocus={filters.handleSearchFocus}
          onSearchBlur={filters.handleSearchBlur}
          onSuggestionClick={filters.handleSuggestionClick}
          onSchoolTypeToggle={filters.handleSchoolTypeToggle}
          onCrimeCategoryToggle={filters.handleCrimeCategoryToggle}
          onSafetyScoreRangeChange={filters.handleSafetyScoreRangeChange}
          onPublicPrivateToggle={filters.handlePublicPrivateToggle}
          onClearFilters={filters.handleClearFilters}
          onToggleStatistics={handleToggleStatistics}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onAreaClick={handleAreaClick}
          onMapSettingsChange={setMapSettings}
          onZoomToFit={handleZoomToFit}
          onResetView={handleResetView}
          onToggleComparison={handleToggleComparison}
          onExportComparisonCSV={handleExportComparisonCSV}
          onToggleTimeSeries={handleToggleTimeSeries}
          onToggleRouteSearch={handleToggleRouteSearch}
        />
        <MapContainer />
      </div>
    </>
  );
};

export default App;
