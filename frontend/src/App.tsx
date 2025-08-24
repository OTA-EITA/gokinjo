import React, { useState, useEffect } from 'react';
import {
  Area, School, Crime, SafetyScore, LayerState, FilterState, StatisticsData
} from '@/types';
import {
  API_CONFIG, MAP_CONFIG, HEATMAP_CONFIG, ICON_CONFIG, SAFETY_CONFIG, UI_CONFIG, LABELS
} from '@/constants';
import {
  getSchoolIcon, getCrimeIcon, getSafetyScoreColor, getSafetyLevelLabel,
  getSchoolTypeLabel, getPublicPrivateLabel, buildApiUrl, safeFetch,
  prepareHeatmapData, getAvailableCrimeCategories
} from '@/utils/helpers';
import {
  filterAreas, filterSchools, filterCrimes, filterSafetyScores
} from '@/utils/filters';
import { calculateStatistics } from '@/utils/statistics';
import {
  createOrUpdateChart, getCrimeChartConfig, getSafetyChartConfig, getSchoolTypeChartConfig
} from '@/utils/charts';
import { generateCSVData, generatePDFReport, downloadCSV } from '@/utils/export';

// Leafletはグローバルに読み込み済み
declare const L: any;

const App: React.FC = () => {
  // ========== 状態管理 ==========
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [safetyScores, setSafetyScores] = useState<SafetyScore[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [map, setMap] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // レイヤー制御状態
  const [layerState, setLayerState] = useState<LayerState>({
    showSchools: true,
    showCrimes: true,
    showSafetyScores: false,
    showHeatmap: false
  });

  // フィルタ状態管理
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    selectedSchoolTypes: [],
    selectedCrimeCategories: [],
    safetyScoreRange: [0, 100],
    showPublicOnly: false,
    showPrivateOnly: false
  });

  // フィルタ適用後のデータ
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [filteredCrimes, setFilteredCrimes] = useState<Crime[]>([]);
  const [filteredSafetyScores, setFilteredSafetyScores] = useState<SafetyScore[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [availableCrimeCategories, setAvailableCrimeCategories] = useState<string[]>([]);

  // 統計ダッシュボード状態
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [chartInstances, setChartInstances] = useState<Record<string, any>>({});

  // マーカーグループ
  const [schoolMarkers, setSchoolMarkers] = useState<any | null>(null);
  const [crimeMarkers, setCrimeMarkers] = useState<any | null>(null);
  const [safetyCircles, setSafetyCircles] = useState<any | null>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);

  // ========== Effect フック ==========
  useEffect(() => {
    // Leafletとプラグインが読み込まれてから初期化
    if (typeof L !== 'undefined' && typeof (window as any).L?.heatLayer !== 'undefined') {
      if (!map) {
        initializeMap();
      }
      loadAreas();
    } else {
      // ライブラリの読み込みを待つ
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    displayDataOnMap();
  }, [filteredSchools, filteredCrimes, filteredSafetyScores, layerState, map]);

  // フィルタ適用処理
  useEffect(() => {
    // エリアフィルタ
    const newFilteredAreas = filterAreas(areas, filterState.searchTerm);
    setFilteredAreas(newFilteredAreas);

    // 学校フィルタ
    const newFilteredSchools = filterSchools(schools, filterState);
    setFilteredSchools(newFilteredSchools);

    // 犯罪フィルタ
    const newFilteredCrimes = filterCrimes(crimes, filterState);
    setFilteredCrimes(newFilteredCrimes);
    
    // 犯罪種別リスト更新
    setAvailableCrimeCategories(getAvailableCrimeCategories(crimes));

    // 安全スコアフィルタ
    const newFilteredSafetyScores = filterSafetyScores(safetyScores, filterState);
    setFilteredSafetyScores(newFilteredSafetyScores);
    
    // 統計データ更新
    const newStatistics = calculateStatistics(newFilteredSchools, newFilteredCrimes, newFilteredSafetyScores);
    setStatisticsData(newStatistics);
  }, [areas, schools, crimes, safetyScores, filterState]);

  // ========== コア機能 ==========
  
  /**
   * 地図を初期化
   */
  const initializeMap = (): void => {
    try {
      // 既にマップが初期化されている場合はスキップ
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }
      
      // コンテナに既存のマップがあるかチェック
      if ((mapContainer as any)._leaflet_id) {
        console.log('Map already initialized, skipping...');
        return;
      }

      const mapInstance = L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

      L.tileLayer(MAP_CONFIG.TILE_LAYER.URL, {
        attribution: MAP_CONFIG.TILE_LAYER.ATTRIBUTION
      }).addTo(mapInstance);

      setMap(mapInstance);
      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  /**
   * エリアデータを読み込み
   */
  const loadAreas = async (): Promise<void> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AREAS}`;
      const data = await safeFetch(url);
      
      if (data) {
        setAreas(data.areas || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load areas:', error);
      setLoading(false);
    }
  };

  /**
   * 選択されたエリアのデータを読み込み
   */
  const loadAreaData = async (wardCode: string, townCode: string): Promise<void> => {
    try {
      setLoading(true);

      // Load schools
      const schoolsUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SCHOOLS, { ward_code: wardCode, town_code: townCode })}`;
      const schoolsData = await safeFetch(schoolsUrl);
      if (schoolsData) {
        setSchools(schoolsData.schools || []);
      }

      // Load crimes  
      const crimesUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.CRIMES, { ward_code: wardCode, town_code: townCode })}`;
      const crimesData = await safeFetch(crimesUrl);
      if (crimesData) {
        setCrimes(crimesData.crimes || []);
      }

      // Load safety scores
      const safetyUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SAFETY_SCORES, { ward_code: wardCode, town_code: townCode })}`;
      const safetyData = await safeFetch(safetyUrl);
      if (safetyData) {
        setSafetyScores(safetyData.safety_scores || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load area data:', error);
      setLoading(false);
    }
  };

  /**
   * 地図上にデータを表示
   */
  const displayDataOnMap = (): void => {
    if (!map) return;

    // Clear existing markers
    [schoolMarkers, crimeMarkers, safetyCircles, heatmapLayer].forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setSchoolMarkers(null);
    setCrimeMarkers(null);
    setSafetyCircles(null);
    setHeatmapLayer(null);

    // School markers
    if (layerState.showSchools && filteredSchools.length > 0) {
      const schoolMarkersGroup = L.layerGroup();

      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          const safetyScore = filteredSafetyScores.find((s: SafetyScore) => s.school_id === school.id);
          const scoreText = safetyScore ?
            `<br/><strong>安全スコア: ${safetyScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(safetyScore.score_level)})` : '';

          const icon = L.icon({
            iconUrl: getSchoolIcon(school),
            iconSize: ICON_CONFIG.SIZES.SCHOOL,
            iconAnchor: ICON_CONFIG.SIZES.ANCHOR_SCHOOL,
            popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR
          });

          const marker = L.marker([school.latitude, school.longitude], { icon })
            .bindPopup(`
              <div>
                <strong>${school.name}</strong><br/>
                種別: ${getSchoolTypeLabel(school.type)}<br/>
                ${getPublicPrivateLabel(school.public_private)}<br/>
                住所: ${school.address}${scoreText}
              </div>
            `);

          schoolMarkersGroup.addLayer(marker);
        }
      });

      schoolMarkersGroup.addTo(map);
      setSchoolMarkers(schoolMarkersGroup);
    }

    // Crime markers
    if (layerState.showCrimes && filteredCrimes.length > 0) {
      const crimeMarkersGroup = L.layerGroup();

      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
          const icon = L.icon({
            iconUrl: getCrimeIcon(crime),
            iconSize: ICON_CONFIG.SIZES.CRIME,
            iconAnchor: ICON_CONFIG.SIZES.ANCHOR_CRIME,
            popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR_CRIME
          });

          const marker = L.marker([crime.latitude, crime.longitude], { icon })
            .bindPopup(`
              <div>
                <strong>${crime.category}</strong><br/>
                日付: ${crime.date}<br/>
                詳細: ${crime.description}
              </div>
            `);

          crimeMarkersGroup.addLayer(marker);
        }
      });

      crimeMarkersGroup.addTo(map);
      setCrimeMarkers(crimeMarkersGroup);
    }

    // Safety score circles
    if (layerState.showSafetyScores && filteredSafetyScores.length > 0) {
      const safetyCirclesGroup = L.layerGroup();

      filteredSafetyScores.forEach((score: SafetyScore) => {
        const school = filteredSchools.find((s: School) => s.id === score.school_id);
        if (school && school.latitude && school.longitude) {
          const circle = L.circle([school.latitude, school.longitude], {
            color: getSafetyScoreColor(score.score),
            fillColor: getSafetyScoreColor(score.score),
            fillOpacity: SAFETY_CONFIG.CIRCLE_STYLE.fillOpacity,
            weight: SAFETY_CONFIG.CIRCLE_STYLE.weight,
            radius: score.radius_meters
          }).bindPopup(`
            <div>
              <strong>${school.name}</strong><br/>
              安全スコア: ${score.score.toFixed(1)}<br/>
              周辺犯罪件数: ${score.crime_count}件<br/>
              調査範囲: 半径${score.radius_meters}m
            </div>
          `);

          safetyCirclesGroup.addLayer(circle);
        }
      });

      safetyCirclesGroup.addTo(map);
      setSafetyCircles(safetyCirclesGroup);
    }

    // Heatmap layer
    if (layerState.showHeatmap && filteredCrimes.length > 0) {
      const heatmapData = prepareHeatmapData(filteredCrimes);
      
      if (heatmapData.length > 0 && window.L && window.L.heatLayer) {
        const heatLayer = window.L.heatLayer(heatmapData, {
          radius: HEATMAP_CONFIG.RADIUS,
          blur: HEATMAP_CONFIG.BLUR,
          maxZoom: HEATMAP_CONFIG.MAX_ZOOM,
          max: HEATMAP_CONFIG.MAX_INTENSITY,
          gradient: HEATMAP_CONFIG.GRADIENT
        });
        
        heatLayer.addTo(map);
        setHeatmapLayer(heatLayer);
      } else {
        console.warn('ヒートマップライブラリが読み込まれていません');
      }
    }

    // Fit map to show all data
    const allMarkers: any[] = [];
    if (layerState.showSchools && filteredSchools.length > 0) {
      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          allMarkers.push(L.marker([school.latitude, school.longitude]));
        }
      });
    }
    if (layerState.showCrimes && filteredCrimes.length > 0) {
      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
          allMarkers.push(L.marker([crime.latitude, crime.longitude]));
        }
      });
    }

    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(MAP_CONFIG.FIT_BOUNDS_PADDING));
    }
  };

  // ========== イベントハンドラ ==========

  /**
   * エリアクリックハンドラ
   */
  const handleAreaClick = (area: Area): void => {
    setSelectedArea(area);
    loadAreaData(area.ward_code, area.town_code);
  };

  /**
   * レイヤー表示切替ハンドラ
   */
  const handleLayerToggle = (layer: keyof LayerState) => {
    setLayerState((prev: LayerState) => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // フィルタハンドラ関数
  const handleSearchChange = (searchTerm: string) => {
    setFilterState(prev => ({ ...prev, searchTerm }));
  };

  const handleSchoolTypeToggle = (type: School['type']) => {
    setFilterState(prev => ({
      ...prev,
      selectedSchoolTypes: prev.selectedSchoolTypes.includes(type)
        ? prev.selectedSchoolTypes.filter(t => t !== type)
        : [...prev.selectedSchoolTypes, type]
    }));
  };

  const handleCrimeCategoryToggle = (category: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedCrimeCategories: prev.selectedCrimeCategories.includes(category)
        ? prev.selectedCrimeCategories.filter(c => c !== category)
        : [...prev.selectedCrimeCategories, category]
    }));
  };

  const handleSafetyScoreRangeChange = (range: [number, number]) => {
    setFilterState(prev => ({ ...prev, safetyScoreRange: range }));
  };

  const handlePublicPrivateToggle = (type: 'public' | 'private') => {
    setFilterState(prev => ({
      ...prev,
      showPublicOnly: type === 'public' ? !prev.showPublicOnly : prev.showPublicOnly,
      showPrivateOnly: type === 'private' ? !prev.showPrivateOnly : prev.showPrivateOnly
    }));
  };

  const handleClearFilters = () => {
    setFilterState({
      searchTerm: '',
      selectedSchoolTypes: [],
      selectedCrimeCategories: [],
      safetyScoreRange: [0, 100],
      showPublicOnly: false,
      showPrivateOnly: false
    });
  };

  // 統計機能ハンドラ
  const handleToggleStatistics = () => {
    setShowStatistics(prev => !prev);
  };

  const handleExportCSV = () => {
    const csvContent = generateCSVData(filteredSchools, filteredCrimes, filteredSafetyScores);
    downloadCSV(csvContent);
  };

  const handleExportPDF = () => {
    if (statisticsData) {
      generatePDFReport(statisticsData, selectedArea?.name || '');
    }
  };

  const handleCreateChart = (canvasId: string, type: string, data: any, options: any) => {
    createOrUpdateChart(canvasId, type, data, options, chartInstances, setChartInstances);
  };

  // ========== レンダリング ==========
  return (
    <div className="app">
      <div className="sidebar">
        <h1 style={{color: '#1890ff', marginTop: 0, fontSize: '24px'}}>{LABELS.UI.APP_TITLE}</h1>
        <h2 style={{color: '#666', fontSize: '14px', marginTop: 0}}>{LABELS.UI.APP_SUBTITLE}</h2>

        {loading && <div className="loading">{LABELS.UI.LOADING}</div>}

        {/* Layer controls */}
        <div className="layer-controls">
          <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
            {LABELS.UI.LAYER_CONTROLS}
          </h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layerState.showSchools}
              onChange={() => handleLayerToggle('showSchools')}
            />
            {` ${LABELS.UI.SCHOOL_LAYER} (${filteredSchools.length}件)`}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layerState.showCrimes}
              onChange={() => handleLayerToggle('showCrimes')}
            />
            {` ${LABELS.UI.CRIME_LAYER} (${filteredCrimes.length}件)`}
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layerState.showSafetyScores}
              onChange={() => handleLayerToggle('showSafetyScores')}
            />
            {` ${LABELS.UI.SAFETY_RANGE_LAYER}`}
          </label>
          <label className="checkbox-label heatmap-label">
            <input
              type="checkbox"
              checked={layerState.showHeatmap}
              onChange={() => handleLayerToggle('showHeatmap')}
            />
            {` ${LABELS.UI.HEATMAP_LAYER} (🌡️ 犯罪密度)`}
          </label>
        </div>

        {/* Search and Filter controls */}
        <div className="search-filters">
          <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
            {LABELS.UI.SEARCH_FILTERS}
          </h3>
          
          {/* Search box */}
          <div className="search-box">
            <input
              type="text"
              placeholder={LABELS.UI.SEARCH_PLACEHOLDER}
              value={filterState.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* School type filter */}
          <div className="filter-group">
            <label className="filter-group-label">{LABELS.UI.SCHOOL_TYPE_FILTER}</label>
            <div className="filter-checkboxes">
              {(['elementary', 'junior_high', 'high'] as School['type'][]).map(type =>
                <label key={type} className="checkbox-label small">
                  <input
                    type="checkbox"
                    checked={filterState.selectedSchoolTypes.includes(type)}
                    onChange={() => handleSchoolTypeToggle(type)}
                  />
                  {` ${getSchoolTypeLabel(type)}`}
                </label>
              )}
            </div>
          </div>
          
          {/* Crime type filter */}
          {availableCrimeCategories.length > 0 && (
            <div className="filter-group">
              <label className="filter-group-label">{LABELS.UI.CRIME_TYPE_FILTER}</label>
              <div className="filter-checkboxes">
                {availableCrimeCategories.map(category =>
                  <label key={category} className="checkbox-label small">
                    <input
                      type="checkbox"
                      checked={filterState.selectedCrimeCategories.includes(category)}
                      onChange={() => handleCrimeCategoryToggle(category)}
                    />
                    {` ${category}`}
                  </label>
                )}
              </div>
            </div>
          )}
          
          {/* Public/Private filter */}
          <div className="filter-group">
            <label className="filter-group-label">{LABELS.UI.PUBLIC_PRIVATE_FILTER}</label>
            <div className="filter-checkboxes">
              <label className="checkbox-label small">
                <input
                  type="checkbox"
                  checked={filterState.showPublicOnly}
                  onChange={() => handlePublicPrivateToggle('public')}
                />
                {` 公立のみ`}
              </label>
              <label className="checkbox-label small">
                <input
                  type="checkbox"
                  checked={filterState.showPrivateOnly}
                  onChange={() => handlePublicPrivateToggle('private')}
                />
                {` 私立のみ`}
              </label>
            </div>
          </div>
          
          {/* Safety score range slider */}
          <div className="filter-group">
            <label className="filter-group-label">
              {`${LABELS.UI.SAFETY_SCORE_FILTER}: ${filterState.safetyScoreRange[0]} - ${filterState.safetyScoreRange[1]}`}
            </label>
            <div className="range-sliders">
              <input
                type="range"
                min={0}
                max={100}
                value={filterState.safetyScoreRange[0]}
                onChange={(e) => handleSafetyScoreRangeChange([
                  parseInt(e.target.value), 
                  filterState.safetyScoreRange[1]
                ])}
                className="range-slider"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={filterState.safetyScoreRange[1]}
                onChange={(e) => handleSafetyScoreRangeChange([
                  filterState.safetyScoreRange[0],
                  parseInt(e.target.value)
                ])}
                className="range-slider"
              />
            </div>
          </div>
          
          {/* Clear filters button */}
          <button onClick={handleClearFilters} className="clear-filters-btn">
            {LABELS.UI.CLEAR_FILTERS}
          </button>
          
          {/* Results count display */}
          <div className="filter-results">
            {`${LABELS.UI.FILTERED_RESULTS}: 学校${filteredSchools.length}件 | 犯罪${filteredCrimes.length}件`}
          </div>
          
          {/* Statistics toggle button */}
          <button onClick={handleToggleStatistics} className="toggle-statistics-btn">
            {showStatistics ? LABELS.UI.HIDE_STATISTICS : LABELS.UI.SHOW_STATISTICS}
          </button>
        </div>

        {/* Statistics Dashboard */}
        {showStatistics && statisticsData && (
          <div className="statistics-dashboard">
            <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
              {LABELS.UI.STATISTICS_DASHBOARD}
            </h3>
            
            {/* Export buttons */}
            <div className="export-buttons">
              <button onClick={handleExportCSV} className="export-btn csv-btn">
                {LABELS.UI.EXPORT_CSV}
              </button>
              <button onClick={handleExportPDF} className="export-btn pdf-btn">
                {LABELS.UI.EXPORT_PDF}
              </button>
            </div>
            
            {/* Crime statistics chart */}
            {Object.keys(statisticsData.crimeByCategory).length > 0 && (
              <div className="chart-container">
                <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
                  {LABELS.UI.CRIME_BY_CATEGORY}
                </h4>
                <canvas 
                  id="crimeChart" 
                  className="chart-canvas"
                  ref={(canvas) => {
                    if (canvas && statisticsData) {
                      setTimeout(() => {
                        const config = getCrimeChartConfig(statisticsData.crimeByCategory);
                        handleCreateChart('crimeChart', config.type, config.data, config.options);
                      }, 100);
                    }
                  }}
                />
              </div>
            )}
            
            {/* Safety score distribution chart */}
            {Object.keys(statisticsData.safetyScoreDistribution).length > 0 && (
              <div className="chart-container">
                <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
                  {LABELS.UI.SAFETY_SCORE_DISTRIBUTION}
                </h4>
                <canvas 
                  id="safetyChart"
                  className="chart-canvas"
                  ref={(canvas) => {
                    if (canvas && statisticsData) {
                      setTimeout(() => {
                        const config = getSafetyChartConfig(statisticsData.safetyScoreDistribution);
                        handleCreateChart('safetyChart', config.type, config.data, config.options);
                      }, 200);
                    }
                  }}
                />
              </div>
            )}
            
            {/* School type chart */}
            {Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k] > 0) && (
              <div className="chart-container">
                <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
                  {LABELS.UI.SCHOOL_TYPE_STATS}
                </h4>
                <canvas 
                  id="schoolTypeChart"
                  className="chart-canvas"
                  ref={(canvas) => {
                    if (canvas && statisticsData) {
                      setTimeout(() => {
                        const config = getSchoolTypeChartConfig(statisticsData.schoolTypeDistribution, getSchoolTypeLabel);
                        handleCreateChart('schoolTypeChart', config.type, config.data, config.options);
                      }, 300);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Area selection */}
        <div className="areas-list">
          <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
            {LABELS.UI.AREA_SELECTION}
          </h3>
          {filteredAreas.map((area: Area) =>
            <div
              key={area.id}
              className={`area-item ${selectedArea?.id === area.id ? 'selected' : ''}`}
              onClick={() => handleAreaClick(area)}
            >
              <strong>{area.name}</strong>
              <br />
              <small>Ward: {area.ward_code}, Town: {area.town_code}</small>
            </div>
          )}
        </div>

        {/* Selected area info */}
        {selectedArea && (
          <div className="selected-area">
            <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
              {`${LABELS.UI.SELECTED_PREFIX}${selectedArea.name}`}
            </h3>
            <p>学校: {filteredSchools.length}件 | 犯罪: {filteredCrimes.length}件</p>
          </div>
        )}
      </div>

      <div id="map" className="map" />

      <style>{`
        .app {
          display: flex;
          height: 100vh;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .sidebar {
          width: ${UI_CONFIG.SIDEBAR_WIDTH}px;
          padding: 20px;
          background-color: #f8f9fa;
          overflow-y: auto;
          border-right: 1px solid #dee2e6;
        }
        .map {
          flex: 1;
          height: 100vh;
        }
        .loading {
          text-align: center;
          padding: 20px;
          color: #6c757d;
        }
        .layer-controls, .search-filters, .statistics-dashboard, .areas-list {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          border: 1px solid #dee2e6;
        }
        .checkbox-label {
          display: block;
          margin: 8px 0;
          cursor: pointer;
          font-size: 14px;
        }
        .checkbox-label input {
          margin-right: 8px;
        }
        .checkbox-label.small {
          font-size: 12px;
          margin: 4px 0;
        }
        .heatmap-label {
          background: linear-gradient(90deg, #0066ff, #00ffff, #00ff00, #ffff00, #ff9900, #ff0000);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: bold;
          border: 1px solid #ff6b6b;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 4px 0;
        }
        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .filter-group {
          margin: 15px 0;
        }
        .filter-group-label {
          display: block;
          font-weight: bold;
          color: #555;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .filter-checkboxes {
          margin-left: 10px;
        }
        .range-sliders {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .range-slider {
          flex: 1;
        }
        .clear-filters-btn, .toggle-statistics-btn, .export-btn {
          background: #1890ff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 5px 0;
        }
        .clear-filters-btn:hover, .toggle-statistics-btn:hover, .export-btn:hover {
          background: #40a9ff;
        }
        .filter-results {
          font-size: 12px;
          color: #666;
          margin: 10px 0;
        }
        .export-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        .csv-btn {
          background: #52c41a;
        }
        .csv-btn:hover {
          background: #73d13d;
        }
        .pdf-btn {
          background: #ff4d4f;
        }
        .pdf-btn:hover {
          background: #ff7875;
        }
        .chart-container {
          margin: 20px 0;
          background: #fafafa;
          padding: 15px;
          border-radius: 6px;
        }
        .chart-canvas {
          max-width: 100%;
          max-height: 300px;
        }
        .area-item {
          padding: 12px;
          margin: 8px 0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
        }
        .area-item:hover {
          background: #e7f3ff;
          border-color: #1890ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .area-item.selected {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }
        .selected-area {
          margin-top: 20px;
          padding: 15px;
          background: #e7f3ff;
          border-radius: 6px;
          border: 1px solid #1890ff;
        }
      `}</style>
    </div>
  );
};

export default App;
