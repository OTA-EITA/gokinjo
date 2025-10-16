import { Crime } from '../types';

/**
 * 月別犯罪データを集計
 */
export const aggregateMonthlyData = (crimes: Crime[]): { month: string; count: number }[] => {
  const monthlyMap: Record<string, number> = {};

  crimes.forEach(crime => {
    if (!crime.date) return;
    
    try {
      const date = new Date(crime.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
    } catch (error) {
      console.warn('Invalid date format:', crime.date);
    }
  });

  // ソートして返す
  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
};

/**
 * 曜日別犯罪データを集計
 */
export const aggregateWeekdayData = (crimes: Crime[]): { day: string; count: number }[] => {
  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const weekdayMap: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };

  crimes.forEach(crime => {
    if (!crime.date) return;
    
    try {
      const date = new Date(crime.date);
      const dayOfWeek = date.getDay();
      weekdayMap[dayOfWeek]++;
    } catch (error) {
      console.warn('Invalid date format:', crime.date);
    }
  });

  return Object.entries(weekdayMap)
    .map(([day, count]) => ({
      day: dayNames[parseInt(day)],
      count
    }));
};

/**
 * 時間帯別犯罪データを集計
 */
export const aggregateHourlyData = (crimes: Crime[]): { hour: string; count: number }[] => {
  const hourlyMap: Record<number, number> = {};
  
  // 0-23時を初期化
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = 0;
  }

  crimes.forEach(crime => {
    if (!crime.date) return;
    
    try {
      const date = new Date(crime.date);
      const hour = date.getHours();
      hourlyMap[hour]++;
    } catch (error) {
      console.warn('Invalid date format:', crime.date);
    }
  });

  return Object.entries(hourlyMap)
    .map(([hour, count]) => ({
      hour: `${hour}時`,
      count
    }));
};

/**
 * 犯罪トレンドを分析（増加・減少・安定）
 */
export const analyzeCrimeTrend = (monthlyData: { month: string; count: number }[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  description: string;
} => {
  if (monthlyData.length < 2) {
    return {
      trend: 'stable',
      changeRate: 0,
      description: 'データ不足'
    };
  }

  // 最初の3ヶ月と最後の3ヶ月を比較
  const firstPeriod = monthlyData.slice(0, Math.min(3, monthlyData.length));
  const lastPeriod = monthlyData.slice(-Math.min(3, monthlyData.length));

  const firstAvg = firstPeriod.reduce((sum, d) => sum + d.count, 0) / firstPeriod.length;
  const lastAvg = lastPeriod.reduce((sum, d) => sum + d.count, 0) / lastPeriod.length;

  const changeRate = ((lastAvg - firstAvg) / firstAvg) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable';
  let description: string;

  if (changeRate > 10) {
    trend = 'increasing';
    description = `犯罪が増加傾向（${changeRate.toFixed(1)}%増）`;
  } else if (changeRate < -10) {
    trend = 'decreasing';
    description = `犯罪が減少傾向（${Math.abs(changeRate).toFixed(1)}%減）`;
  } else {
    trend = 'stable';
    description = '犯罪は安定傾向';
  }

  return { trend, changeRate, description };
};

/**
 * ピーク時間帯を特定
 */
export const findPeakHours = (hourlyData: { hour: string; count: number }[]): string[] => {
  const maxCount = Math.max(...hourlyData.map(d => d.count));
  return hourlyData
    .filter(d => d.count === maxCount && maxCount > 0)
    .map(d => d.hour);
};

/**
 * 最も危険な曜日を特定
 */
export const findMostDangerousDay = (weekdayData: { day: string; count: number }[]): string => {
  const maxDay = weekdayData.reduce((max, current) => 
    current.count > max.count ? current : max
  );
  return maxDay.day;
};
