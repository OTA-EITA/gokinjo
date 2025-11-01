import { useState, useEffect, useRef, useCallback } from 'react';
import type { StatisticsData, School } from '../types';
import { 
  createOrUpdateChart, 
  getCrimeChartConfig, 
  getSafetyChartConfig, 
  getSchoolTypeChartConfig 
} from '../utils/charts';
import { getSchoolTypeLabel } from '../utils/helpers';

interface UseChartsReturn {
  chartInstances: Record<string, any>;
  chartsInitialized: boolean;
  crimeChartRef: React.RefObject<HTMLCanvasElement>;
  safetyChartRef: React.RefObject<HTMLCanvasElement>;
  schoolTypeChartRef: React.RefObject<HTMLCanvasElement>;
  initializeCharts: () => void;
}

export const useCharts = (
  showStatistics: boolean,
  statisticsData: StatisticsData | null
): UseChartsReturn => {
  const [chartInstances, setChartInstances] = useState<Record<string, any>>({});
  const [chartsInitialized, setChartsInitialized] = useState<boolean>(false);
  
  const crimeChartRef = useRef<HTMLCanvasElement>(null);
  const safetyChartRef = useRef<HTMLCanvasElement>(null);
  const schoolTypeChartRef = useRef<HTMLCanvasElement>(null);

  const initializeCharts = useCallback((): void => {
    if (!statisticsData) {
      console.log('No statistics data available for chart initialization');
      return;
    }

    try {
      if (Object.keys(statisticsData.crimeByCategory).length > 0 && crimeChartRef.current) {
        const config = getCrimeChartConfig(statisticsData.crimeByCategory);
        createOrUpdateChart('crimeChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }

      if (Object.keys(statisticsData.safetyScoreDistribution).length > 0 && safetyChartRef.current) {
        const config = getSafetyChartConfig(statisticsData.safetyScoreDistribution);
        createOrUpdateChart('safetyChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }

      if (Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && schoolTypeChartRef.current) {
        const config = getSchoolTypeChartConfig(statisticsData.schoolTypeDistribution, getSchoolTypeLabel);
        createOrUpdateChart('schoolTypeChart', config.type, config.data, config.options, chartInstances, setChartInstances);
      }
      
      console.log('Charts initialized successfully');
    } catch (error) {
      console.error('Chart initialization error:', error);
    }
  }, [statisticsData, chartInstances]);

  useEffect(() => {
    if (!showStatistics || !statisticsData) {
      setChartsInitialized(false);
      return;
    }

    if (!(window as any).Chart) {
      console.warn('Chart.js is not loaded');
      return;
    }

    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('Chart destruction error:', e);
        }
      }
    });
    setChartInstances({});
    setChartsInitialized(false);
    
    const timer = setTimeout(() => {
      try {
        initializeCharts();
        setChartsInitialized(true);
      } catch (error) {
        console.error('Chart initialization failed:', error);
        setChartsInitialized(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStatistics, statisticsData]);

  return {
    chartInstances,
    chartsInitialized,
    crimeChartRef,
    safetyChartRef,
    schoolTypeChartRef,
    initializeCharts
  };
};
