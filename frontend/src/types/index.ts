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
