import React from 'react';
import type { Area } from '../types';
import { LABELS } from '../constants';

interface AreasListProps {
  areas: Area[];
  selectedArea: Area | null;
  onAreaClick: (area: Area) => void;
}

export const AreasList: React.FC<AreasListProps> = ({
  areas,
  selectedArea,
  onAreaClick
}) => {
  return (
    <div className="areas-list">
      <h3 style={{marginTop: 0, marginBottom: '12px', color: '#333', fontSize: '16px'}}>
        {LABELS.UI.AREA_SELECTION}
      </h3>
      {areas.map((area: Area) =>
        <div
          key={area.id}
          className={`area-item ${selectedArea?.id === area.id ? 'selected' : ''}`}
          onClick={() => onAreaClick(area)}
        >
          <strong>{area.name}</strong>
          <br />
          <small>Ward: {area.ward_code}, Town: {area.town_code}</small>
        </div>
      )}
    </div>
  );
};
