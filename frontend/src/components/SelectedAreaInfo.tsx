import React from 'react';
import type { Area, School, SafetyScoreResult } from '../types';
import { LABELS } from '../constants';

interface SelectedAreaInfoProps {
  selectedArea: Area;
  filteredSchools: School[];
  filteredCrimes: number;
  calculatedSafetyScores: SafetyScoreResult[];
  schools: School[];
}

export const SelectedAreaInfo: React.FC<SelectedAreaInfoProps> = ({
  selectedArea,
  filteredSchools,
  filteredCrimes,
  calculatedSafetyScores,
  schools
}) => {
  return (
    <div className="selected-area">
      <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
        {`${LABELS.UI.SELECTED_PREFIX}${selectedArea.name}`}
      </h3>
      <p>学校: {filteredSchools.length}件 | 犯罪: {filteredCrimes}件</p>
      {calculatedSafetyScores.length > 0 && (
        <div style={{marginTop: '12px', padding: '10px', background: '#f0f7ff', borderRadius: '4px', border: '1px solid #bae7ff'}}>
          <h4 style={{margin: '0 0 8px 0', fontSize: '13px', color: '#1890ff'}}>
            Safety Score Summary
          </h4>
          <div style={{fontSize: '12px', color: '#555'}}>
            <div>計算済み: {calculatedSafetyScores.length} / {schools.length}校</div>
            <div>平均スコア: {(calculatedSafetyScores.reduce((sum, s) => sum + s.score, 0) / calculatedSafetyScores.length).toFixed(1)}</div>
            <div>総犯罪件数: {calculatedSafetyScores.reduce((sum, s) => sum + s.crime_count, 0)}件</div>
            <div style={{marginTop: '6px'}}>
              <span style={{color: '#52c41a', marginRight: '8px'}}>Very Safe: {calculatedSafetyScores.filter(s => s.score_level === 'very_safe').length}</span>
              <span style={{color: '#73d13d', marginRight: '8px'}}>Safe: {calculatedSafetyScores.filter(s => s.score_level === 'safe').length}</span>
            </div>
            <div>
              <span style={{color: '#faad14', marginRight: '8px'}}>Moderate: {calculatedSafetyScores.filter(s => s.score_level === 'moderate').length}</span>
              <span style={{color: '#ff4d4f'}}>Caution: {calculatedSafetyScores.filter(s => s.score_level === 'caution').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
