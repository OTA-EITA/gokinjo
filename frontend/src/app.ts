// TypeScript版近隣情報マッピングアプリ（シンプル構成・型引数なし）

// ========== 型定義 ==========
interface Area {
  id: number;
  ward_code: string;
  town_code: string;
  name: string;
}

interface School {
  id: number;
  name: string;
  type: 'elementary' | 'junior_high' | 'high';
  public_private: 'public' | 'private';
  latitude: number;
  longitude: number;
  address: string;
  area_id: number;
}

interface Crime {
  id: number;
  category: string;
  date: string;
  latitude: number;
  longitude: number;
  description: string;
  area_id: number;
}

interface SafetyScore {
  school_id: number;
  school_name: string;
  score: number;
  crime_count: number;
  radius_meters: number;
  last_updated: string;
  score_level: 'very_safe' | 'safe' | 'moderate' | 'caution';
}

interface ApiResponse<T> {
  [key: string]: T | number;
  total_count: number;
}

interface LayerState {
  showSchools: boolean;
  showCrimes: boolean;
  showSafetyScores: boolean;
}

// ========== 定数定義 ==========
const API_CONFIG = {
  BASE_URL: 'http://localhost:8081',
  ENDPOINTS: {
    HEALTH: '/health',
    AREAS: '/v1/areas',
    SCHOOLS: '/v1/areas/{ward_code}/{town_code}/schools',
    CRIMES: '/v1/areas/{ward_code}/{town_code}/crimes',
    SAFETY_SCORE: '/v1/schools/{id}/safety-score',
    SAFETY_SCORES: '/v1/areas/{ward_code}/{town_code}/safety-scores',
  }
} as const;

const MAP_CONFIG = {
  CENTER: [35.6762, 139.6503] as [number, number],
  DEFAULT_ZOOM: 11,
  TILE_LAYER: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
  },
  FIT_BOUNDS_PADDING: 0.1
} as const;

const ICON_CONFIG = {
  BASE_URL: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img',
  SCHOOL_COLORS: {
    elementary: 'green',
    junior_high: 'orange',
    high: 'red',
    default: 'blue'
  },
  CRIME_COLORS: {
    '窃盗': 'violet',
    '暴行': 'red', 
    '詐欺': 'yellow',
    default: 'grey'
  } as Record<string, string>,
  SIZES: {
    SCHOOL: [25, 41] as [number, number],
    CRIME: [20, 32] as [number, number],
    ANCHOR_SCHOOL: [12, 41] as [number, number],
    ANCHOR_CRIME: [10, 32] as [number, number],
    POPUP_ANCHOR: [1, -34] as [number, number],
    POPUP_ANCHOR_CRIME: [1, -30] as [number, number]
  }
} as const;

const SAFETY_CONFIG = {
  RADIUS_METERS: 500,
  SCORE_LEVELS: {
    VERY_SAFE: { min: 90, color: 'darkgreen', label: '非常に安全' },
    SAFE: { min: 70, color: 'green', label: '安全' },
    MODERATE: { min: 50, color: 'orange', label: '注意' },
    CAUTION: { min: 0, color: 'red', label: '警戒' }
  },
  CIRCLE_STYLE: {
    fillOpacity: 0.2,
    weight: 2
  }
} as const;

const UI_CONFIG = {
  SIDEBAR_WIDTH: 350,
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 200
} as const;

const LABELS = {
  SCHOOL_TYPES: {
    elementary: '小学校',
    junior_high: '中学校',
    high: '高等学校'
  } as Record<School['type'], string>,
  PUBLIC_PRIVATE: {
    public: '公立',
    private: '私立'
  } as Record<School['public_private'], string>,
  SAFETY_LEVELS: {
    very_safe: '非常に安全',
    safe: '安全',
    moderate: '注意',
    caution: '警戒'
  } as Record<SafetyScore['score_level'], string>,
  UI: {
    APP_TITLE: '近隣情報マッピング',
    APP_SUBTITLE: 'Tokyo Crime & Schools (TypeScript)',
    LOADING: 'Loading...',
    LAYER_CONTROLS: 'レイヤー表示',
    AREA_SELECTION: 'エリア選択:',
    SELECTED_PREFIX: '選択中: ',
    SCHOOL_LIST: '学校一覧',
    SAFETY_SCORES: '安全性スコア',
    SCHOOL_LAYER: '学校',
    CRIME_LAYER: '犯罪',
    SAFETY_RANGE_LAYER: '安全範囲 (半径500m)'
  }
} as const;

const ERROR_MESSAGES = {
  FAILED_TO_LOAD_AREAS: 'Failed to load areas',
  FAILED_TO_LOAD_AREA_DATA: 'Failed to load area data',
  FAILED_TO_INITIALIZE_MAP: 'Failed to initialize map',
  HTTP_ERROR: 'HTTP error! status:',
  NETWORK_ERROR: 'Network error occurred'
} as const;

// ========== ユーティリティ関数 ==========

/**
 * 学校タイプに応じたアイコンURLを取得
 */
