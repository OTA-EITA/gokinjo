// ========== 型定義 ==========

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

export interface LayerState {
  showSchools: boolean;
  showCrimes: boolean;
  showSafetyScores: boolean;
  showHeatmap: boolean;
}

export interface FilterState {
  searchTerm: string;
  selectedSchoolTypes: School['type'][];
  selectedCrimeCategories: string[];
  safetyScoreRange: [number, number];
  showPublicOnly: boolean;
  showPrivateOnly: boolean;
}

export interface StatisticsData {
  crimeByCategory: Record<string, number>;
  safetyScoreDistribution: Record<string, number>;
  crimeTrends: { date: string; count: number }[];
  schoolTypeDistribution: Record<School['type'], number>;
  publicPrivateDistribution: Record<School['public_private'], number>;
}

// SafetyScoreCalculator types
export interface SafetyScoreResult {
  school_id: number;
  school_name: string;
  score: number;
  crime_count: number;
  nearby_crimes: Crime[];
  crime_density: number;
  weighted_risk: number;
  score_level: 'very_safe' | 'safe' | 'moderate' | 'caution';
  calculation_timestamp: string;
}

export interface SafetyScoreConfig {
  radius_meters: number;
  weight_recent: number;
  weight_severity: number;
  time_decay_days: number;
  severity_map: Record<string, number>;
}

export interface CrimeProximity {
  crime: Crime;
  distance_meters: number;
  days_ago: number;
  weighted_score: number;
}

// Map Control Settings
export interface MapControlSettings {
  show_area_boundaries: boolean;
  show_school_labels: boolean;
  show_crime_heatmap: boolean;
  show_safety_zones: boolean;
  cluster_markers: boolean;
  map_mode: 'standard' | 'satellite' | 'dark';
  animation_enabled: boolean;
}

export interface MapTileLayer {
  name: string;
  url: string;
  attribution: string;
}

// Area Comparison
export interface AreaComparisonData {
  area_id: number;
  area_name: string;
  ward_code: string;
  town_code: string;
  school_count: number;
  crime_count: number;
  avg_safety_score: number;
  crime_rate_per_school: number;
  most_common_crime: string;
  safest_school: string;
  school_types: {
    elementary: number;
    junior_high: number;
    high: number;
  };
  public_private_ratio: {
    public: number;
    private: number;
  };
}
