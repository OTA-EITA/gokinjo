import React, { memo, useRef, useEffect } from 'react';
import type { StatisticsData, School } from '../../types';
import { LABELS } from '../../constants';
import {
  createOrUpdateChart,
  getCrimeChartConfig,
  getSafetyChartConfig,
  getSchoolTypeChartConfig
} from '../../utils/charts';
import { getSchoolTypeLabel } from '../../utils/helpers';

interface MemoizedStatisticsPanelProps {
  statisticsData: StatisticsData;
  selectedAreaName?: string;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const MemoizedStatisticsPanel: React.FC<MemoizedStatisticsPanelProps> = memo(({
  statisticsData,
  selectedAreaName,
  onExportCSV,
  onExportPDF
}) => {
  const crimeChartRef = useRef<HTMLCanvasElement>(null);
  const safetyChartRef = useRef<HTMLCanvasElement>(null);
  const schoolTypeChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstancesRef = useRef<Record<string, any>>({});

  useEffect(() => {
    Object.values(chartInstancesRef.current).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('チャート破棄エラー:', e);
        }
      }
    });
    chartInstancesRef.current = {};

    const timer = setTimeout(() => {
      try {
        if (Object.keys(statisticsData.crimeByCategory).length > 0 && crimeChartRef.current) {
          const config = getCrimeChartConfig(statisticsData.crimeByCategory);
          createOrUpdateChart(
            'crimeChart',
            config.type,
            config.data,
            config.options,
            chartInstancesRef.current,
            (instances) => { chartInstancesRef.current = instances; }
          );
        }

        if (Object.keys(statisticsData.safetyScoreDistribution).length > 0 && safetyChartRef.current) {
          const config = getSafetyChartConfig(statisticsData.safetyScoreDistribution);
          createOrUpdateChart(
            'safetyChart',
            config.type,
            config.data,
            config.options,
            chartInstancesRef.current,
            (instances) => { chartInstancesRef.current = instances; }
          );
        }

        if (Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && schoolTypeChartRef.current) {
          const config = getSchoolTypeChartConfig(statisticsData.schoolTypeDistribution, getSchoolTypeLabel);
          createOrUpdateChart(
            'schoolTypeChart',
            config.type,
            config.data,
            config.options,
            chartInstancesRef.current,
            (instances) => { chartInstancesRef.current = instances; }
          );
        }

        console.log('Charts initialized successfully');
      } catch (error) {
        console.error('チャート初期化エラー:', error);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      Object.values(chartInstancesRef.current).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          try {
            chart.destroy();
          } catch (e) {
            console.warn('チャート破棄エラー:', e);
          }
        }
      });
    };
  }, [statisticsData]);

  return (
    <div className="statistics-dashboard">
      <div className="statistics-header">
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px' }}>
          {LABELS.UI.STATISTICS_DASHBOARD}
          {selectedAreaName && (
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
              - {selectedAreaName}
            </span>
          )}
        </h3>
      </div>

      <div className="export-buttons">
        <button onClick={onExportCSV} className="export-btn csv-btn">
          {LABELS.UI.EXPORT_CSV}
        </button>
        <button onClick={onExportPDF} className="export-btn pdf-btn">
          {LABELS.UI.EXPORT_PDF}
        </button>
      </div>

      {Object.keys(statisticsData.crimeByCategory).length > 0 && (
        <div className="chart-container">
          <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center' }}>
            {LABELS.UI.CRIME_BY_CATEGORY}
          </h4>
          <canvas
            id="crimeChart"
            ref={crimeChartRef}
            className="chart-canvas"
          />
        </div>
      )}

      {Object.keys(statisticsData.safetyScoreDistribution).length > 0 && (
        <div className="chart-container">
          <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center' }}>
            {LABELS.UI.SAFETY_SCORE_DISTRIBUTION}
          </h4>
          <canvas
            id="safetyChart"
            ref={safetyChartRef}
            className="chart-canvas"
          />
        </div>
      )}

      {Object.keys(statisticsData.schoolTypeDistribution).some(k => statisticsData.schoolTypeDistribution[k as School['type']] > 0) && (
        <div className="chart-container">
          <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center' }}>
            {LABELS.UI.SCHOOL_TYPE_STATS}
          </h4>
          <canvas
            id="schoolTypeChart"
            ref={schoolTypeChartRef}
            className="chart-canvas"
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.statisticsData) === JSON.stringify(nextProps.statisticsData) &&
    prevProps.selectedAreaName === nextProps.selectedAreaName
  );
});

MemoizedStatisticsPanel.displayName = 'MemoizedStatisticsPanel';

export default MemoizedStatisticsPanel;
