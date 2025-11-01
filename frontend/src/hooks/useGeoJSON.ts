import { useState, useEffect, useCallback } from 'react';
import type { Area, School, Crime, SafetyScoreResult } from '../types';
import { 
  loadGeoJSON, 
  createGeoJSONLayer, 
  highlightArea, 
  fitToAreaBounds, 
  createAreaStatsOverlay 
} from '../utils/geojson';
import type { GeoJSONFeatureCollection } from '../utils/geojson';

declare const L: any;

interface UseGeoJSONProps {
  map: any | null;
  showBoundaries: boolean;
  areas: Area[];
  schools: School[];
  crimes: Crime[];
  calculatedSafetyScores: SafetyScoreResult[];
  onAreaSelect: (area: Area) => void;
}

export const useGeoJSON = ({
  map,
  showBoundaries,
  areas,
  schools,
  crimes,
  calculatedSafetyScores,
  onAreaSelect
}: UseGeoJSONProps) => {
  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [geojsonLayer, setGeojsonLayer] = useState<any | null>(null);

  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        const data = await loadGeoJSON('/geojson/tokyo_wards.geojson');
        setGeojsonData(data);
        console.log(`Loaded GeoJSON with ${data.features.length} wards`);
      } catch (error) {
        console.error('Failed to load GeoJSON:', error);
      }
    };

    loadBoundaries();
  }, []);

  useEffect(() => {
    if (!map || !geojsonData) return;

    if (geojsonLayer && map.hasLayer(geojsonLayer)) {
      map.removeLayer(geojsonLayer);
    }

    if (showBoundaries) {
      const layer = createGeoJSONLayer(L, geojsonData, {
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            const wardCode = feature.properties.ward_code;
            const area = areas.find(a => a.ward_code === wardCode);
            if (area) {
              onAreaSelect(area);
              fitToAreaBounds(map, layer);
            }
          });

          layer.on('mouseover', (e: any) => {
            highlightArea(e.target, true);
            
            const wardCode = feature.properties.ward_code;
            const areaSchools = schools.filter(s => {
              const schoolArea = areas.find(a => a.id === s.area_id);
              return schoolArea?.ward_code === wardCode;
            });
            const areaCrimes = crimes.filter(c => {
              const crimeArea = areas.find(a => a.id === c.area_id);
              return crimeArea?.ward_code === wardCode;
            });
            const avgScore = calculatedSafetyScores.length > 0
              ? calculatedSafetyScores
                  .filter(s => areaSchools.some(as => as.id === s.school_id))
                  .reduce((sum, s) => sum + s.score, 0) / Math.max(1, calculatedSafetyScores.filter(s => areaSchools.some(as => as.id === s.school_id)).length)
              : 75;

            const overlay = createAreaStatsOverlay(
              feature.properties.ward_name,
              {
                schools: areaSchools.length,
                crimes: areaCrimes.length,
                safetyScore: avgScore
              }
            );
            e.target.bindPopup(overlay).openPopup();
          });

          layer.on('mouseout', (e: any) => {
            highlightArea(e.target, false);
          });
        }
      });

      layer.addTo(map);
      setGeojsonLayer(layer);
      console.log('GeoJSON boundaries added to map');
    } else {
      setGeojsonLayer(null);
    }
  }, [map, geojsonData, showBoundaries, areas, schools, crimes, calculatedSafetyScores, onAreaSelect]);

  return {
    geojsonData,
    geojsonLayer
  };
};
