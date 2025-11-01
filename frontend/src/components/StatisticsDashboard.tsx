import React from 'react';
import type { StatisticsData, Area, School } from '../types';
import { LABELS } from '../constants';

interface StatisticsDashboardProps {
  statisticsData: StatisticsData | null;
  selectedArea: Area | null;
  crimeChartRef: React.RefObject<HTMLCanvasElement>;
  safetyChartRef: React.RefObject<HTMLCanvasElement>;
  schoolTypeChartRef: React.RefObject<HTMLCanvasElement>;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  statisticsData,
  selectedArea,
  crimeChartRef,
  safetyChartRef,
  schoolTypeChartRef,
  onExportCSV,
  onExportPDF
}) => {
  if (!statisticsData) return null;

  return (
    <div className="statistics-dashboard">
      <div className="statistics-header">
        <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
          {LABELS.UI.STATISTICS_DASHBOARD}
          {selectedArea && (
            <span style={{fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '8px'}}>
              - {selectedArea.name}
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
          <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
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
          <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
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
          <h4 style={{margin: '0 0 15px 0', color: '#333', fontSize: '14px', textAlign: 'center'}}>
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
};
