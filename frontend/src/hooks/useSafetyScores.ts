import { useState, useEffect } from 'react';
import type { School, Crime, SafetyScoreResult } from '../types';
import { SafetyScoreCalculator } from '../utils/SafetyScoreCalculator';

interface UseSafetyScoresReturn {
  calculatedSafetyScores: SafetyScoreResult[];
  safetyCalculator: SafetyScoreCalculator;
}

export const useSafetyScores = (
  schools: School[],
  crimes: Crime[]
): UseSafetyScoresReturn => {
  const [safetyCalculator] = useState(() => new SafetyScoreCalculator());
  const [calculatedSafetyScores, setCalculatedSafetyScores] = useState<SafetyScoreResult[]>([]);

  useEffect(() => {
    if (schools.length > 0 && crimes.length > 0 && safetyCalculator) {
      console.log(`Calculating safety scores for ${schools.length} schools...`);
      try {
        const scores = safetyCalculator.calculateBatchScores(schools, crimes);
        setCalculatedSafetyScores(scores);
        console.log(`Safety scores calculated: ${scores.length} results`);
      } catch (error) {
        console.error('Failed to calculate safety scores:', error);
      }
    } else {
      setCalculatedSafetyScores([]);
    }
  }, [schools, crimes, safetyCalculator]);

  return {
    calculatedSafetyScores,
    safetyCalculator
  };
};
