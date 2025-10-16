// TypeScript版近隣情報マッピングアプリ（モジュール化版）

// ========== インポート ==========
import { 
  Area, School, Crime, SafetyScore, LayerState, FilterState, StatisticsData 
} from './types/index';
import { 
  API_CONFIG, MAP_CONFIG, HEATMAP_CONFIG, ICON_CONFIG, SAFETY_CONFIG, UI_CONFIG, LABELS 
} from './constants/index';
import { 
  getSchoolIcon, getCrimeIcon, getSafetyScoreColor, getSafetyLevelLabel, 
  getSchoolTypeLabel, getPublicPrivateLabel, buildApiUrl, safeFetch,
  prepareHeatmapData, getAvailableCrimeCategories
} from './utils/helpers';
import { 
  filterAreas, filterSchools, filterCrimes, filterSafetyScores 
} from './utils/filters';
import { calculateStatistics } from './utils/statistics';
import { 
  createOrUpdateChart, getCrimeChartConfig, getSafetyChartConfig, getSchoolTypeChartConfig 
} from './utils/charts';
import { generateCSVData, generatePDFReport, downloadCSV } from './utils/export';

// ========== React フックの取得 ==========
const React = (window as any).React;
const { useEffect } = React;

// TypeScriptに適用可能な型付きuseState
const useState = <T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] => {
  return React.useState(initialState);
};

