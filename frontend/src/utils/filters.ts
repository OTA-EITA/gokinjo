import { Area, School, Crime, SafetyScore, FilterState } from '@/types';

// ========== フィルタリング関数 ==========

/**
 * エリアをフィルタリング
 */
export const filterAreas = (areas: Area[], searchTerm: string): Area[] => {
  if (!searchTerm.trim()) return areas;
  return areas.filter(area => 
    area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.ward_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.town_code.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

/**
 * 学校をフィルタリング
 */
export const filterSchools = (schools: School[], filters: FilterState): School[] => {
  return schools.filter(school => {
    // 名前検索
    if (filters.searchTerm.trim() && 
        !school.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // 学校種別フィルタ
    if (filters.selectedSchoolTypes.length > 0 && 
        !filters.selectedSchoolTypes.includes(school.type)) {
      return false;
    }
    
    // 公立/私立フィルタ
    if (filters.showPublicOnly && school.public_private !== 'public') {
      return false;
    }
    if (filters.showPrivateOnly && school.public_private !== 'private') {
      return false;
    }
    
    return true;
  });
};

/**
 * 犯罪をフィルタリング
 */
export const filterCrimes = (crimes: Crime[], filters: FilterState): Crime[] => {
  return crimes.filter(crime => {
    // 犯罪種別フィルタ
    if (filters.selectedCrimeCategories.length > 0 && 
        !filters.selectedCrimeCategories.includes(crime.category)) {
      return false;
    }
    
    return true;
  });
};

/**
 * 安全スコアをフィルタリング
 */
export const filterSafetyScores = (safetyScores: SafetyScore[], filters: FilterState): SafetyScore[] => {
  return safetyScores.filter(score => {
    return score.score >= filters.safetyScoreRange[0] && 
           score.score <= filters.safetyScoreRange[1];
  });
};
