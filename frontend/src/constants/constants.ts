// API関連定数
export const API_CONFIG = {
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

// 地図関連定数
export const MAP_CONFIG = {
  CENTER: [35.6762, 139.6503] as [number, number],
  DEFAULT_ZOOM: 11,
  TILE_LAYER: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
  },
  FIT_BOUNDS_PADDING: 0.1
} as const;

// アイコン関連定数
export const ICON_CONFIG = {
  BASE_URL: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img',
  SCHOOL_COLORS: {
    elementary: 'green',
    junior_high: 'orange',
    high: 'red',
    default: 'blue'
  },
  CRIME_COLORS: {
    窃盗: 'violet',
    暴行: 'red', 
    詐欺: 'yellow',
    default: 'grey'
  },
  SIZES: {
    SCHOOL: [25, 41] as [number, number],
    CRIME: [20, 32] as [number, number],
    ANCHOR_SCHOOL: [12, 41] as [number, number],
    ANCHOR_CRIME: [10, 32] as [number, number],
    POPUP_ANCHOR: [1, -34] as [number, number],
    POPUP_ANCHOR_CRIME: [1, -30] as [number, number]
  }
} as const;

// 安全性スコア関連定数
export const SAFETY_CONFIG = {
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

// UI関連定数
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 350,
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 200
} as const;

// 日本語ラベル定数
export const LABELS = {
  SCHOOL_TYPES: {
    elementary: '小学校',
    junior_high: '中学校',
    high: '高等学校'
  },
  PUBLIC_PRIVATE: {
    public: '公立',
    private: '私立'
  },
  SAFETY_LEVELS: {
    very_safe: '非常に安全',
    safe: '安全',
    moderate: '注意',
    caution: '警戒'
  },
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

// エラーメッセージ定数
export const ERROR_MESSAGES = {
  FAILED_TO_LOAD_AREAS: 'Failed to load areas',
  FAILED_TO_LOAD_AREA_DATA: 'Failed to load area data',
  FAILED_TO_INITIALIZE_MAP: 'Failed to initialize map',
  HTTP_ERROR: 'HTTP error! status:',
  NETWORK_ERROR: 'Network error occurred'
} as const;