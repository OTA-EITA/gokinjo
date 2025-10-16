import { School, Crime, SafetyScore } from '../types';
import { ICON_CONFIG, SAFETY_CONFIG, LABELS, ERROR_MESSAGES } from '../constants';

// ========== 共通ユーティリティ関数 ==========

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
  const color = ICON_CONFIG.CRIME_COLORS[crime.category] || ICON_CONFIG.CRIME_COLORS.default;
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
export const safeFetch = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.HTTP_ERROR} ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
};

/**
 * 犯罪種別に基づく重み値を取得
 */
export const getCrimeWeight = (crime: Crime): number => {
  const weights: Record<string, number> = {
    '暴行': 1.0,      // 最高重み
    '詐欺': 0.8,
    '窃盗': 0.6,      // 中程度重み
    'default': 0.5    // デフォルト重み
  };
  return weights[crime.category] || weights.default;
};

/**
 * ヒートマップ用データ点を準備
 */
export const prepareHeatmapData = (crimes: Crime[]): [number, number, number][] => {
  return crimes
    .filter(crime => crime.latitude && crime.longitude)
    .map(crime => [
      crime.latitude,
      crime.longitude,
      getCrimeWeight(crime)
    ] as [number, number, number]);
};

/**
 * 利用可能な犯罪種別を取得
 */
export const getAvailableCrimeCategories = (crimes: Crime[]): string[] => {
  const categories = new Set(crimes.map(crime => crime.category));
  return Array.from(categories).sort();
};
