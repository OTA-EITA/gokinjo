import React, { useState, useEffect, useRef } from 'react';
import {
  Area, School, Crime, SafetyScore, LayerState, FilterState, StatisticsData, MapControlSettings
} from './types';
import {
  API_CONFIG, MAP_CONFIG, HEATMAP_CONFIG, ICON_CONFIG, SAFETY_CONFIG, UI_CONFIG, LABELS
} from './constants';
import {
  getSchoolIcon, getCrimeIcon, getSafetyScoreColor, getSafetyLevelLabel,
  getSchoolTypeLabel, getPublicPrivateLabel, buildApiUrl, safeFetch,
  prepareHeatmapData, getAvailableCrimeCategories
} from './utils/helpers';
import { SafetyScoreCalculator } from './utils/SafetyScoreCalculator';
import type { SafetyScoreResult } from './types';
import {
  filterAreas, filterSchools, filterCrimes, filterSafetyScores
} from './utils/filters';
import { calculateStatistics } from './utils/statistics';
import {
  createOrUpdateChart, getCrimeChartConfig, getSafetyChartConfig, getSchoolTypeChartConfig
} from './utils/charts';
import { generateCSVData, generatePDFReport, downloadCSV } from './utils/export';
import EnhancedMapControls from './components/EnhancedMapControls';
import AreaComparison from './components/AreaComparison';
import TimeSeriesAnalysis from './components/TimeSeriesAnalysis';
import { generateAreaComparisonData, downloadAreaComparisonCSV } from './utils/areaComparison';
import { loadGeoJSON, createGeoJSONLayer, highlightArea, fitToAreaBounds, createAreaStatsOverlay } from './utils/geojson';
import type { AreaComparisonData } from './types';
import type { GeoJSONFeatureCollection } from './utils/geojson';

// Leafletはグローバルに読み込み済み
declare const L: any;

