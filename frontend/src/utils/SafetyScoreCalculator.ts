import { School, Crime, SafetyScoreResult, SafetyScoreConfig, CrimeProximity } from '../types';

/**
 * SafetyScoreCalculator
 * 
 * Purpose: Calculate safety scores for schools based on nearby crime data
 * 
 * Algorithm:
 * 1. Find all crimes within specified radius of each school
 * 2. Apply time decay (recent crimes weighted more heavily)
 * 3. Apply severity weighting based on crime category
 * 4. Calculate final score (0-100, higher = safer)
 */
export class SafetyScoreCalculator {
  private config: SafetyScoreConfig;

  constructor(config?: Partial<SafetyScoreConfig>) {
    this.config = {
      radius_meters: config?.radius_meters || 500,
      weight_recent: config?.weight_recent || 0.7,
      weight_severity: config?.weight_severity || 0.3,
      time_decay_days: config?.time_decay_days || 365,
      severity_map: config?.severity_map || {
        'theft': 1.0,
        'assault': 2.5,
        'robbery': 2.0,
        'burglary': 1.5,
        'vandalism': 0.8,
        'other': 1.0,
        'default': 1.0
      }
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate days between two dates
   */
  private calculateDaysAgo(dateString: string): number {
    try {
      const crimeDate = new Date(dateString);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - crimeDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return 365; // Default to old crime if date parsing fails
    }
  }

  /**
   * Get severity weight for a crime category
   */
  private getSeverityWeight(category: string): number {
    const normalizedCategory = category.toLowerCase().trim();
    return this.config.severity_map[normalizedCategory] || this.config.severity_map['default'] || 1.0;
  }

  /**
   * Calculate time decay factor (recent crimes weighted more)
   * Returns value between 0 and 1
   */
  private calculateTimeDecay(daysAgo: number): number {
    if (daysAgo <= 0) return 1.0;
    if (daysAgo >= this.config.time_decay_days) return 0.1;

    // Exponential decay: weight = e^(-days/decay_constant)
    const decayConstant = this.config.time_decay_days / 3;
    return Math.exp(-daysAgo / decayConstant);
  }

  /**
   * Find crimes within radius of a school
   */
  private findNearbyCrimes(school: School, crimes: Crime[]): CrimeProximity[] {
    const nearbyCrimes: CrimeProximity[] = [];

    for (const crime of crimes) {
      if (!crime.latitude || !crime.longitude) continue;

      const distance = this.calculateDistance(
        school.latitude,
        school.longitude,
        crime.latitude,
        crime.longitude
      );

      if (distance <= this.config.radius_meters) {
        const daysAgo = this.calculateDaysAgo(crime.date);
        const timeDecay = this.calculateTimeDecay(daysAgo);
        const severityWeight = this.getSeverityWeight(crime.category);

        const weightedScore =
          timeDecay * this.config.weight_recent +
          severityWeight * this.config.weight_severity;

        nearbyCrimes.push({
          crime,
          distance_meters: Math.round(distance),
          days_ago: daysAgo,
          weighted_score: weightedScore
        });
      }
    }

    // Sort by distance (closest first)
    return nearbyCrimes.sort((a, b) => a.distance_meters - b.distance_meters);
  }

  /**
   * Calculate crime density (crimes per square kilometer)
   */
  private calculateCrimeDensity(crimeCount: number): number {
    const radiusKm = this.config.radius_meters / 1000;
    const areaKm2 = Math.PI * radiusKm * radiusKm;
    return crimeCount / areaKm2;
  }

  /**
   * Calculate weighted risk score
   */
  private calculateWeightedRisk(nearbyCrimes: CrimeProximity[]): number {
    if (nearbyCrimes.length === 0) return 0;

    let totalWeightedRisk = 0;
    for (const proximity of nearbyCrimes) {
      // Distance factor: closer crimes are more concerning
      const distanceFactor = 1 - (proximity.distance_meters / this.config.radius_meters);
      totalWeightedRisk += proximity.weighted_score * distanceFactor;
    }

    return totalWeightedRisk;
  }

  /**
   * Convert weighted risk to safety score (0-100)
   * Higher score = safer
   */
  private calculateSafetyScore(weightedRisk: number, crimeCount: number): number {
    if (crimeCount === 0) return 100;

    // Normalize weighted risk to 0-100 scale
    // Assume max risk threshold of 10 (adjust based on data)
    const maxRisk = 10;
    const normalizedRisk = Math.min(weightedRisk / maxRisk, 1.0);

    // Convert to safety score (invert)
    const baseScore = (1 - normalizedRisk) * 100;

    // Apply crime count penalty (logarithmic)
    const countPenalty = Math.log10(crimeCount + 1) * 5;

    const finalScore = Math.max(0, Math.min(100, baseScore - countPenalty));
    return Math.round(finalScore * 10) / 10; // Round to 1 decimal
  }

  /**
   * Determine safety level based on score
   */
  private getScoreLevel(score: number): 'very_safe' | 'safe' | 'moderate' | 'caution' {
    if (score >= 80) return 'very_safe';
    if (score >= 60) return 'safe';
    if (score >= 40) return 'moderate';
    return 'caution';
  }

  /**
   * Calculate safety score for a single school
   */
  public calculateScore(school: School, crimes: Crime[]): SafetyScoreResult {
    const nearbyCrimes = this.findNearbyCrimes(school, crimes);
    const crimeCount = nearbyCrimes.length;
    const crimeDensity = this.calculateCrimeDensity(crimeCount);
    const weightedRisk = this.calculateWeightedRisk(nearbyCrimes);
    const score = this.calculateSafetyScore(weightedRisk, crimeCount);
    const scoreLevel = this.getScoreLevel(score);

    return {
      school_id: school.id,
      school_name: school.name,
      score,
      crime_count: crimeCount,
      nearby_crimes: nearbyCrimes.map(p => p.crime),
      crime_density: Math.round(crimeDensity * 100) / 100,
      weighted_risk: Math.round(weightedRisk * 100) / 100,
      score_level: scoreLevel,
      calculation_timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate safety scores for multiple schools (batch processing)
   */
  public calculateBatchScores(schools: School[], crimes: Crime[]): SafetyScoreResult[] {
    const results: SafetyScoreResult[] = [];

    for (const school of schools) {
      if (!school.latitude || !school.longitude) {
        console.warn(`Skipping school ${school.id}: missing coordinates`);
        continue;
      }

      try {
        const result = this.calculateScore(school, crimes);
        results.push(result);
      } catch (error) {
        console.error(`Error calculating score for school ${school.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SafetyScoreConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): SafetyScoreConfig {
    return { ...this.config };
  }
}

// Export singleton instance with default configuration
export const defaultSafetyCalculator = new SafetyScoreCalculator();

// Helper function to get color based on safety score
export function getSafetyScoreColor(score: number): string {
  if (score >= 80) return '#52c41a'; // Green - Very Safe
  if (score >= 60) return '#73d13d'; // Light Green - Safe
  if (score >= 40) return '#faad14'; // Orange - Moderate
  return '#ff4d4f'; // Red - Caution
}

// Helper function to get label based on safety level
export function getSafetyLevelLabel(level: 'very_safe' | 'safe' | 'moderate' | 'caution'): string {
  const labels = {
    'very_safe': 'Very Safe',
    'safe': 'Safe',
    'moderate': 'Moderate',
    'caution': 'Caution'
  };
  return labels[level] || 'Unknown';
}