const getSchoolIcon = (school: School): string => {
  const color = ICON_CONFIG.SCHOOL_COLORS[school.type] || ICON_CONFIG.SCHOOL_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 犯罪タイプに応じたアイコンURLを取得
 */
const getCrimeIcon = (crime: Crime): string => {
  const color = ICON_CONFIG.CRIME_COLORS[crime.category] || ICON_CONFIG.CRIME_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 安全スコアに応じた色を取得
 */
const getSafetyScoreColor = (score: number): string => {
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.MODERATE.min) return SAFETY_CONFIG.SCORE_LEVELS.MODERATE.color;
  return SAFETY_CONFIG.SCORE_LEVELS.CAUTION.color;
};

/**
 * 安全レベルの日本語ラベルを取得
 */
const getSafetyLevelLabel = (level: SafetyScore['score_level']): string => {
  return LABELS.SAFETY_LEVELS[level] || level;
};

/**
 * 学校種別の日本語ラベルを取得
 */
const getSchoolTypeLabel = (type: School['type']): string => {
  return LABELS.SCHOOL_TYPES[type] || type;
};

/**
 * 公立/私立の日本語ラベルを取得
 */
const getPublicPrivateLabel = (publicPrivate: School['public_private']): string => {
  return LABELS.PUBLIC_PRIVATE[publicPrivate] || publicPrivate;
};

/**
 * APIエンドポイントURLを構築
 */
const buildApiUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  return url;
};

/**
 * 安全なfetch処理
 */
const safeFetch = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.HTTP_ERROR} ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
};

// ========== Reactアプリケーション ==========

// CDNから読み込まれたグローバル変数を使用
declare var React: any;
declare var ReactDOM: any;
declare var L: any;

const { useState, useEffect } = React;

const App = () => {
  // State management（型引数なし）
  const [areas, setAreas] = useState([]);
  const [schools, setSchools] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [safetyScores, setSafetyScores] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Layer control state
  const [layerState, setLayerState] = useState({
    showSchools: true,
    showCrimes: true,
    showSafetyScores: false
  });

  // Marker groups
  const [schoolMarkers, setSchoolMarkers] = useState(null);
  const [crimeMarkers, setCrimeMarkers] = useState(null);
  const [safetyCircles, setSafetyCircles] = useState(null);

  useEffect(() => {
    initializeMap();
    loadAreas();
  }, []);

  useEffect(() => {
    displayDataOnMap();
  }, [schools, crimes, safetyScores, layerState, map]);

  /**
   * 地図を初期化
   */
  const initializeMap = (): void => {
    try {
      const mapInstance = L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

      L.tileLayer(MAP_CONFIG.TILE_LAYER.URL, {
        attribution: MAP_CONFIG.TILE_LAYER.ATTRIBUTION
      }).addTo(mapInstance);

      setMap(mapInstance);
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_INITIALIZE_MAP, error);
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
      console.error(ERROR_MESSAGES.FAILED_TO_LOAD_AREAS, error);
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
      console.error(ERROR_MESSAGES.FAILED_TO_LOAD_AREA_DATA, error);
      setLoading(false);
    }
  };

  /**
   * 地図上にデータを表示
   */
  const displayDataOnMap = (): void => {
    if (!map) return;

    // Clear existing markers
    if (schoolMarkers) {
      map.removeLayer(schoolMarkers);
      setSchoolMarkers(null);
    }
    if (crimeMarkers) {
      map.removeLayer(crimeMarkers);
      setCrimeMarkers(null);
    }
    if (safetyCircles) {
      map.removeLayer(safetyCircles);
      setSafetyCircles(null);
    }

    // School markers
    if (layerState.showSchools && schools.length > 0) {
      const schoolMarkersGroup = L.layerGroup();

      schools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          const safetyScore = safetyScores.find((s: SafetyScore) => s.school_id === school.id);
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
    if (layerState.showCrimes && crimes.length > 0) {
      const crimeMarkersGroup = L.layerGroup();

      crimes.forEach((crime: Crime) => {
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
    if (layerState.showSafetyScores && safetyScores.length > 0) {
      const safetyCirclesGroup = L.layerGroup();

      safetyScores.forEach((score: SafetyScore) => {
        const school = schools.find((s: School) => s.id === score.school_id);
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

    // Fit map to show all data
    const allMarkers: any[] = [];
    if (layerState.showSchools && schools.length > 0) {
      schools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          allMarkers.push(L.marker([school.latitude, school.longitude]));
        }
      });
    }
    if (layerState.showCrimes && crimes.length > 0) {
      crimes.forEach((crime: Crime) => {
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
          ` ${LABELS.UI.SCHOOL_LAYER} (${schools.length}件)`
        ),
        React.createElement('label', { className: 'checkbox-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showCrimes,
            onChange: () => handleLayerToggle('showCrimes')
          }),
          ` ${LABELS.UI.CRIME_LAYER} (${crimes.length}件)`
        ),
        React.createElement('label', { className: 'checkbox-label' },
          React.createElement('input', {
            type: 'checkbox',
            checked: layerState.showSafetyScores,
            onChange: () => handleLayerToggle('showSafetyScores')
          }),
          ` ${LABELS.UI.SAFETY_RANGE_LAYER}`
        )
      ),

      // Area selection
      React.createElement('div', { className: 'areas-list' },
        React.createElement('h3', null, LABELS.UI.AREA_SELECTION),
        areas.map((area: Area) =>
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
        React.createElement('p', null, `学校: ${schools.length}件 | 犯罪: ${crimes.length}件`)
      ),

      // Schools list
      layerState.showSchools && schools.length > 0 && React.createElement('div', { className: 'schools-list' },
        React.createElement('h3', null, LABELS.UI.SCHOOL_LIST),
        schools.map((school: School) =>
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
      layerState.showSafetyScores && safetyScores.length > 0 && React.createElement('div', { className: 'safety-scores' },
        React.createElement('h3', null, LABELS.UI.SAFETY_SCORES),
        safetyScores.map((score: SafetyScore) =>
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

// Initialize the app
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(App));
}