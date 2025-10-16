import React, { useState, useEffect, useRef } from 'react';
import { AreaComparisonData } from '../types';
import { createOrUpdateChart, getAreaComparisonRadarConfig, getAreaComparisonBarConfig } from '../utils/charts';

interface AreaComparisonProps {
  areas: AreaComparisonData[];
  onExportCSV: (selectedAreas: AreaComparisonData[]) => void;
  maxAreasToCompare?: number;
}

type SortKey = keyof AreaComparisonData | 'none';
type SortOrder = 'asc' | 'desc';

const AreaComparison: React.FC<AreaComparisonProps> = ({
  areas,
  onExportCSV,
  maxAreasToCompare = 4
}) => {
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('avg_safety_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAll, setShowAll] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [chartInstances, setChartInstances] = useState<Record<string, any>>({});
  
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);

  const handleAreaSelect = (areaId: number) => {
    if (selectedAreaIds.includes(areaId)) {
      setSelectedAreaIds(selectedAreaIds.filter(id => id !== areaId));
    } else if (selectedAreaIds.length < maxAreasToCompare) {
      setSelectedAreaIds([...selectedAreaIds, areaId]);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getSortedAreas = () => {
    if (sortKey === 'none') return areas;

    return [...areas].sort((a, b) => {
      const aVal = a[sortKey as keyof AreaComparisonData];
      const bVal = b[sortKey as keyof AreaComparisonData];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  };

  const selectedAreas = areas.filter(a => selectedAreaIds.includes(a.area_id));
  const displayAreas = showAll ? getSortedAreas() : getSortedAreas().slice(0, 5);

  // Initialize/update charts when selected areas change
  useEffect(() => {
    if (selectedAreas.length > 0 && showCharts) {
      // Radar chart
      if (radarChartRef.current) {
        const radarConfig = getAreaComparisonRadarConfig(selectedAreas);
        createOrUpdateChart(
          'areaRadarChart',
          radarConfig.type,
          radarConfig.data,
          radarConfig.options,
          chartInstances,
          setChartInstances
        );
      }

      // Bar chart
      if (barChartRef.current) {
        const barConfig = getAreaComparisonBarConfig(selectedAreas);
        createOrUpdateChart(
          'areaBarChart',
          barConfig.type,
          barConfig.data,
          barConfig.options,
          chartInstances,
          setChartInstances
        );
      }
    }

    return () => {
      // Cleanup charts on unmount
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
  }, [selectedAreas, showCharts]);

  const handleExportSelected = () => {
    onExportCSV(selectedAreas.length > 0 ? selectedAreas : areas);
  };

  const getSafetyColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#73d13d';
    if (score >= 40) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="area-comparison">
      <div className="comparison-header">
        <h3>Area Comparison</h3>
        <div className="header-info">
          <span className="info-text">
            Select up to {maxAreasToCompare} areas to compare
          </span>
          <span className="selected-count">
            {selectedAreaIds.length} / {maxAreasToCompare} selected
          </span>
        </div>
      </div>

      {/* Area Selection List */}
      <div className="area-selection-list">
        <div className="list-header">
          <span>Available Areas ({areas.length})</span>
          <button 
            className="toggle-all-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        </div>
        <div className="area-items">
          {displayAreas.map(area => (
            <div
              key={area.area_id}
              className={`area-select-item ${selectedAreaIds.includes(area.area_id) ? 'selected' : ''}`}
              onClick={() => handleAreaSelect(area.area_id)}
            >
              <div className="area-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAreaIds.includes(area.area_id)}
                  onChange={() => {}}
                  disabled={!selectedAreaIds.includes(area.area_id) && selectedAreaIds.length >= maxAreasToCompare}
                />
              </div>
              <div className="area-info">
                <div className="area-name">{area.area_name}</div>
                <div className="area-stats">
                  <span>Schools: {area.school_count}</span>
                  <span>Crimes: {area.crime_count}</span>
                  <span 
                    className="safety-badge"
                    style={{ backgroundColor: getSafetyColor(area.avg_safety_score) }}
                  >
                    Score: {area.avg_safety_score.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {/* Visualization Charts */}
      {selectedAreas.length > 0 && (
        <div className="comparison-charts">
          <div className="charts-header">
            <h4>Visualization</h4>
            <button 
              className="toggle-charts-btn"
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>
          
          {showCharts && (
            <div className="charts-grid">
              <div className="chart-box">
                <h5>Radar Chart - Multi-dimensional Comparison</h5>
                <canvas id="areaRadarChart" ref={radarChartRef} />
              </div>
              <div className="chart-box">
                <h5>Bar Chart - Direct Comparison</h5>
                <canvas id="areaBarChart" ref={barChartRef} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {selectedAreas.length > 0 && (
        <div className="comparison-table-container">
          <div className="table-header">
            <h4>Comparison Results</h4>
            <button className="export-btn" onClick={handleExportSelected}>
              Export CSV
            </button>
          </div>
          <div className="comparison-table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('area_name')}
                  >
                    Area {sortKey === 'area_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('school_count')}
                  >
                    Schools {sortKey === 'school_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('crime_count')}
                  >
                    Crimes {sortKey === 'crime_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('avg_safety_score')}
                  >
                    Avg Score {sortKey === 'avg_safety_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable"
                    onClick={() => handleSort('crime_rate_per_school')}
                  >
                    Crime/School {sortKey === 'crime_rate_per_school' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Common Crime</th>
                  <th>Safest School</th>
                </tr>
              </thead>
              <tbody>
                {selectedAreas.map(area => (
                  <tr key={area.area_id}>
                    <td className="area-name-cell">{area.area_name}</td>
                    <td className="number-cell">{area.school_count}</td>
                    <td className="number-cell">{area.crime_count}</td>
                    <td 
                      className="score-cell"
                      style={{ color: getSafetyColor(area.avg_safety_score) }}
                    >
                      <strong>{area.avg_safety_score.toFixed(1)}</strong>
                    </td>
                    <td className="number-cell">{area.crime_rate_per_school.toFixed(2)}</td>
                    <td className="text-cell">{area.most_common_crime || 'N/A'}</td>
                    <td className="text-cell">{area.safest_school || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAreas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Select areas from the list above to compare</p>
        </div>
      )}

      <style>{`
        .area-comparison {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 15px 0;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .comparison-header h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
        }

        .selected-count {
          background: #e7f3ff;
          color: #1890ff;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .area-selection-list {
          margin-bottom: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }

        .toggle-all-btn {
          background: none;
          border: 1px solid #d0d0d0;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          color: #555;
          transition: all 0.2s;
        }

        .toggle-all-btn:hover {
          background: #1890ff;
          border-color: #1890ff;
          color: white;
        }

        .area-items {
          max-height: 300px;
          overflow-y: auto;
        }

        .area-select-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .area-select-item:last-child {
          border-bottom: none;
        }

        .area-select-item:hover {
          background: #f8f9fa;
        }

        .area-select-item.selected {
          background: #e7f3ff;
          border-left: 3px solid #1890ff;
        }

        .area-checkbox {
          margin-right: 12px;
        }

        .area-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #1890ff;
        }

        .area-info {
          flex: 1;
        }

        .area-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .area-stats {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: #666;
        }

        .safety-badge {
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .comparison-table-container {
          margin-top: 16px;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .table-header h4 {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .export-btn {
          background: #52c41a;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .export-btn:hover {
          background: #73d13d;
        }

        .comparison-table-scroll {
          overflow-x: auto;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .comparison-table th {
          background: #f5f5f5;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #e0e0e0;
          white-space: nowrap;
        }

        .comparison-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .comparison-table th.sortable:hover {
          background: #e7f3ff;
          color: #1890ff;
        }

        .comparison-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .comparison-table tr:last-child td {
          border-bottom: none;
        }

        .comparison-table tr:hover {
          background: #f8f9fa;
        }

        .area-name-cell {
          font-weight: 600;
          color: #333;
        }

        .number-cell {
          text-align: center;
          color: #555;
        }

        .score-cell {
          text-align: center;
          font-weight: 600;
        }

        .text-cell {
          color: #666;
          font-size: 11px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        /* Comparison Charts */
        .comparison-charts {
          margin: 16px 0;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 16px;
        }

        .charts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e0e0e0;
        }

        .charts-header h4 {
          margin: 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .toggle-charts-btn {
          background: #1890ff;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-charts-btn:hover {
          background: #40a9ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
        }

        @media (max-width: 1400px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-box {
          background: #fafafa;
          border-radius: 6px;
          padding: 16px;
          border: 1px solid #e8e8e8;
        }

        .chart-box h5 {
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #666;
          font-weight: 600;
          text-align: center;
        }

        .chart-box canvas {
          max-height: 300px;
        }
      `}</style>
    </div>
  );
};

export default AreaComparison;
