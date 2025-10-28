import React, { useEffect, useRef, useState } from 'react';
import { Crime } from '../types';
import { 
  aggregateMonthlyData, 
  aggregateWeekdayData,
  analyzeCrimeTrend,
  findMostDangerousDay 
} from '../utils/timeSeriesAnalysis';
import { 
  createOrUpdateChart, 
  getMonthlyTrendConfig, 
  getWeekdayTrendConfig 
} from '../utils/charts';

interface TimeSeriesAnalysisProps {
  crimes: Crime[];
  areaName?: string;
}

const TimeSeriesAnalysis: React.FC<TimeSeriesAnalysisProps> = ({ crimes, areaName }) => {
  const [chartInstances, setChartInstances] = useState<Record<string, any>>({});
  const [showAnalysis, setShowAnalysis] = useState(true);
  
  const monthlyChartRef = useRef<HTMLCanvasElement>(null);
  const weekdayChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (crimes.length === 0 || !showAnalysis) return;

    // Aggregate data
    const monthlyData = aggregateMonthlyData(crimes);
    const weekdayData = aggregateWeekdayData(crimes);

    // Create monthly trend chart
    if (monthlyChartRef.current && monthlyData.length > 0) {
      const monthlyConfig = getMonthlyTrendConfig(monthlyData);
      createOrUpdateChart(
        'monthlyTrendChart',
        monthlyConfig.type,
        monthlyConfig.data,
        monthlyConfig.options,
        chartInstances,
        setChartInstances
      );
    }

    // Create weekday chart
    if (weekdayChartRef.current) {
      const weekdayConfig = getWeekdayTrendConfig(weekdayData);
      createOrUpdateChart(
        'weekdayTrendChart',
        weekdayConfig.type,
        weekdayConfig.data,
        weekdayConfig.options,
        chartInstances,
        setChartInstances
      );
    }

    return () => {
      // Cleanup
      Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          try {
            chart.destroy();
          } catch (e) {
            console.warn('Chart cleanup error:', e);
          }
        }
      });
    };
  }, [crimes, showAnalysis, chartInstances]);

  if (crimes.length === 0) {
    return (
      <div className="time-series-analysis">
        <div className="empty-message">
          <span className="empty-icon">📊</span>
          <p>データが不足しているため、時系列分析を表示できません</p>
        </div>
      </div>
    );
  }

  const monthlyData = aggregateMonthlyData(crimes);
  const weekdayData = aggregateWeekdayData(crimes);
  const trendAnalysis = analyzeCrimeTrend(monthlyData);
  const mostDangerousDay = findMostDangerousDay(weekdayData);

  return (
    <div className="time-series-analysis">
      <div className="analysis-header">
        <div className="header-content">
          <h3>時系列分析</h3>
          {areaName && <span className="area-badge">{areaName}</span>}
        </div>
        <button 
          className="toggle-analysis-btn"
          onClick={() => setShowAnalysis(!showAnalysis)}
        >
          {showAnalysis ? '📉 Hide Analysis' : '📈 Show Analysis'}
        </button>
      </div>

      {showAnalysis && (
        <>
          {/* Insights Summary */}
          <div className="insights-summary">
            <div className="insight-card">
              <div className="insight-icon trend">📈</div>
              <div className="insight-content">
                <h4>傾向</h4>
                <p className={`trend-${trendAnalysis.trend}`}>
                  {trendAnalysis.description}
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon danger">⚠️</div>
              <div className="insight-content">
                <h4>注意すべき曜日</h4>
                <p><strong>{mostDangerousDay}</strong></p>
                <span className="detail">最も犯罪が多い曜日</span>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon total">📊</div>
              <div className="insight-content">
                <h4>総犯罪件数</h4>
                <p><strong>{crimes.length}件</strong></p>
                <span className="detail">分析期間中</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-container">
              <div className="chart-header">
                <h4>📅 月別犯罪傾向</h4>
                <span className="chart-description">
                  時間経過による犯罪発生の推移
                </span>
              </div>
              <div className="chart-canvas-wrapper">
                <canvas id="monthlyTrendChart" ref={monthlyChartRef} />
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h4>📆 曜日別犯罪分布</h4>
                <span className="chart-description">
                  曜日ごとの犯罪発生パターン
                </span>
              </div>
              <div className="chart-canvas-wrapper">
                <canvas id="weekdayTrendChart" ref={weekdayChartRef} />
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="detailed-stats">
            <h4>詳細統計</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">分析期間:</span>
                <span className="stat-value">
                  {monthlyData.length > 0 
                    ? `${monthlyData[0].month} 〜 ${monthlyData[monthlyData.length - 1].month}` 
                    : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">平均月間件数:</span>
                <span className="stat-value">
                  {monthlyData.length > 0 
                    ? (monthlyData.reduce((sum, d) => sum + d.count, 0) / monthlyData.length).toFixed(1)
                    : '0'}
                  件
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">最大月間件数:</span>
                <span className="stat-value">
                  {monthlyData.length > 0 
                    ? Math.max(...monthlyData.map(d => d.count))
                    : 0}
                  件
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">最小月間件数:</span>
                <span className="stat-value">
                  {monthlyData.length > 0 
                    ? Math.min(...monthlyData.map(d => d.count))
                    : 0}
                  件
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .time-series-analysis {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 15px 0;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e7f3ff;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .analysis-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
          font-weight: 600;
        }

        .area-badge {
          background: #e7f3ff;
          color: #1890ff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .toggle-analysis-btn {
          background: #52c41a;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-analysis-btn:hover {
          background: #73d13d;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
        }

        .insights-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .insight-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e8e8e8;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.2s;
        }

        .insight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .insight-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .insight-content {
          flex: 1;
        }

        .insight-content h4 {
          margin: 0 0 6px 0;
          font-size: 12px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
        }

        .insight-content p {
          margin: 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .insight-content .detail {
          font-size: 11px;
          color: #999;
        }

        .trend-increasing {
          color: #ff4d4f;
        }

        .trend-decreasing {
          color: #52c41a;
        }

        .trend-stable {
          color: #1890ff;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-container {
          background: #fafafa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e8e8e8;
        }

        .chart-header {
          margin-bottom: 12px;
        }

        .chart-header h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }

        .chart-description {
          font-size: 11px;
          color: #999;
        }

        .chart-canvas-wrapper {
          position: relative;
          height: 250px;
        }

        .chart-canvas-wrapper canvas {
          max-height: 100%;
        }

        .detailed-stats {
          background: #f5f7fa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e0e0e0;
        }

        .detailed-stats h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e8e8e8;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .stat-value {
          font-size: 13px;
          color: #333;
          font-weight: 600;
        }

        .empty-message {
          text-align: center;
          padding: 48px 24px;
          color: #999;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-message p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default TimeSeriesAnalysis;
