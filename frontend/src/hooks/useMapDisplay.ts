import { useCallback } from 'react';
import type { School, Crime, SafetyScore, SafetyScoreResult, LayerState } from '../types';
import { 
  MAP_CONFIG, 
  HEATMAP_CONFIG, 
  ICON_CONFIG, 
  SAFETY_CONFIG 
} from '../constants';
import {
  getSchoolIcon,
  getCrimeIcon,
  getSafetyScoreColor,
  getSafetyLevelLabel,
  getSchoolTypeLabel,
  getPublicPrivateLabel,
  prepareHeatmapData
} from '../utils/helpers';

declare const L: any;

interface UseMapDisplayProps {
  map: any | null;
  layerState: LayerState;
  filteredSchools: School[];
  filteredCrimes: Crime[];
  filteredSafetyScores: SafetyScore[];
  calculatedSafetyScores: SafetyScoreResult[];
  schoolMarkers: any | null;
  crimeMarkers: any | null;
  safetyCircles: any | null;
  heatmapLayer: any | null;
  setSchoolMarkers: (markers: any) => void;
  setCrimeMarkers: (markers: any) => void;
  setSafetyCircles: (circles: any) => void;
  setHeatmapLayer: (layer: any) => void;
}

export const useMapDisplay = ({
  map,
  layerState,
  filteredSchools,
  filteredCrimes,
  filteredSafetyScores,
  calculatedSafetyScores,
  schoolMarkers,
  crimeMarkers,
  safetyCircles,
  heatmapLayer,
  setSchoolMarkers,
  setCrimeMarkers,
  setSafetyCircles,
  setHeatmapLayer
}: UseMapDisplayProps) => {
  
  const displayDataOnMap = useCallback((): void => {
    if (!map) return;

    [schoolMarkers, crimeMarkers, safetyCircles, heatmapLayer].forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setSchoolMarkers(null);
    setCrimeMarkers(null);
    setSafetyCircles(null);
    setHeatmapLayer(null);

    if (layerState.showSchools && filteredSchools.length > 0) {
      const schoolMarkersGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: any) {
          const childCount = cluster.getChildCount();
          let className = 'marker-cluster marker-cluster-';
          if (childCount < 5) {
            className += 'small';
          } else if (childCount < 10) {
            className += 'medium';
          } else {
            className += 'large';
          }
          return L.divIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: className,
            iconSize: L.point(40, 40)
          });
        }
      });

      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          const calculatedScore = calculatedSafetyScores.find((s: SafetyScoreResult) => s.school_id === school.id);
          const apiScore = filteredSafetyScores.find((s: SafetyScore) => s.school_id === school.id);
          
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

          schoolMarkersGroup.addLayer(marker);
        }
      });

      schoolMarkersGroup.addTo(map);
      setSchoolMarkers(schoolMarkersGroup);
    }

    if (layerState.showCrimes && filteredCrimes.length > 0) {
      const crimeMarkersGroup = L.markerClusterGroup({
        maxClusterRadius: 30,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: any) {
          const childCount = cluster.getChildCount();
          return L.divIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster marker-cluster-crime',
            iconSize: L.point(35, 35)
          });
        }
      });

      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
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

          crimeMarkersGroup.addLayer(marker);
        }
      });

      crimeMarkersGroup.addTo(map);
      setCrimeMarkers(crimeMarkersGroup);
    }

    if (layerState.showSafetyScores && filteredSafetyScores.length > 0) {
      const safetyCirclesGroup = L.layerGroup();

      filteredSafetyScores.forEach((score: SafetyScore) => {
        const school = filteredSchools.find((s: School) => s.id === score.school_id);
        if (school && school.latitude && school.longitude) {
          const circle = L.circle([school.latitude, school.longitude], {
            color: getSafetyScoreColor(score.score),
            fillColor: getSafetyScoreColor(score.score),
            fillOpacity: SAFETY_CONFIG.CIRCLE_STYLE.fillOpacity,
            weight: SAFETY_CONFIG.CIRCLE_STYLE.weight,
            radius: score.radius_meters
          }).bindPopup(`
            <div>
              <strong>${school.name}</strong><br/>
              安全スコア: ${score.score.toFixed(1)}<br/>
              周辺犯罪件数: ${score.crime_count}件<br/>
              調査範囲: 半径${score.radius_meters}m
            </div>
          `);

          safetyCirclesGroup.addLayer(circle);
        }
      });

      safetyCirclesGroup.addTo(map);
      setSafetyCircles(safetyCirclesGroup);
    }

    if (layerState.showHeatmap && filteredCrimes.length > 0) {
      const heatmapData = prepareHeatmapData(filteredCrimes);
      
      if (heatmapData.length > 0 && window.L && window.L.heatLayer) {
        const heatLayer = window.L.heatLayer(heatmapData, {
          radius: HEATMAP_CONFIG.RADIUS,
          blur: HEATMAP_CONFIG.BLUR,
          maxZoom: HEATMAP_CONFIG.MAX_ZOOM,
          max: HEATMAP_CONFIG.MAX_INTENSITY,
          gradient: HEATMAP_CONFIG.GRADIENT
        });
        
        heatLayer.addTo(map);
        setHeatmapLayer(heatLayer);
      } else {
        console.warn('Heatmap library not loaded');
      }
    }

    const allMarkers: any[] = [];
    if (layerState.showSchools && filteredSchools.length > 0) {
      filteredSchools.forEach((school: School) => {
        if (school.latitude && school.longitude) {
          allMarkers.push(L.marker([school.latitude, school.longitude]));
        }
      });
    }
    if (layerState.showCrimes && filteredCrimes.length > 0) {
      filteredCrimes.forEach((crime: Crime) => {
        if (crime.latitude && crime.longitude) {
          allMarkers.push(L.marker([crime.latitude, crime.longitude]));
        }
      });
    }

    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(MAP_CONFIG.FIT_BOUNDS_PADDING));
    }
  }, [
    map, 
    layerState, 
    filteredSchools, 
    filteredCrimes, 
    filteredSafetyScores, 
    calculatedSafetyScores,
    schoolMarkers,
    crimeMarkers,
    safetyCircles,
    heatmapLayer,
    setSchoolMarkers,
    setCrimeMarkers,
    setSafetyCircles,
    setHeatmapLayer
  ]);

  return {
    displayDataOnMap
  };
};
