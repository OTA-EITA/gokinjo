// API関連の型定義

export interface Area {
  id: number;
  ward_code: string;
  town_code: string;
  name: string;
}

export interface School {
  id: number;
  name: string;
  type: 'elementary' | 'junior_high' | 'high';
  public_private: 'public' | 'private';
  latitude: number;
  longitude: number;
  address: string;
  area_id: number;
}

export interface Crime {
  id: number;
  category: string;
  date: string;
  latitude: number;
  longitude: number;
  description: string;
  area_id: number;
}

export interface SafetyScore {
  school_id: number;
  school_name: string;
  score: number;
  crime_count: number;
  radius_meters: number;
  last_updated: string;
  score_level: 'very_safe' | 'safe' | 'moderate' | 'caution';
}

export interface ApiResponse<T> {
  [key: string]: T | number;
  total_count: number;
}

// UI関連の型定義
export interface LayerState {
  showSchools: boolean;
  showCrimes: boolean;
  showSafetyScores: boolean;
}

export interface MarkerGroups {
  schoolMarkers: L.LayerGroup | null;
  crimeMarkers: L.LayerGroup | null;
  safetyCircles: L.LayerGroup | null;
}

// グローバル型拡張（UMD対応）
declare global {
  interface Window {
    L: any; // Leaflet UMDグローバル
    React: any; // React UMDグローバル  
    ReactDOM: any; // ReactDOM UMDグローバル
  }
  
  // グローバルなLeafletの型定義
  var L: any;
  var React: any;
  var ReactDOM: any;
}