// ========== メインアプリケーション ==========
const App = () => {
  // ========== 状態管理 ==========
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [safetyScores, setSafetyScores] = useState<SafetyScore[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [map, setMap] = useState<any>(null);
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
  const [schoolMarkers, setSchoolMarkers] = useState<any>(null);
  const [crimeMarkers, setCrimeMarkers] = useState<any>(null);
  const [safetyCircles, setSafetyCircles] = useState<any>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);

  // ========== Effect フック ==========
  useEffect(() => {
    initializeMap();
    loadAreas();
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
      const mapInstance = (window as any).L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

      (window as any).L.tileLayer(MAP_CONFIG.TILE_LAYER.URL, {
        attribution: MAP_CONFIG.TILE_LAYER.ATTRIBUTION
      }).addTo(mapInstance);

      setMap(mapInstance);
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
      if (layer) {
        map.removeLayer(layer);
      }
    });
    setSchoolMarkers(null);
    setCrimeMarkers(null);
    setSafetyCircles(null);
    setHeatmapLayer(null);

    // School markers
    if (layerState.showSchools && filteredSchools.length > 0) {
      const schoolMarkersGroup = (window as any).L.layerGroup();

      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          const safetyScore = filteredSafetyScores.find((s: SafetyScore) => s.school_id === school.id);
          const scoreText = safetyScore ?
            `<br/><strong>安全スコア: ${safetyScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(safetyScore.score_level)})` : '';

          const icon = (window as any).L.icon({
            iconUrl: getSchoolIcon(school),
            iconSize: ICON_CONFIG.SIZES.SCHOOL,
            iconAnchor: ICON_CONFIG.SIZES.ANCHOR_SCHOOL,
            popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR
          });

          const marker = (window as any).L.marker([school.latitude, school.longitude], { icon })
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
      const crimeMarkersGroup = (window as any).L.layerGroup();

      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
          const icon = (window as any).L.icon({
            iconUrl: getCrimeIcon(crime),
            iconSize: ICON_CONFIG.SIZES.CRIME,
            iconAnchor: ICON_CONFIG.SIZES.ANCHOR_CRIME,
            popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR_CRIME
          });

          const marker = (window as any).L.marker([crime.latitude, crime.longitude], { icon })
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
      const safetyCirclesGroup = (window as any).L.layerGroup();

      filteredSafetyScores.forEach((score: SafetyScore) => {
        const school = filteredSchools.find((s: School) => s.id === score.school_id);
        if (school && school.latitude && school.longitude) {
          const circle = (window as any).L.circle([school.latitude, school.longitude], {
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
      
      if (heatmapData.length > 0 && (window as any).L && (window as any).L.heatLayer) {
        const heatLayer = (window as any).L.heatLayer(heatmapData, {
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
          allMarkers.push((window as any).L.marker([school.latitude, school.longitude]));
        }
      });
    }
    if (layerState.showCrimes && filteredCrimes.length > 0) {
      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
          allMarkers.push((window as any).L.marker([crime.latitude, crime.longitude]));
        }
      });
    }

    if (allMarkers.length > 0) {
      const group = (window as any).L.featureGroup(allMarkers);
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
  return React.createElement('div', { className: 'app' },
    React.createElement('div', { className: 'sidebar' },
      React.createElement('h1', null, LABELS.UI.APP_TITLE),
      React.createElement('h2', null, LABELS.UI.APP_SUBTITLE),

      loading && React.createElement('div', { className: 'loading' }, LABELS.UI.LOADING),

      // Layer controls
      React.createElement('div', { className: 'layer-controls' },
        React.createElement('h3', null, LABELS.UI.LAYER_CONTROLS),
        React.createElement('label', { className: 'checkbox-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showSchools,
            onChange: () => handleLayerToggle('showSchools')
          }),
          ` ${LABELS.UI.SCHOOL_LAYER} (${filteredSchools.length}件)`
        ),
        React.createElement('label', { className: 'checkbox-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showCrimes,
            onChange: () => handleLayerToggle('showCrimes')
          }),
          ` ${LABELS.UI.CRIME_LAYER} (${filteredCrimes.length}件)`
        ),
        React.createElement('label', { className: 'checkbox-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showSafetyScores,
            onChange: () => handleLayerToggle('showSafetyScores')
          }),
          ` ${LABELS.UI.SAFETY_RANGE_LAYER}`
        ),
        React.createElement('label', { className: 'checkbox-label heatmap-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showHeatmap,
            onChange: () => handleLayerToggle('showHeatmap')
          }),
          ` ${LABELS.UI.HEATMAP_LAYER} (🌡️ 犯罪密度)`
        )
      ),

      // Search and Filter controls
      React.createElement('div', { className: 'search-filters' },
        React.createElement('h3', null, LABELS.UI.SEARCH_FILTERS),
        
        // Search box
        React.createElement('div', { className: 'search-box' },
          React.createElement('input', {
            type: 'text',
            placeholder: LABELS.UI.SEARCH_PLACEHOLDER,
            value: filterState.searchTerm,
            onChange: (e: any) => handleSearchChange(e.target.value),
            className: 'search-input'
          })
        ),
        
        // School type filter
        React.createElement('div', { className: 'filter-group' },
          React.createElement('label', { className: 'filter-group-label' }, LABELS.UI.SCHOOL_TYPE_FILTER),
          React.createElement('div', { className: 'filter-checkboxes' },
            (['elementary', 'junior_high', 'high'] as School['type'][]).map(type =>
              React.createElement('label', {
                key: type,
                className: 'checkbox-label small'
              },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.selectedSchoolTypes.includes(type),
                  onChange: () => handleSchoolTypeToggle(type)
                }),
                ` ${getSchoolTypeLabel(type)}`
              )
            )
          )
        ),
        
        // Crime type filter
        availableCrimeCategories.length > 0 && React.createElement('div', { className: 'filter-group' },
          React.createElement('label', { className: 'filter-group-label' }, LABELS.UI.CRIME_TYPE_FILTER),
          React.createElement('div', { className: 'filter-checkboxes' },
            availableCrimeCategories.map(category =>
              React.createElement('label', {
                key: category,
                className: 'checkbox-label small'
              },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.selectedCrimeCategories.includes(category),
                  onChange: () => handleCrimeCategoryToggle(category)
                }),
                ` ${category}`
              )
            )
          )
        ),
        
        // Public/Private filter
        React.createElement('div', { className: 'filter-group' },
          React.createElement('label', { className: 'filter-group-label' }, LABELS.UI.PUBLIC_PRIVATE_FILTER),
          React.createElement('div', { className: 'filter-checkboxes' },
            React.createElement('label', { className: 'checkbox-label small' },
              React.createElement('input', {
                type: 'checkbox',
                checked: filterState.showPublicOnly,
                onChange: () => handlePublicPrivateToggle('public')
              }),
              ` 公立のみ`
            ),
            React.createElement('label', { className: 'checkbox-label small' },
              React.createElement('input', {
                type: 'checkbox',
                checked: filterState.showPrivateOnly,
                onChange: () => handlePublicPrivateToggle('private')
              }),
              ` 私立のみ`
            )
          )
        ),
        
        // Safety score range slider
        React.createElement('div', { className: 'filter-group' },
          React.createElement('label', { className: 'filter-group-label' }, 
            `${LABELS.UI.SAFETY_SCORE_FILTER}: ${filterState.safetyScoreRange[0]} - ${filterState.safetyScoreRange[1]}`
          ),
          React.createElement('div', { className: 'range-sliders' },
            React.createElement('input', {
              type: 'range',
              min: 0,
              max: 100,
              value: filterState.safetyScoreRange[0],
              onChange: (e: any) => handleSafetyScoreRangeChange([
                parseInt(e.target.value), 
                filterState.safetyScoreRange[1]
              ]),
              className: 'range-slider'
            }),
            React.createElement('input', {
              type: 'range',
              min: 0,
              max: 100,
              value: filterState.safetyScoreRange[1],
              onChange: (e: any) => handleSafetyScoreRangeChange([
                filterState.safetyScoreRange[0],
                parseInt(e.target.value)
              ]),
              className: 'range-slider'
            })
          )
        ),
        
        // Clear filters button
        React.createElement('button', {
          onClick: handleClearFilters,
          className: 'clear-filters-btn'
        }, LABELS.UI.CLEAR_FILTERS),
        
        // Results count display
        React.createElement('div', { className: 'filter-results' },
          `${LABELS.UI.FILTERED_RESULTS}: 学校${filteredSchools.length}件 | 犯罪${filteredCrimes.length}件`
        ),
        
        // Statistics toggle button
        React.createElement('button', {
          onClick: handleToggleStatistics,
          className: 'toggle-statistics-btn'
        }, showStatistics ? LABELS.UI.HIDE_STATISTICS : LABELS.UI.SHOW_STATISTICS)
      ),

      // Statistics Dashboard
      showStatistics && statisticsData && React.createElement('div', { className: 'statistics-dashboard' },
        React.createElement('h3', null, LABELS.UI.STATISTICS_DASHBOARD),
        
        // Export buttons
        React.createElement('div', { className: 'export-buttons' },
          React.createElement('button', {
            onClick: handleExportCSV,
            className: 'export-btn csv-btn'
          }, LABELS.UI.EXPORT_CSV),
          React.createElement('button', {
            onClick: handleExportPDF,
            className: 'export-btn pdf-btn'
          }, LABELS.UI.EXPORT_PDF)
        ),
        
        // Crime statistics chart
        Object.keys(statisticsData.crimeByCategory).length > 0 && React.createElement('div', { className: 'chart-container' },
          React.createElement('h4', null, LABELS.UI.CRIME_BY_CATEGORY),
          React.createElement('canvas', { 
            id: 'crimeChart', 
            className: 'chart-canvas',
            ref: (canvas: any) => {
              if (canvas && statisticsData) {
                setTimeout(() => {
                  const config = getCrimeChartConfig(statisticsData.crimeByCategory);
                  handleCreateChart('crimeChart', config.type, config.data, config.options);
                }, 100);
              }
            }
          })
        ),
        
        // Safety score distribution chart
        Object.keys(statisticsData.safetyScoreDistribution).length > 0 && React.createElement('div', { className: 'chart-container' },
          React.createElement('h4', null, LABELS.UI.SAFETY_SCORE_DISTRIBUTION),
          React.createElement('canvas', { 
            id: 'safetyChart',
            className: 'chart-canvas',
            ref: (canvas: any) => {
              if (canvas && statisticsData) {
                setTimeout(() => {
                  const config = getSafetyChartConfig(statisticsData.safetyScoreDistribution);
                  handleCreateChart('safetyChart', config.type, config.data, config.options);
                }, 200);
              }
            }
          })
        ),
        
        // School type chart
        Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && 
        React.createElement('div', { className: 'chart-container' },
          React.createElement('h4', null, LABELS.UI.SCHOOL_TYPE_STATS),
          React.createElement('canvas', { 
            id: 'schoolTypeChart',
            className: 'chart-canvas',
            ref: (canvas: any) => {
              if (canvas && statisticsData) {
                setTimeout(() => {
                  const config = getSchoolTypeChartConfig(statisticsData.schoolTypeDistribution, getSchoolTypeLabel);
                  handleCreateChart('schoolTypeChart', config.type, config.data, config.options);
                }, 300);
              }
            }
          })
        )
      ),

      // Area selection
      React.createElement('div', { className: 'areas-list' },
        React.createElement('h3', null, LABELS.UI.AREA_SELECTION),
        filteredAreas.map((area: Area) =>
          React.createElement('div', {
            key: area.id,
            className: `area-item ${selectedArea?.id === area.id ? 'selected' : ''}`,
            onClick: () => handleAreaClick(area)
          },
            React.createElement('strong', null, area.name),
            React.createElement('br'),
            React.createElement('small', null, `Ward: ${area.ward_code}, Town: ${area.town_code}`)
          )
        )
      ),

      // Selected area info
      selectedArea && React.createElement('div', { className: 'selected-area' },
        React.createElement('h3', null, `${LABELS.UI.SELECTED_PREFIX}${selectedArea.name}`),
        React.createElement('p', null, `学校: ${filteredSchools.length}件 | 犯罪: ${filteredCrimes.length}件`)
      ),

      // Schools list
      layerState.showSchools && filteredSchools.length > 0 && React.createElement('div', { className: 'schools-list' },
        React.createElement('h3', null, LABELS.UI.SCHOOL_LIST),
        filteredSchools.map((school: School) =>
          React.createElement('div', {
            key: school.id,
            className: 'school-item'
          },
            React.createElement('strong', null, school.name),
            React.createElement('br'),
            React.createElement('small', null, `${getSchoolTypeLabel(school.type)} | ${getPublicPrivateLabel(school.public_private)}`)
          )
        )
      ),

      // Safety scores list
      layerState.showSafetyScores && filteredSafetyScores.length > 0 && React.createElement('div', { className: 'safety-scores' },
        React.createElement('h3', null, LABELS.UI.SAFETY_SCORES),
        filteredSafetyScores.map((score: SafetyScore) =>
          React.createElement('div', {
            key: score.school_id,
            className: 'safety-score-item',
            style: { borderLeft: `4px solid ${getSafetyScoreColor(score.score)}` }
          },
            React.createElement('strong', null, score.school_name),
            React.createElement('br'),
            React.createElement('span', { className: 'score' },
              `スコア: ${score.score.toFixed(1)} (${getSafetyLevelLabel(score.score_level)})`
            ),
            React.createElement('br'),
            React.createElement('small', null, `周辺犯罪: ${score.crime_count}件`)
          )
        )
      )
    ),

    React.createElement('div', { id: 'map', className: 'map' }),

    // Styling
    React.createElement('style', null, `
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
      .layer-controls {
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
      .search-filters {
        background: white;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .search-box {
        margin-bottom: 15px;
      }
      .search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .search-input:focus {
        outline: none;
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
      .filter-group {
        margin-bottom: 15px;
      }
      .filter-group-label {
        display: block;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
        font-size: 12px;
      }
      .filter-checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .checkbox-label.small {
        font-size: 11px;
        margin: 2px 0;
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 3px;
        border: 1px solid #e9ecef;
        transition: background-color 0.2s;
      }
      .checkbox-label.small:hover {
        background: #e7f3ff;
      }
      .checkbox-label.small input:checked + * {
        font-weight: bold;
      }
      .range-sliders {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .range-slider {
        width: 100%;
        margin: 2px 0;
        accent-color: #1890ff;
      }
      .clear-filters-btn {
        width: 100%;
        padding: 8px 16px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        transition: background-color 0.2s;
        margin-bottom: 10px;
      }
      .clear-filters-btn:hover {
        background: #ff5252;
      }
      .filter-results {
        background: #e7f3ff;
        padding: 8px;
        border-radius: 4px;
        font-size: 11px;
        color: #1890ff;
        font-weight: bold;
        text-align: center;
      }
      .toggle-statistics-btn {
        width: 100%;
        padding: 10px 16px;
        background: #1890ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        transition: background-color 0.2s;
        margin-top: 10px;
      }
      .toggle-statistics-btn:hover {
        background: #0f7ae5;
      }
      .statistics-dashboard {
        background: white;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        border: 1px solid #dee2e6;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .export-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
      }
      .export-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        transition: all 0.2s;
      }
      .csv-btn {
        background: #2ecc71;
        color: white;
      }
      .csv-btn:hover {
        background: #27ae60;
      }
      .pdf-btn {
        background: #e74c3c;
        color: white;
      }
      .pdf-btn:hover {
        background: #c0392b;
      }
      .chart-container {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }
      .chart-container h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 14px;
        text-align: center;
      }
      .chart-canvas {
        max-height: 300px;
        width: 100% !important;
        height: 250px !important;
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
      .schools-list {
        margin-top: 20px;
      }
      .school-item {
        background: white;
        padding: 8px;
        margin: 4px 0;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid #e9ecef;
      }
      .safety-scores {
        margin-top: 20px;
      }
      .safety-score-item {
        background: white;
        padding: 10px;
        margin: 5px 0;
        border-radius: 4px;
        font-size: 12px;
      }
      .score {
        font-weight: bold;
        color: #333;
      }
      h1 {
        color: #1890ff;
        margin-top: 0;
        font-size: 24px;
      }
      h2 {
        color: #666;
        font-size: 14px;
        margin-top: 0;
      }
      h3 {
        margin-top: 0;
        margin-bottom: 12px;
        color: #333;
        font-size: 16px;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Arial, sans-serif;
      }
    `)
  );
};

// ========== アプリケーション初期化 ==========
const container = document.getElementById('root');
if (container) {
  const root = (window as any).ReactDOM.createRoot(container);
  root.render(React.createElement(App));
}
