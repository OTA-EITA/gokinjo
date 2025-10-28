import React, { useState, useEffect } from 'react';
import { Crime, School } from '../types';

interface RoutePoint {
  lat: number;
  lng: number;
  label: string;
}

interface SafeRoute {
  distance: number;
  safetyScore: number;
  estimatedTime: number;
  avoidedCrimes: number;
  path: [number, number][];
}

interface SafeRouteSearchProps {
  schools: School[];
  crimes: Crime[];
  map: any;
  L: any;
}

const SafeRouteSearch: React.FC<SafeRouteSearchProps> = ({
  schools,
  crimes,
  map,
  L
}) => {
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [endPoint, setEndPoint] = useState<RoutePoint | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [routeType, setRouteType] = useState<'safest' | 'fastest' | 'balanced'>('safest');
  const [calculatedRoute, setCalculatedRoute] = useState<SafeRoute | null>(null);
  const [routeLayer, setRouteLayer] = useState<any>(null);
  const [markersLayer, setMarkersLayer] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // マップクリックで地点設定
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: any) => {
      if (!startPoint) {
        setStartPoint({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          label: '出発地'
        });
      } else if (!endPoint) {
        setEndPoint({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          label: '目的地'
        });
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, startPoint, endPoint]);

  // マーカー表示
  useEffect(() => {
    if (!map || !L) return;

    // 既存マーカー削除
    if (markersLayer) {
      map.removeLayer(markersLayer);
    }

    const markers = L.layerGroup();

    // 出発地マーカー
    if (startPoint) {
      const startMarker = L.marker([startPoint.lat, startPoint.lng], {
        icon: L.divIcon({
          className: 'route-marker start-marker',
          html: '<div>🏠</div>',
          iconSize: [30, 30]
        })
      }).bindPopup(startPoint.label);
      markers.addLayer(startMarker);
    }

    // 目的地マーカー
    if (endPoint) {
      const endMarker = L.marker([endPoint.lat, endPoint.lng], {
        icon: L.divIcon({
          className: 'route-marker end-marker',
          html: '<div>🎯</div>',
          iconSize: [30, 30]
        })
      }).bindPopup(endPoint.label);
      markers.addLayer(endMarker);
    }

    markers.addTo(map);
    setMarkersLayer(markers);

    return () => {
      if (markersLayer) {
        map.removeLayer(markersLayer);
      }
    };
  }, [map, L, startPoint, endPoint]);

  // 学校選択ハンドラー
  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
    const school = schools.find(s => s.id === parseInt(schoolId));
    if (school && school.latitude && school.longitude) {
      setEndPoint({
        lat: school.latitude,
        lng: school.longitude,
        label: school.name
      });
    }
  };

  // ルート計算
  const calculateRoute = () => {
    if (!startPoint || !endPoint) {
      alert('出発地と目的地を設定してください');
      return;
    }

    setIsCalculating(true);

    try {
      // 犯罪密度マップを作成
      const crimeHotspots = createCrimeHeatmap();

      // ルート計算（簡易版 - 直線距離ベース）
      const route = computeSafeRoute(
        startPoint,
        endPoint,
        crimeHotspots
      );

      setCalculatedRoute(route);

      // ルートを地図に描画
      displayRoute(route);

      setIsCalculating(false);
    } catch (error) {
      console.error('ルート計算エラー:', error);
      alert('ルート計算に失敗しました');
      setIsCalculating(false);
    }
  };

  // 犯罪ヒートマップ作成
  const createCrimeHeatmap = () => {
    const hotspots: Map<string, number> = new Map();

    crimes.forEach(crime => {
      if (crime.latitude && crime.longitude) {
        // 100mグリッドに分割
        const gridKey = `${Math.floor(crime.latitude * 100)},${Math.floor(crime.longitude * 100)}`;
        hotspots.set(gridKey, (hotspots.get(gridKey) || 0) + 1);
      }
    });

    return hotspots;
  };

  // 安全ルート計算
  const computeSafeRoute = (
    start: RoutePoint,
    end: RoutePoint,
    crimeHotspots: Map<string, number>
  ): SafeRoute => {
    // 簡易版: 直線ルートで犯罪密度を評価
    const path: [number, number][] = [];
    const steps = 20; // ウェイポイント数

    let totalCrimes = 0;

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const lat = start.lat + (end.lat - start.lat) * ratio;
      const lng = start.lng + (end.lng - start.lng) * ratio;
      
      path.push([lat, lng]);

      // この地点の犯罪件数をチェック
      const gridKey = `${Math.floor(lat * 100)},${Math.floor(lng * 100)}`;
      totalCrimes += crimeHotspots.get(gridKey) || 0;
    }

    // 距離計算（Haversine formula）
    const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);

    // 安全スコア計算
    const maxCrimes = crimes.length / 10; // 想定最大犯罪遭遇数
    const safetyScore = Math.max(0, 100 - (totalCrimes / maxCrimes) * 100);

    // 推定時間（徒歩4km/h）
    const estimatedTime = (distance / 4) * 60; // 分

    return {
      distance: Math.round(distance * 1000), // メートル
      safetyScore: Math.round(safetyScore),
      estimatedTime: Math.round(estimatedTime),
      avoidedCrimes: totalCrimes,
      path
    };
  };

  // 距離計算（Haversine formula）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ルート描画
  const displayRoute = (route: SafeRoute) => {
    if (!map || !L) return;

    // 既存ルート削除
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    // 安全スコアに応じた色
    const routeColor = route.safetyScore >= 80 ? '#52c41a' :
                      route.safetyScore >= 60 ? '#faad14' :
                      route.safetyScore >= 40 ? '#ff7875' : '#ff4d4f';

    const polyline = L.polyline(route.path, {
      color: routeColor,
      weight: 6,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map);

    polyline.bindPopup(`
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0;">ルート情報</h4>
        <div><strong>距離:</strong> ${route.distance}m</div>
        <div><strong>推定時間:</strong> ${route.estimatedTime}分</div>
        <div><strong>安全スコア:</strong> <span style="color: ${routeColor}; font-weight: bold;">${route.safetyScore}</span></div>
        <div><strong>周辺犯罪:</strong> ${route.avoidedCrimes}件</div>
      </div>
    `);

    setRouteLayer(polyline);

    // ルート全体を表示
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  };

  // リセット
  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setSelectedSchool('');
    setCalculatedRoute(null);

    if (routeLayer && map) {
      map.removeLayer(routeLayer);
      setRouteLayer(null);
    }

    if (markersLayer && map) {
      map.removeLayer(markersLayer);
      setMarkersLayer(null);
    }
  };

  return (
    <div className="safe-route-search">
      <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
        🚶 安全ルート検索
      </h3>

      {/* 学校選択 */}
      <div className="route-input-group">
        <label>目的地（学校）:</label>
        <select
          value={selectedSchool}
          onChange={(e) => handleSchoolSelect(e.target.value)}
          className="route-select"
        >
          <option value="">-- 学校を選択 --</option>
          {schools.map(school => (
            <option key={school.id} value={school.id}>
              {school.name} ({school.type})
            </option>
          ))}
        </select>
      </div>

      {/* マップクリック案内 */}
      <div className="route-instruction">
        {!startPoint && '地図をクリックして出発地を設定'}
        {startPoint && !endPoint && '地図をクリックして目的地を設定（または上で学校選択）'}
        {startPoint && endPoint && 'ルート計算準備完了'}
      </div>

      {/* 地点情報 */}
      {startPoint && (
        <div className="route-point start">
          🏠 出発地: ({startPoint.lat.toFixed(4)}, {startPoint.lng.toFixed(4)})
        </div>
      )}
      {endPoint && (
        <div className="route-point end">
          🎯 目的地: {endPoint.label}
        </div>
      )}

      {/* ルートタイプ選択 */}
      <div className="route-type-selector">
        <label>ルート優先度:</label>
        <div className="route-type-buttons">
          <button
            className={`route-type-btn ${routeType === 'safest' ? 'active' : ''}`}
            onClick={() => setRouteType('safest')}
          >
            最も安全
          </button>
          <button
            className={`route-type-btn ${routeType === 'balanced' ? 'active' : ''}`}
            onClick={() => setRouteType('balanced')}
          >
            バランス
          </button>
          <button
            className={`route-type-btn ${routeType === 'fastest' ? 'active' : ''}`}
            onClick={() => setRouteType('fastest')}
          >
            最短距離
          </button>
        </div>
      </div>

      {/* ルート計算ボタン */}
      <button
        onClick={calculateRoute}
        disabled={!startPoint || !endPoint || isCalculating}
        className="calculate-route-btn"
      >
        {isCalculating ? '計算中...' : 'ルート計算'}
      </button>

      {/* 計算結果 */}
      {calculatedRoute && (
        <div className="route-result">
          <h4>計算結果</h4>
          <div className="route-stats">
            <div className="route-stat">
              <span className="stat-label">距離:</span>
              <span className="stat-value">{calculatedRoute.distance}m</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">推定時間:</span>
              <span className="stat-value">{calculatedRoute.estimatedTime}分</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">安全スコア:</span>
              <span className={`stat-value safety-score-${
                calculatedRoute.safetyScore >= 80 ? 'high' :
                calculatedRoute.safetyScore >= 60 ? 'medium' : 'low'
              }`}>
                {calculatedRoute.safetyScore}
              </span>
            </div>
            <div className="route-stat">
              <span className="stat-label">周辺犯罪:</span>
              <span className="stat-value">{calculatedRoute.avoidedCrimes}件</span>
            </div>
          </div>
        </div>
      )}

      {/* リセットボタン */}
      <button onClick={handleReset} className="reset-route-btn">
        リセット
      </button>

      <style>{`
        .safe-route-search {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          border: 1px solid #dee2e6;
        }

        .route-input-group {
          margin: 12px 0;
        }

        .route-input-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 6px;
          font-size: 13px;
          color: #555;
        }

        .route-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .route-instruction {
          background: #e7f3ff;
          border: 1px solid #1890ff;
          border-radius: 4px;
          padding: 10px;
          margin: 12px 0;
          font-size: 12px;
          color: #0050b3;
          text-align: center;
        }

        .route-point {
          padding: 8px;
          margin: 6px 0;
          border-radius: 4px;
          font-size: 12px;
        }

        .route-point.start {
          background: #f0f7ff;
          border-left: 3px solid #1890ff;
        }

        .route-point.end {
          background: #f6ffed;
          border-left: 3px solid #52c41a;
        }

        .route-type-selector {
          margin: 12px 0;
        }

        .route-type-buttons {
          display: flex;
          gap: 6px;
          margin-top: 6px;
        }

        .route-type-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .route-type-btn:hover {
          background: #f0f7ff;
          border-color: #1890ff;
        }

        .route-type-btn.active {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }

        .calculate-route-btn {
          width: 100%;
          padding: 12px;
          background: #52c41a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          margin-top: 12px;
          transition: all 0.2s ease;
        }

        .calculate-route-btn:hover:not(:disabled) {
          background: #73d13d;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
        }

        .calculate-route-btn:disabled {
          background: #d9d9d9;
          cursor: not-allowed;
        }

        .route-result {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 6px;
          padding: 12px;
          margin-top: 12px;
        }

        .route-result h4 {
          margin: 0 0 10px 0;
          color: #52c41a;
          font-size: 14px;
        }

        .route-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .route-stat {
          display: flex;
          flex-direction: column;
          background: white;
          padding: 8px;
          border-radius: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .safety-score-high {
          color: #52c41a;
        }

        .safety-score-medium {
          color: #faad14;
        }

        .safety-score-low {
          color: #ff4d4f;
        }

        .reset-route-btn {
          width: 100%;
          padding: 10px;
          background: white;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-top: 10px;
          transition: all 0.2s ease;
        }

        .reset-route-btn:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .route-marker {
          background: none;
          border: none;
        }

        .route-marker div {
          font-size: 24px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default SafeRouteSearch;
