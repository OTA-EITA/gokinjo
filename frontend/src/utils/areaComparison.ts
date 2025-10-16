import { Area, School, Crime, AreaComparisonData } from '../types';
import type { SafetyScoreResult } from '../types';

/**
 * Generate area comparison data from raw data
 */
export const generateAreaComparisonData = (
  areas: Area[],
  schools: School[],
  crimes: Crime[],
  safetyScores: SafetyScoreResult[]
): AreaComparisonData[] => {
  return areas.map(area => {
    // Filter data for this area
    const areaSchools = schools.filter(s => s.area_id === area.id);
    const areaCrimes = crimes.filter(c => c.area_id === area.id);
    const areaScores = safetyScores.filter(s => 
      areaSchools.some(school => school.id === s.school_id)
    );

    // Calculate average safety score
    const avgScore = areaScores.length > 0
      ? areaScores.reduce((sum, s) => sum + s.score, 0) / areaScores.length
      : 0;

    // Calculate crime rate per school
    const crimeRatePerSchool = areaSchools.length > 0 
      ? areaCrimes.length / areaSchools.length 
      : 0;

    // Find most common crime
    const crimeCounts: Record<string, number> = {};
    areaCrimes.forEach(crime => {
      crimeCounts[crime.category] = (crimeCounts[crime.category] || 0) + 1;
    });
    const mostCommonCrime = Object.keys(crimeCounts).length > 0
      ? Object.entries(crimeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : 'None';

    // Find safest school
    const safestSchool = areaScores.length > 0
      ? areaScores.sort((a, b) => b.score - a.score)[0].school_name
      : 'N/A';

    // Count school types
    const schoolTypes = {
      elementary: areaSchools.filter(s => s.type === 'elementary').length,
      junior_high: areaSchools.filter(s => s.type === 'junior_high').length,
      high: areaSchools.filter(s => s.type === 'high').length
    };

    // Count public/private
    const publicPrivateRatio = {
      public: areaSchools.filter(s => s.public_private === 'public').length,
      private: areaSchools.filter(s => s.public_private === 'private').length
    };

    return {
      area_id: area.id,
      area_name: area.name,
      ward_code: area.ward_code,
      town_code: area.town_code,
      school_count: areaSchools.length,
      crime_count: areaCrimes.length,
      avg_safety_score: avgScore,
      crime_rate_per_school: crimeRatePerSchool,
      most_common_crime: mostCommonCrime,
      safest_school: safestSchool,
      school_types: schoolTypes,
      public_private_ratio: publicPrivateRatio
    };
  });
};

/**
 * Export area comparison data to CSV
 */
export const exportAreaComparisonCSV = (areas: AreaComparisonData[]): string => {
  const headers = [
    'Area Name',
    'Ward Code',
    'Town Code',
    'Schools',
    'Crimes',
    'Avg Safety Score',
    'Crime/School Ratio',
    'Most Common Crime',
    'Safest School',
    'Elementary',
    'Junior High',
    'High School',
    'Public',
    'Private'
  ];

  const rows = areas.map(area => [
    area.area_name,
    area.ward_code,
    area.town_code,
    area.school_count,
    area.crime_count,
    area.avg_safety_score.toFixed(2),
    area.crime_rate_per_school.toFixed(2),
    area.most_common_crime,
    area.safest_school,
    area.school_types.elementary,
    area.school_types.junior_high,
    area.school_types.high,
    area.public_private_ratio.public,
    area.public_private_ratio.private
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadAreaComparisonCSV = (data: AreaComparisonData[]): void => {
  const csvContent = exportAreaComparisonCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `area_comparison_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
