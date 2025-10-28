import React, { memo } from 'react';
import type { Crime } from '../../types';
import { ICON_CONFIG } from '../../constants';
import { getCrimeIcon } from '../../utils/helpers';

interface MemoizedCrimeMarkerProps {
  crime: Crime;
  L: any;
  markerClusterGroup: any;
}

const MemoizedCrimeMarker: React.FC<MemoizedCrimeMarkerProps> = memo(({
  crime,
  L,
  markerClusterGroup
}) => {
  if (!crime.latitude || !crime.longitude) {
    return null;
  }

  const icon = L.icon({
    iconUrl: getCrimeIcon(crime),
    iconSize: ICON_CONFIG.SIZES.CRIME,
    iconAnchor: ICON_CONFIG.SIZES.ANCHOR_CRIME,
    popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR_CRIME
  });

  const marker = L.marker([crime.latitude, crime.longitude], { icon })
    .bindPopup(`
      <div>
        <strong>${crime.category}</strong><br/>
        日付: ${crime.date}<br/>
        詳細: ${crime.description}
      </div>
    `);

  markerClusterGroup.addLayer(marker);

  return null;
}, (prevProps, nextProps) => {
  return (
    prevProps.crime.id === nextProps.crime.id &&
    prevProps.crime.latitude === nextProps.crime.latitude &&
    prevProps.crime.longitude === nextProps.crime.longitude &&
    prevProps.crime.category === nextProps.crime.category
  );
});

MemoizedCrimeMarker.displayName = 'MemoizedCrimeMarker';

export default MemoizedCrimeMarker;
