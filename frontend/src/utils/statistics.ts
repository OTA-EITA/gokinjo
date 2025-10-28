import { School, Crime, SafetyScore, StatisticsData } from '@/types';

// ========== 統計計算関数 ==========

/**
 * 統計情報を計算
 */
export const calculateStatistics = (schools: School[], crimes: Crime[], safetyScores: SafetyScore[]): StatisticsData => {
  // 犯罪種別統計
  const crimeByCategory: Record<string, number> = {};
  crimes.forEach(crime => {
    crimeByCategory[crime.category] = (crimeByCategory[crime.category] || 0) + 1;
  });

  // 安全スコア分布 (10点刻み)
  const safetyScoreDistribution: Record<string, number> = {
    '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
  };
  safetyScores.forEach(score => {
    if (score.score <= 20) safetyScoreDistribution['0-20']++;
    else if (score.score <= 40) safetyScoreDistribution['21-40']++;
    else if (score.score <= 60) safetyScoreDistribution['41-60']++;
    else if (score.score <= 80) safetyScoreDistribution['61-80']++;
    else safetyScoreDistribution['81-100']++;
  });

  // 学校種別統計
  const schoolTypeDistribution: Record<School['type'], number> = {
    elementary: 0, junior_high: 0, high: 0
  };
  schools.forEach(school => {
    schoolTypeDistribution[school.type]++;
  });

  // 公立/私立統計
  const publicPrivateDistribution: Record<School['public_private'], number> = {
    public: 0, private: 0
  };
  schools.forEach(school => {
    publicPrivateDistribution[school.public_private]++;
  });

  // 犯罪の時系列データ (日付別集計)
  const crimeTrendsMap: Record<string, number> = {};
  crimes.forEach(crime => {
    const date = crime.date.split(' ')[0]; // 日付部分のみ取得
    crimeTrendsMap[date] = (crimeTrendsMap[date] || 0) + 1;
  });
  
  const crimeTrends = Object.entries(crimeTrendsMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 基本統計
  const totalSchools = schools.length;
  const totalCrimes = crimes.length;
  const averageSafetyScore = safetyScores.length > 0
    ? safetyScores.reduce((sum, score) => sum + score.score, 0) / safetyScores.length
    : 0;

  return {
    totalSchools,
    totalCrimes,
    averageSafetyScore,
    crimeByCategory,
    safetyScoreDistribution,
    crimeTrends,
    schoolTypeDistribution,
    publicPrivateDistribution
  };
};
