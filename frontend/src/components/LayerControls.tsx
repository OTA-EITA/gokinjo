import React from 'react';
import type { LayerState } from '../types';
import { LABELS } from '../constants';

interface LayerControlsProps {
  layerState: LayerState;
  showBoundaries: boolean;
  filteredSchools: number;
  filteredCrimes: number;
  onLayerToggle: (layer: keyof LayerState) => void;
  onBoundariesToggle: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layerState,
  showBoundaries,
  filteredSchools,
  filteredCrimes,
  onLayerToggle,
  onBoundariesToggle
}) => {
  return (
    <div className="layer-controls">
      <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
        {LABELS.UI.LAYER_CONTROLS}
      </h3>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={layerState.showSchools}
          onChange={() => onLayerToggle('showSchools')}
        />
        {` ${LABELS.UI.SCHOOL_LAYER} (${filteredSchools}件)`}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={layerState.showCrimes}
          onChange={() => onLayerToggle('showCrimes')}
        />
        {` ${LABELS.UI.CRIME_LAYER} (${filteredCrimes}件)`}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={layerState.showSafetyScores}
          onChange={() => onLayerToggle('showSafetyScores')}
        />
        {` ${LABELS.UI.SAFETY_RANGE_LAYER}`}
      </label>
      <label className="checkbox-label heatmap-label">
        <input
          type="checkbox"
          checked={layerState.showHeatmap}
          onChange={() => onLayerToggle('showHeatmap')}
        />
        {` ${LABELS.UI.HEATMAP_LAYER}`}
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={showBoundaries}
          onChange={onBoundariesToggle}
        />
        {` Area Boundaries`}
      </label>
    </div>
  );
};
