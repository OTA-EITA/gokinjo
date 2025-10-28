/**
 * GeoJSON FeatureCollection type
 */
export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    ward_code: string;
    ward_name: string;
    name_en?: string;
    population?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Load GeoJSON data
 */
export const loadGeoJSON = async (url: string): Promise<GeoJSONFeatureCollection> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    throw error;
  }
};

/**
 * Create Leaflet GeoJSON layer with custom styling
 */
export const createGeoJSONLayer = (
  L: any,
  geojsonData: GeoJSONFeatureCollection,
  options: {
    style?: (feature: GeoJSONFeature) => any;
    onEachFeature?: (feature: GeoJSONFeature, layer: any) => void;
  } = {}
): any => {
  const defaultStyle = (feature: GeoJSONFeature) => ({
    fillColor: getWardColor(feature.properties.ward_code),
    weight: 2,
    opacity: 1,
    color: '#1890ff',
    dashArray: '3',
    fillOpacity: 0.15
  });

  const defaultOnEachFeature = (feature: GeoJSONFeature, layer: any) => {
    // Hover effect
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#40a9ff',
          fillOpacity: 0.3
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(defaultStyle(feature));
      },
      click: () => {
        // Will be handled by custom click handler
      }
    });

    // Bind popup with area information
    const popupContent = `
      <div style="padding: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">
          ${feature.properties.ward_name}
        </h3>
        <div style="font-size: 12px; color: #666;">
          <div><strong>区コード:</strong> ${feature.properties.ward_code}</div>
          ${feature.properties.population 
            ? `<div><strong>人口:</strong> ${feature.properties.population.toLocaleString()}人</div>` 
            : ''}
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    // Bind tooltip for hover
    layer.bindTooltip(feature.properties.ward_name, {
      permanent: false,
      direction: 'center',
      className: 'ward-tooltip'
    });
  };

  return L.geoJSON(geojsonData, {
    style: options.style || defaultStyle,
    onEachFeature: options.onEachFeature || defaultOnEachFeature
  });
};

/**
 * Get color for ward based on ward code
 */
const getWardColor = (wardCode: string): string => {
  const colors: Record<string, string> = {
    '13101': '#ff6b6b', // 千代田区 - Red
    '13103': '#4ecdc4', // 港区 - Teal
    '13104': '#45b7d1', // 新宿区 - Blue
    '13105': '#96ceb4', // 文京区 - Green
    '13106': '#feca57', // 台東区 - Yellow
    '13110': '#ff9ff3', // 品川区 - Pink
    '13111': '#a29bfe', // 目黒区 - Purple
    '13112': '#fd79a8', // 大田区 - Rose
    '13113': '#6c5ce7', // 世田谷区 - Indigo
    '13114': '#fdcb6e', // 渋谷区 - Orange
    '13115': '#00b894', // 中野区 - Emerald
    '13120': '#e17055', // 練馬区 - Coral
    '13122': '#74b9ff'  // 江戸川区 - Sky Blue
  };
  return colors[wardCode] || '#95a5a6';
};

/**
 * Highlight area on map
 */
export const highlightArea = (layer: any, highlight: boolean = true) => {
  if (highlight) {
    layer.setStyle({
      weight: 4,
      color: '#ff4d4f',
      fillOpacity: 0.5
    });
    layer.bringToFront();
  } else {
    // Reset to default style
    layer.setStyle({
      weight: 2,
      color: '#1890ff',
      fillOpacity: 0.15
    });
  }
};

/**
 * Fit map to area bounds
 */
export const fitToAreaBounds = (map: any, layer: any) => {
  const bounds = layer.getBounds();
  map.fitBounds(bounds, { padding: [50, 50] });
};

/**
 * Find GeoJSON feature by ward code
 */
export const findFeatureByWardCode = (
  geojsonData: GeoJSONFeatureCollection,
  wardCode: string
): GeoJSONFeature | undefined => {
  return geojsonData.features.find(
    feature => feature.properties.ward_code === wardCode
  );
};

/**
 * Create area statistics overlay
 */
export const createAreaStatsOverlay = (
  wardName: string,
  stats: {
    schools: number;
    crimes: number;
    safetyScore: number;
  }
): string => {
  const getSafetyColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#73d13d';
    if (score >= 40) return '#faad14';
    return '#ff4d4f';
  };

  return `
    <div class="area-stats-overlay">
      <h3>${wardName}</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-icon">🏫</span>
          <span class="stat-value">${stats.schools}</span>
          <span class="stat-label">学校</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🚨</span>
          <span class="stat-value">${stats.crimes}</span>
          <span class="stat-label">犯罪</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🛡️</span>
          <span class="stat-value" style="color: ${getSafetyColor(stats.safetyScore)}">
            ${stats.safetyScore.toFixed(1)}
          </span>
          <span class="stat-label">安全スコア</span>
        </div>
      </div>
      <style>
        .area-stats-overlay {
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .area-stats-overlay h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #333;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 6px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: #f5f7fa;
          border-radius: 6px;
        }
        .stat-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }
        .stat-label {
          font-size: 11px;
          color: #666;
        }
      </style>
    </div>
  `;
};