const App: React.FC = () => {
  // ========== 状態管理 ==========
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [safetyScores, setSafetyScores] = useState<SafetyScore[]>([]);
  const [calculatedSafetyScores, setCalculatedSafetyScores] = useState<SafetyScoreResult[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [safetyCalculator] = useState(() => new SafetyScoreCalculator());
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

  // フィルタ表示状態管理
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);

  // 統計ダッシュボード状態
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [chartInstances, setChartInstances] = useState<Record<string, any>>({});
  const [, setChartsInitialized] = useState<boolean>(false);

  // Chart.js 初期化用 refs
  const crimeChartRef = useRef<HTMLCanvasElement>(null);
  const safetyChartRef = useRef<HTMLCanvasElement>(null);
  const schoolTypeChartRef = useRef<HTMLCanvasElement>(null);

  // マーカーグループ
  const [schoolMarkers, setSchoolMarkers] = useState<any | null>(null);
  const [crimeMarkers, setCrimeMarkers] = useState<any | null>(null);
  const [safetyCircles, setSafetyCircles] = useState<any | null>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);
  const [currentTileLayer, setCurrentTileLayer] = useState<any | null>(null);

  // Map Control Settings
  const [mapSettings, setMapSettings] = useState<MapControlSettings>({
    show_area_boundaries: false,
    show_school_labels: false,
    show_crime_heatmap: false,
    show_safety_zones: true,
    cluster_markers: true,
    map_mode: 'standard',
    animation_enabled: true
  });

  // Area Comparison
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<AreaComparisonData[]>([]);

  // Time Series Analysis
  const [showTimeSeries, setShowTimeSeries] = useState<boolean>(false);

  // GeoJSON Boundaries
  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [geojsonLayer, setGeojsonLayer] = useState<any | null>(null);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);

  // Generate comparison data when data changes
  useEffect(() => {
    if (areas.length > 0 && schools.length > 0) {
      const comparison = generateAreaComparisonData(
        areas,
        schools,
        crimes,
        calculatedSafetyScores
      );
      setComparisonData(comparison);
      console.log(`Generated comparison data for ${comparison.length} areas`);
    }
  }, [areas, schools, crimes, calculatedSafetyScores]);

  // Load GeoJSON boundaries
  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        const data = await loadGeoJSON('/geojson/tokyo_wards.geojson');
        setGeojsonData(data);
        console.log(`Loaded GeoJSON with ${data.features.length} wards`);
      } catch (error) {
        console.error('Failed to load GeoJSON:', error);
      }
    };

    loadBoundaries();
  }, []);

  // Manage GeoJSON layer on map
  useEffect(() => {
    if (!map || !geojsonData) return;

    // Remove existing GeoJSON layer
    if (geojsonLayer && map.hasLayer(geojsonLayer)) {
      map.removeLayer(geojsonLayer);
    }

    // Add GeoJSON layer if boundaries are enabled
    if (showBoundaries) {
      const layer = createGeoJSONLayer(L, geojsonData, {
        onEachFeature: (feature, layer) => {
          // Custom click handler
          layer.on('click', (e: any) => {
            const wardCode = feature.properties.ward_code;
            const area = areas.find(a => a.ward_code === wardCode);
            if (area) {
              handleAreaClick(area);
              fitToAreaBounds(map, layer);
            }
          });

          // Hover effect
          layer.on('mouseover', (e: any) => {
            highlightArea(e.target, true);
            
            // Show stats overlay
            const wardCode = feature.properties.ward_code;
            const areaSchools = schools.filter(s => {
              const schoolArea = areas.find(a => a.id === s.area_id);
              return schoolArea?.ward_code === wardCode;
            });
            const areaCrimes = crimes.filter(c => {
              const crimeArea = areas.find(a => a.id === c.area_id);
              return crimeArea?.ward_code === wardCode;
            });
            const avgScore = calculatedSafetyScores.length > 0
              ? calculatedSafetyScores
                  .filter(s => areaSchools.some(as => as.id === s.school_id))
                  .reduce((sum, s) => sum + s.score, 0) / Math.max(1, calculatedSafetyScores.filter(s => areaSchools.some(as => as.id === s.school_id)).length)
              : 75;

            const overlay = createAreaStatsOverlay(
              feature.properties.ward_name,
              {
                schools: areaSchools.length,
                crimes: areaCrimes.length,
                safetyScore: avgScore
              }
            );
            e.target.bindPopup(overlay).openPopup();
          });

          layer.on('mouseout', (e: any) => {
            highlightArea(e.target, false);
          });
        }
      });

      layer.addTo(map);
      setGeojsonLayer(layer);
      console.log('GeoJSON boundaries added to map');
    } else {
      setGeojsonLayer(null);
    }
  }, [map, geojsonData, showBoundaries, areas, schools, crimes, calculatedSafetyScores]);

  // ========== Effect フック ==========
  useEffect(() => {
    // Leafletとプラグインが読み込まれてから初期化
    if (typeof L !== 'undefined' && typeof (window as any).L?.heatLayer !== 'undefined') {
      if (!map) {
        initializeMap();
      }
      // APIヘルスチェック
      checkApiHealth();
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

  // Auto-calculate safety scores when schools and crimes are loaded
  useEffect(() => {
    if (schools.length > 0 && crimes.length > 0 && safetyCalculator) {
      console.log(`Calculating safety scores for ${schools.length} schools...`);
      try {
        const scores = safetyCalculator.calculateBatchScores(schools, crimes);
        setCalculatedSafetyScores(scores);
        console.log(`Safety scores calculated: ${scores.length} results`);
      } catch (error) {
        console.error('Failed to calculate safety scores:', error);
      }
    } else {
      setCalculatedSafetyScores([]);
    }
  }, [schools, crimes, safetyCalculator]);

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
    
    // 統計が表示されている場合はチャートを再描画
    if (showStatistics) {
      setChartsInitialized(false);
    }
  }, [areas, schools, crimes, safetyScores, filterState]);

  // Chart.js 安全初期化 - 統計データが更新されるたびに再初期化
  useEffect(() => {
    if (!showStatistics || !statisticsData) {
      setChartsInitialized(false);
      return;
    }

    // Chart.jsが読み込まれているか確認
    if (!(window as any).Chart) {
      console.warn('Chart.jsが読み込まれていません');
      return;
    }

    // 既存チャートを破棄
    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('チャート破棄エラー:', e);
        }
      }
    });
    setChartInstances({});
    setChartsInitialized(false);
    
    // 少し遅延してチャートを初期化
    const timer = setTimeout(() => {
      try {
        initializeCharts();
        setChartsInitialized(true);
      } catch (error) {
        console.error('Chart initialization failed:', error);
        setChartsInitialized(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [showStatistics, statisticsData]); // 依存配列をシンプルに

  // Map tile layer switching
  useEffect(() => {
    if (!map) return;

    // Remove current tile layer
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }

    // Add new tile layer based on map mode
    const tileConfig = MAP_CONFIG.TILE_LAYERS[mapSettings.map_mode];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18,
      fadeAnimation: mapSettings.animation_enabled
    });

    newTileLayer.addTo(map);
    setCurrentTileLayer(newTileLayer);

    console.log(`Map style changed to: ${mapSettings.map_mode}`);
  }, [map, mapSettings.map_mode, mapSettings.animation_enabled]);

  // ========== コア機能 ==========
  
  /**
   * APIヘルスチェック
   */
  const checkApiHealth = async (): Promise<void> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`;
      console.log('Checking API health:', url);
      const response = await fetch(url);
      if (response.ok) {
        console.log('API is healthy');
      } else {
        console.error(`API health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('API is not reachable:', error);
      console.error('Make sure backend is running: make start');
    }
  };
  
  /**
   * Chart.jsを安全に初期化
   */
  const initializeCharts = (): void => {
    if (!statisticsData) {
      console.log('No statistics data available for chart initialization');
      return;
    }

    try {
      // 犯罪統計チャート
      if (Object.keys(statisticsData.crimeByCategory).length > 0 && crimeChartRef.current) {
        const config = getCrimeChartConfig(statisticsData.crimeByCategory);
        createOrUpdateChart('crimeChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }

      // 安全スコアチャート
      if (Object.keys(statisticsData.safetyScoreDistribution).length > 0 && safetyChartRef.current) {
        const config = getSafetyChartConfig(statisticsData.safetyScoreDistribution);
        createOrUpdateChart('safetyChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }

      // 学校種別チャート
      if (Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && schoolTypeChartRef.current) {
        const config = getSchoolTypeChartConfig(statisticsData.schoolTypeDistribution, getSchoolTypeLabel);
        createOrUpdateChart('schoolTypeChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }
      
      console.log('✅ Charts initialized successfully');
    } catch (error) {
      console.error('チャート初期化エラー:', error);
    }
  };

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

      // Leafletが存在するか確認
      if (typeof L === 'undefined') {
        console.error('Leaflet is not loaded');
        return;
      }

      const mapInstance = L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

      // Initial tile layer (will be replaced by useEffect)
      const initialTileLayer = L.tileLayer(MAP_CONFIG.TILE_LAYERS.standard.url, {
        attribution: MAP_CONFIG.TILE_LAYERS.standard.attribution,
        maxZoom: 18
      });
      initialTileLayer.addTo(mapInstance);
      setCurrentTileLayer(initialTileLayer);

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
      console.log('Loading areas from:', url);
      const data = await safeFetch(url);
      
      console.log('Areas response:', data);
      
      if (data) {
        const areasData = data.areas || [];
        console.log(`Loaded ${areasData.length} areas:`, areasData);
        setAreas(areasData);
      } else {
        console.error('No data received from API');
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
      
      // データ読み込み完了後、統計ダッシュボードが表示されていることを再確認
      if (!showStatistics) {
        setShowStatistics(true);
      }
      
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

    // School markers with clustering
    if (layerState.showSchools && filteredSchools.length > 0) {
      const schoolMarkersGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: any) {
          const childCount = cluster.getChildCount();
          let className = 'marker-cluster marker-cluster-';
          if (childCount < 5) {
            className += 'small';
          } else if (childCount < 10) {
            className += 'medium';
          } else {
            className += 'large';
          }
          return L.divIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: className,
            iconSize: L.point(40, 40)
          });
        }
      });

      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          // Use calculated safety score (priority) or API safety score
          const calculatedScore = calculatedSafetyScores.find((s: SafetyScoreResult) => s.school_id === school.id);
          const apiScore = filteredSafetyScores.find((s: SafetyScore) => s.school_id === school.id);
          
          let scoreText = '';
          if (calculatedScore) {
            scoreText = `<br/><strong>安全スコア: ${calculatedScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(calculatedScore.score_level)})`
              + `<br/>周辺犯罪: ${calculatedScore.crime_count}件`
              + `<br/>犯罪密度: ${calculatedScore.crime_density.toFixed(2)}/km²`;
          } else if (apiScore) {
            scoreText = `<br/><strong>安全スコア: ${apiScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(apiScore.score_level)})`;
          }

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

    // Crime markers with clustering  
    if (layerState.showCrimes && filteredCrimes.length > 0) {
      const crimeMarkersGroup = L.markerClusterGroup({
        maxClusterRadius: 30,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: any) {
          const childCount = cluster.getChildCount();
          return L.divIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster marker-cluster-crime',
            iconSize: L.point(35, 35)
          });
        }
      });

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
    
    // 統計ダッシュボードを自動表示（データ読み込み前に表示開始）
    setShowStatistics(true);
    
    // チャートの再初期化フラグをリセット
    setChartsInitialized(false);
    
    // データ読み込み開始
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
  const generateSearchSuggestions = (searchTerm: string): string[] => {
    if (!searchTerm || searchTerm.length < 1) return [];
    
    const suggestions = new Set<string>();
    const term = searchTerm.toLowerCase();
    
    // エリア名から検索
    areas.forEach(area => {
      if (area.name.toLowerCase().includes(term)) {
        suggestions.add(area.name);
      }
    });
    
    // 学校名から検索
    schools.forEach(school => {
      if (school.name.toLowerCase().includes(term)) {
        suggestions.add(school.name);
      }
    });
    
    // 学校種別から検索
    const schoolTypes = ['elementary', 'junior_high', 'high'] as School['type'][];
    schoolTypes.forEach(type => {
      const label = getSchoolTypeLabel(type);
      if (label.toLowerCase().includes(term)) {
        suggestions.add(label);
      }
    });
    
    // 公立/私立から検索
    if ('公立'.includes(term) || 'public'.toLowerCase().includes(term)) {
      suggestions.add('公立');
    }
    if ('私立'.includes(term) || 'private'.toLowerCase().includes(term)) {
      suggestions.add('私立');
    }
    
    // 犯罪種別から検索
    availableCrimeCategories.forEach(category => {
      if (category.toLowerCase().includes(term)) {
        suggestions.add(category);
      }
    });
    
    return Array.from(suggestions).slice(0, 8); // 最大8件まで
  };

  const handleSearchChange = (searchTerm: string) => {
    setFilterState(prev => ({ ...prev, searchTerm }));
    setSelectedSuggestionIndex(-1); // リセット
    
    // オートコンプリートの更新
    if (searchTerm.length > 0) {
      const suggestions = generateSearchSuggestions(searchTerm);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilterState(prev => ({ ...prev, searchTerm: suggestion }));
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark key={index} className="highlight">{part}</mark>;
      }
      return part;
    });
  };

  const handleSearchBlur = () => {
    // 少し遅延させてクリックを可能にする
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSearchFocus = () => {
    if (filterState.searchTerm.length > 0 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
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

  // フィルタハンドラ
  const handleToggleFilters = () => {
    setShowFilters(prev => !prev);
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

  // Area comparison handlers
  const handleToggleComparison = () => {
    setShowComparison(prev => !prev);
  };

  const handleExportComparisonCSV = (selectedAreas: AreaComparisonData[]) => {
    downloadAreaComparisonCSV(selectedAreas);
    console.log(`Exported comparison data for ${selectedAreas.length} areas`);
  };

  // Time series analysis handler
  const handleToggleTimeSeries = () => {
    setShowTimeSeries(prev => !prev);
  };



  // ========== レンダリング ==========
  return (
    <div className="app">
      <div className="sidebar">
        <h1 style={{color: '#1890ff', marginTop: 0, fontSize: '24px'}}>{LABELS.UI.APP_TITLE}</h1>
        <h2 style={{color: '#666', fontSize: '14px', marginTop: 0}}>{LABELS.UI.APP_SUBTITLE}</h2>

        {loading && <div className="loading">{LABELS.UI.LOADING}</div>}
        {!loading && schools.length > 0 && crimes.length > 0 && calculatedSafetyScores.length === 0 && (
          <div className="loading" style={{background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591', padding: '10px', borderRadius: '4px', fontSize: '12px'}}>
            Calculating safety scores...
          </div>
        )}

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
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showBoundaries}
              onChange={() => setShowBoundaries(prev => !prev)}
            />
            {` 🗾 エリア境界表示`}
          </label>
        </div>

        {/* Enhanced Map Controls */}
        <EnhancedMapControls
          settings={mapSettings}
          onSettingsChange={setMapSettings}
          onZoomToFit={() => {
            if (map && (filteredSchools.length > 0 || filteredCrimes.length > 0)) {
              const allMarkers: any[] = [];
              filteredSchools.forEach(school => {
                if (school.latitude && school.longitude) {
                  allMarkers.push(L.marker([school.latitude, school.longitude]));
                }
              });
              filteredCrimes.forEach(crime => {
                if (crime.latitude && crime.longitude) {
                  allMarkers.push(L.marker([crime.latitude, crime.longitude]));
                }
              });
              if (allMarkers.length > 0) {
                const group = L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
              }
            }
          }}
          onResetView={() => {
            if (map) {
              map.setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);
            }
          }}
        />

        {/* Search and Filter controls */}
        <div className="search-filters">
          <div className="filter-header" onClick={handleToggleFilters}>
            <h3 style={{margin: 0, color: '#333', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              {LABELS.UI.SEARCH_FILTERS}
              <span className={`filter-toggle ${showFilters ? 'open' : ''}`}>▼</span>
            </h3>
            <div className="filter-summary" style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
              {`学校${filteredSchools.length}件 | 犯罪${filteredCrimes.length}件`}
              {filterState.searchTerm && ` | 検索: "${filterState.searchTerm}"`}
              {(filterState.selectedSchoolTypes.length > 0 || filterState.selectedCrimeCategories.length > 0 || 
                filterState.showPublicOnly || filterState.showPrivateOnly || 
                filterState.safetyScoreRange[0] > 0 || filterState.safetyScoreRange[1] < 100) && 
                <span style={{color: '#1890ff', fontWeight: 'bold'}}> (フィルタ適用中)</span>
              }
            </div>
          </div>
          
          {showFilters && (
            <div className="filter-content" style={{marginTop: '12px'}}>
              {/* Search box */}
              <div className="search-box">
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder={LABELS.UI.SEARCH_PLACEHOLDER}
                    value={filterState.searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="search-input"
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="search-suggestions">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`search-suggestion-item ${
                            index === selectedSuggestionIndex ? 'selected' : ''
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="suggestion-icon">🔍</span>
                          <span className="suggestion-text">
                            {highlightSearchTerm(suggestion, filterState.searchTerm)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            </div>
          )}
          
          {/* Statistics toggle button */}
          <button onClick={handleToggleStatistics} className="toggle-statistics-btn" style={{marginTop: '10px', width: '100%'}}>
            {showStatistics ? LABELS.UI.HIDE_STATISTICS : LABELS.UI.SHOW_STATISTICS}
            {selectedArea && showStatistics && (
              <span className="auto-display-indicator" style={{fontSize: '10px', marginLeft: '6px', opacity: 0.7}}>(自動表示)</span>
            )}
          </button>

          {/* Area Comparison toggle button */}
          <button 
            onClick={handleToggleComparison} 
            className="toggle-comparison-btn" 
            style={{marginTop: '10px', width: '100%'}}
          >
            {showComparison ? '📊 Hide Comparison' : '📊 Show Area Comparison'}
            {comparisonData.length > 0 && (
              <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.8}}>({comparisonData.length} areas)</span>
            )}
          </button>

          {/* Time Series Analysis toggle button */}
          <button 
            onClick={handleToggleTimeSeries} 
            className="toggle-timeseries-btn" 
            style={{marginTop: '10px', width: '100%'}}
          >
            {showTimeSeries ? '📈 Hide Time Series' : '📈 Show Time Series Analysis'}
            {filteredCrimes.length > 0 && (
              <span style={{fontSize: '10px', marginLeft: '6px', opacity: 0.8}}>({filteredCrimes.length} crimes)</span>
            )}
          </button>
        </div>

        {/* Statistics Dashboard */}
        {showStatistics && statisticsData && (
          <div className="statistics-dashboard">
            <div className="statistics-header">
              <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
                {LABELS.UI.STATISTICS_DASHBOARD}
                {selectedArea && (
                  <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '8px'}}>
                    - {selectedArea.name}
                  </span>
                )}
              </h3>
            </div>
            
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
                  ref={crimeChartRef}
                  className="chart-canvas"
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
                  ref={safetyChartRef}
                  className="chart-canvas"
                />
              </div>
            )}
            
            {/* School type chart */}
            {Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && (
              <div className="chart-container">
                <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
                  {LABELS.UI.SCHOOL_TYPE_STATS}
                </h4>
                <canvas 
                  id="schoolTypeChart"
                  ref={schoolTypeChartRef}
                  className="chart-canvas"
                />
              </div>
            )}
          </div>
        )}

        {/* Area Comparison Component */}
        {showComparison && comparisonData.length > 0 && (
          <AreaComparison
            areas={comparisonData}
            onExportCSV={handleExportComparisonCSV}
            maxAreasToCompare={4}
          />
        )}

        {/* Time Series Analysis Component */}
        {showTimeSeries && filteredCrimes.length > 0 && (
          <TimeSeriesAnalysis
            crimes={filteredCrimes}
            areaName={selectedArea?.name}
          />
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
            {calculatedSafetyScores.length > 0 && (
              <div style={{marginTop: '12px', padding: '10px', background: '#f0f7ff', borderRadius: '4px', border: '1px solid #bae7ff'}}>
                <h4 style={{margin: '0 0 8px 0', fontSize: '13px', color: '#1890ff'}}>
                  Safety Score Summary
                </h4>
                <div style={{fontSize: '12px', color: '#555'}}>
                  <div>計算済み: {calculatedSafetyScores.length} / {schools.length}校</div>
                  <div>平均スコア: {(calculatedSafetyScores.reduce((sum, s) => sum + s.score, 0) / calculatedSafetyScores.length).toFixed(1)}</div>
                  <div>総犯罪件数: {calculatedSafetyScores.reduce((sum, s) => sum + s.crime_count, 0)}件</div>
                  <div style={{marginTop: '6px'}}>
                    <span style={{color: '#52c41a', marginRight: '8px'}}>Very Safe: {calculatedSafetyScores.filter(s => s.score_level === 'very_safe').length}</span>
                    <span style={{color: '#73d13d', marginRight: '8px'}}>Safe: {calculatedSafetyScores.filter(s => s.score_level === 'safe').length}</span>
                  </div>
                  <div>
                    <span style={{color: '#faad14', marginRight: '8px'}}>Moderate: {calculatedSafetyScores.filter(s => s.score_level === 'moderate').length}</span>
                    <span style={{color: '#ff4d4f'}}>Caution: {calculatedSafetyScores.filter(s => s.score_level === 'caution').length}</span>
                  </div>
                </div>
              </div>
            )}
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
          position: relative;
          transition: opacity 0.3s ease-in-out;
        }
        .map.transitioning {
          opacity: 0.7;
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
        /* 検索オートコンプリートのスタイル */
        .search-input-container {
          position: relative;
        }
        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }
        .search-suggestion-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
        }
        .search-suggestion-item:last-child {
          border-bottom: none;
        }
        .search-suggestion-item:hover {
          background-color: #f8f9fa;
        }
        .search-suggestion-item:active {
          background-color: #e9ecef;
        }
        .search-suggestion-item.selected {
          background-color: #e7f3ff;
          border-left: 3px solid #1890ff;
        }
        .suggestion-icon {
          margin-right: 8px;
          opacity: 0.6;
          font-size: 12px;
        }
        .suggestion-text {
          font-size: 14px;
          color: #333;
        }
        /* ハイライトスタイル */
        .highlight {
          background-color: #fff3cd;
          color: #856404;
          font-weight: bold;
          border-radius: 2px;
          padding: 0 2px;
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
        .clear-filters-btn, .toggle-statistics-btn, .toggle-comparison-btn, .export-btn {
          background: #1890ff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 5px 0;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .toggle-comparison-btn {
          background: #722ed1;
        }
        .toggle-comparison-btn:hover {
          background: #9254de;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(114, 46, 209, 0.3);
        }
        .toggle-timeseries-btn {
          background: #13c2c2;
        }
        .toggle-timeseries-btn:hover {
          background: #36cfc9;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(19, 194, 194, 0.3);
        }
        .clear-filters-btn:hover, .toggle-statistics-btn:hover, .export-btn:hover {
          background: #40a9ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
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
        .statistics-header {
          border-bottom: 1px solid #e7f3ff;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .statistics-dashboard {
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
          animation: fadeInUp 0.3s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* マーカークラスタリングのスタイル */
        .marker-cluster-small {
          background-color: rgba(181, 226, 140, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.6);
        }
        .marker-cluster-medium {
          background-color: rgba(241, 211, 87, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.6);
        }
        .marker-cluster-large {
          background-color: rgba(253, 156, 115, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.6);
        }
        .marker-cluster-crime {
          background-color: rgba(255, 107, 107, 0.6);
        }
        .marker-cluster-crime div {
          background-color: rgba(255, 59, 48, 0.6);
        }
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
        }
        .marker-cluster span {
          line-height: 30px;
          color: white;
          font-weight: bold;
        }
        /* フィルターヘッダーのスタイル */
        .filter-header {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
          user-select: none;
        }
        .filter-header:hover {
          background-color: #f8f9fa;
          border-radius: 4px;
          margin: -4px;
          padding: 12px 4px;
        }
        .filter-toggle {
          transition: transform 0.2s ease;
          font-size: 12px;
          color: #666;
        }
        .filter-toggle.open {
          transform: rotate(180deg);
        }
        .filter-content {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            overflow: hidden;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }
        /* Ward tooltips and boundaries */
        .ward-tooltip {
          background: rgba(24, 144, 255, 0.9);
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          font-size: 12px;
          padding: 4px 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default App;
