import { School, Crime, SafetyScore } from '../types';
import { ICON_CONFIG, SAFETY_CONFIG, LABELS } from '../constants/constants';

/**
 * 学校タイプに応じたアイコンURLを取得
 */
export const getSchoolIcon = (school: School): string => {
  const color = ICON_CONFIG.SCHOOL_COLORS[school.type] || ICON_CONFIG.SCHOOL_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 犯罪タイプに応じたアイコンURLを取得
 */
export const getCrimeIcon = (crime: Crime): string => {
  const color = ICON_CONFIG.CRIME_COLORS[crime.category as keyof typeof ICON_CONFIG.CRIME_COLORS] || 
                ICON_CONFIG.CRIME_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 安全スコアに応じた色を取得
 */
export const getSafetyScoreColor = (score: number): string => {
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.MODERATE.min) return SAFETY_CONFIG.SCORE_LEVELS.MODERATE.color;
  return SAFETY_CONFIG.SCORE_LEVELS.CAUTION.color;
};

/**
 * 安全レベルの日本語ラベルを取得
 */
export const getSafetyLevelLabel = (level: SafetyScore['score_level']): string => {
  return LABELS.SAFETY_LEVELS[level] || level;
};

/**
 * 学校種別の日本語ラベルを取得
 */
export const getSchoolTypeLabel = (type: School['type']): string => {
  return LABELS.SCHOOL_TYPES[type] || type;
};

/**
 * 公立/私立の日本語ラベルを取得
 */
export const getPublicPrivateLabel = (publicPrivate: School['public_private']): string => {
  return LABELS.PUBLIC_PRIVATE[publicPrivate] || publicPrivate;
};

/**
 * APIエンドポイントURLを構築
 */
export const buildApiUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  return url;
};

/**
 * 安全なfetch処理
 */
export const safeFetch = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
};