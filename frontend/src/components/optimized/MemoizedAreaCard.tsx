import React, { memo } from 'react';
import type { Area } from '../../types';

interface MemoizedAreaCardProps {
  area: Area;
  isSelected: boolean;
  onClick: (area: Area) => void;
}

const MemoizedAreaCard: React.FC<MemoizedAreaCardProps> = memo(({
  area,
  isSelected,
  onClick
}) => {
  return (
    <div
      className={`area-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(area)}
    >
      <strong>{area.name}</strong>
      <br />
      <small>Ward: {area.ward_code}, Town: {area.town_code}</small>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.area.id === nextProps.area.id &&
    prevProps.area.name === nextProps.area.name &&
    prevProps.isSelected === nextProps.isSelected
  );
});

MemoizedAreaCard.displayName = 'MemoizedAreaCard';

export default MemoizedAreaCard;
