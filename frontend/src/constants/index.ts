import { School, SafetyScore } from '@/types';

// ========== 定数定義 ==========

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

export const MAP_CONFIG = {
  CENTER: [35.6762, 139.6503] as [number, number],
  DEFAULT_ZOOM: 11,
  TILE_LAYERS: {
    standard: {
      name: 'Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    dark: {
      name: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© OpenStreetMap © CARTO'
    }
  },
  TILE_LAYER: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
  },
  FIT_BOUNDS_PADDING: 0.1
} as const;

export const HEATMAP_CONFIG = {
  RADIUS: 25,
  MAX_ZOOM: 18,
  MAX_INTENSITY: 1.0,
  BLUR: 15,
  GRADIENT: {
    0.1: 'blue',
    0.2: 'cyan', 
    0.4: 'lime',
    0.6: 'yellow',
    0.8: 'orange',
    1.0: 'red'
  }
} as const;

export const ICON_CONFIG = {
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

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 350,
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 200
} as const;

export const LABELS = {
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
    APP_SUBTITLE: 'Tokyo Crime & Schools (Vite + TypeScript)',
    LOADING: 'Loading...',
    LAYER_CONTROLS: 'レイヤー表示',
    AREA_SELECTION: 'エリア選択:',
    SELECTED_PREFIX: '選択中: ',
    SCHOOL_LIST: '学校一覧',
    SAFETY_SCORES: '安全性スコア',
    SCHOOL_LAYER: '学校',
    CRIME_LAYER: '犯罪',
    SAFETY_RANGE_LAYER: '安全範囲 (半径500m)',
    HEATMAP_LAYER: '🔥 犯罪ヒートマップ',
    SEARCH_FILTERS: '🔍 検索・フィルタ',
    SEARCH_PLACEHOLDER: 'エリア名、学校名で検索...',
    SCHOOL_TYPE_FILTER: '学校種別',
    CRIME_TYPE_FILTER: '犯罪種別',
    SAFETY_SCORE_FILTER: '安全スコア範囲',
    PUBLIC_PRIVATE_FILTER: '公立/私立',
    ALL_TYPES: 'すべて',
    CLEAR_FILTERS: 'フィルタをクリア',
    FILTERED_RESULTS: '結果',
    STATISTICS_DASHBOARD: '📊 統計ダッシュボード',
    CRIME_BY_CATEGORY: '犯罪種別統計',
    SAFETY_SCORE_DISTRIBUTION: '安全スコア分布',
    SCHOOL_TYPE_STATS: '学校種別統計',
    PUBLIC_PRIVATE_STATS: '公立/私立統計',
    EXPORT_DATA: 'データエクスポート',
    EXPORT_CSV: 'CSVダウンロード',
    EXPORT_PDF: 'PDFレポート',
    SHOW_STATISTICS: '統計を表示',
    HIDE_STATISTICS: '統計を非表示'
  }
} as const;

export const ERROR_MESSAGES = {
  FAILED_TO_LOAD_AREAS: 'Failed to load areas',
  FAILED_TO_LOAD_AREA_DATA: 'Failed to load area data',
  FAILED_TO_INITIALIZE_MAP: 'Failed to initialize map',
  HTTP_ERROR: 'HTTP error! status:',
  NETWORK_ERROR: 'Network error occurred'
} as const;
