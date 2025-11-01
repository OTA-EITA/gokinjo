import { useState, useEffect, useCallback } from 'react';
import { MAP_CONFIG } from '../constants';

declare const L: any;

interface UseMapReturn {
  map: any | null;
  currentTileLayer: any | null;
  schoolMarkers: any | null;
  crimeMarkers: any | null;
  safetyCircles: any | null;
  heatmapLayer: any | null;
  setSchoolMarkers: (markers: any) => void;
  setCrimeMarkers: (markers: any) => void;
  setSafetyCircles: (circles: any) => void;
  setHeatmapLayer: (layer: any) => void;
  initializeMap: () => void;
  changeTileLayer: (mode: string, animationEnabled: boolean) => void;
}

export const useMap = (): UseMapReturn => {
  const [map, setMap] = useState<any | null>(null);
  const [currentTileLayer, setCurrentTileLayer] = useState<any | null>(null);
  const [schoolMarkers, setSchoolMarkers] = useState<any | null>(null);
  const [crimeMarkers, setCrimeMarkers] = useState<any | null>(null);
  const [safetyCircles, setSafetyCircles] = useState<any | null>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<any>(null);

  const initializeMap = useCallback((): void => {
    try {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('Map container not found');
        return;
      }
      
      if ((mapContainer as any)._leaflet_id) {
        console.log('Map already initialized, skipping...');
        return;
      }

      if (typeof L === 'undefined') {
        console.error('Leaflet is not loaded');
        return;
      }

      const mapInstance = L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

      const initialTileLayer = L.tileLayer(MAP_CONFIG.TILE_LAYERS.standard.url, {
        attribution: MAP_CONFIG.TILE_LAYERS.standard.attribution,
        maxZoom: 18
      });
      initialTileLayer.addTo(mapInstance);
      setCurrentTileLayer(initialTileLayer);

      setMap(mapInstance);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, []);

  const changeTileLayer = useCallback((mode: string, animationEnabled: boolean) => {
    if (!map) return;

    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }

    const tileConfig = MAP_CONFIG.TILE_LAYERS[mode];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 18,
      fadeAnimation: animationEnabled
    });

    newTileLayer.addTo(map);
    setCurrentTileLayer(newTileLayer);

    console.log(`Map style changed to: ${mode}`);
  }, [map, currentTileLayer]);

  return {
    map,
    currentTileLayer,
    schoolMarkers,
    crimeMarkers,
    safetyCircles,
    heatmapLayer,
    setSchoolMarkers,
    setCrimeMarkers,
    setSafetyCircles,
    setHeatmapLayer,
    initializeMap,
    changeTileLayer
  };
};
