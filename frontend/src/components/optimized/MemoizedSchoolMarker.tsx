import React, { memo } from 'react';
import type { School, SafetyScore, SafetyScoreResult } from '../../types';
import { ICON_CONFIG } from '../../constants';
import { 
  getSchoolIcon, 
  getSafetyLevelLabel, 
  getSchoolTypeLabel, 
  getPublicPrivateLabel 
} from '../../utils/helpers';

interface MemoizedSchoolMarkerProps {
  school: School;
  calculatedScore?: SafetyScoreResult;
  apiScore?: SafetyScore;
  L: any;
  markerClusterGroup: any;
}

const MemoizedSchoolMarker: React.FC<MemoizedSchoolMarkerProps> = memo(({
  school,
  calculatedScore,
  apiScore,
  L,
  markerClusterGroup
}) => {
  if (!school.latitude || !school.longitude) {
    return null;
  }

  let scoreText = '';
  if (calculatedScore) {
    scoreText = `<br/><strong>安全スコア: ${calculatedScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(calculatedScore.score_level)})`
      + `<br/>周辺犯罪: ${calculatedScore.crime_count}件`
      + `<br/>犯罪密度: ${calculatedScore.crime_density.toFixed(2)}/km²`;
  } else if (apiScore) {
    scoreText = `<br/><strong>安全スコア: ${apiScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(apiScore.score_level)})`;
  }

  const icon = L.icon({
    iconUrl: getSchoolIcon(school),
    iconSize: ICON_CONFIG.SIZES.SCHOOL,
    iconAnchor: ICON_CONFIG.SIZES.ANCHOR_SCHOOL,
    popupAnchor: ICON_CONFIG.SIZES.POPUP_ANCHOR
  });

  const marker = L.marker([school.latitude, school.longitude], { icon })
    .bindPopup(`
      <div>
        <strong>${school.name}</strong><br/>
        種別: ${getSchoolTypeLabel(school.type)}<br/>
        ${getPublicPrivateLabel(school.public_private)}<br/>
        住所: ${school.address}${scoreText}
      </div>
    `);

  markerClusterGroup.addLayer(marker);

  return null;
}, (prevProps, nextProps) => {
  return (
    prevProps.school.id === nextProps.school.id &&
    prevProps.school.latitude === nextProps.school.latitude &&
    prevProps.school.longitude === nextProps.school.longitude &&
    prevProps.calculatedScore?.score === nextProps.calculatedScore?.score &&
    prevProps.apiScore?.score === nextProps.apiScore?.score
  );
});

MemoizedSchoolMarker.displayName = 'MemoizedSchoolMarker';

export default MemoizedSchoolMarker;
