import React from 'react';
import { MapControlSettings } from '../types';

interface EnhancedMapControlsProps {
  settings: MapControlSettings;
  onSettingsChange: (settings: MapControlSettings) => void;
  onZoomToFit: () => void;
  onResetView: () => void;
}

const EnhancedMapControls: React.FC<EnhancedMapControlsProps> = ({
  settings,
  onSettingsChange,
  onZoomToFit,
  onResetView
}) => {
  const handleToggle = (key: keyof MapControlSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleMapModeChange = (mode: 'standard' | 'satellite' | 'dark') => {
    onSettingsChange({
      ...settings,
      map_mode: mode
    });
  };

  return (
    <div className="enhanced-map-controls">
      <div className="control-header">
        <h3>Map Controls</h3>
        <div className="current-mode">
          Current: <strong>{settings.map_mode.charAt(0).toUpperCase() + settings.map_mode.slice(1)}</strong>
        </div>
      </div>

      {/* Map Style Selector */}
      <div className="control-section">
        <label className="section-label">Map Style</label>
        <div className="map-style-selector">
          <button
            className={`style-btn ${settings.map_mode === 'standard' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('standard')}
            title="Standard Map"
          >
            <span className="btn-icon">🗺️</span>
            Standard
          </button>
          <button
            className={`style-btn ${settings.map_mode === 'satellite' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('satellite')}
            title="Satellite View"
          >
            <span className="btn-icon">🛰️</span>
            Satellite
          </button>
          <button
            className={`style-btn ${settings.map_mode === 'dark' ? 'active' : ''}`}
            onClick={() => handleMapModeChange('dark')}
            title="Dark Mode"
          >
            <span className="btn-icon">🌙</span>
            Dark
          </button>
        </div>
      </div>

      {/* Display Options */}
      <div className="control-section">
        <label className="section-label">Display Options</label>
        <div className="option-toggles">
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={settings.show_area_boundaries}
              onChange={() => handleToggle('show_area_boundaries')}
            />
            <span>Area Boundaries</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={settings.show_school_labels}
              onChange={() => handleToggle('show_school_labels')}
            />
            <span>School Labels</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={settings.show_safety_zones}
              onChange={() => handleToggle('show_safety_zones')}
            />
            <span>Safety Zones</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={settings.cluster_markers}
              onChange={() => handleToggle('cluster_markers')}
            />
            <span>Cluster Markers</span>
          </label>
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={settings.animation_enabled}
              onChange={() => handleToggle('animation_enabled')}
            />
            <span>Animations</span>
          </label>
        </div>
      </div>

      {/* Map Actions */}
      <div className="control-section">
        <label className="section-label">Map Actions</label>
        <div className="map-actions">
          <button className="action-btn" onClick={onZoomToFit}>
            <span className="action-icon">🎯</span>
            Zoom to Fit
          </button>
          <button className="action-btn" onClick={onResetView}>
            <span className="action-icon">🔄</span>
            Reset View
          </button>
        </div>
      </div>

      <style>{`
        .enhanced-map-controls {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin: 15px 0;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .control-header h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }

        .current-mode {
          font-size: 11px;
          color: #666;
          margin-bottom: 8px;
        }

        .current-mode strong {
          color: #1890ff;
          font-weight: 600;
        }

        .control-section {
          margin-bottom: 16px;
        }

        .control-section:last-child {
          margin-bottom: 0;
        }

        .section-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          margin-bottom: 8px;
        }

        .map-style-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .style-btn {
          padding: 8px 12px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .btn-icon {
          font-size: 18px;
          line-height: 1;
        }

        .style-btn:hover {
          border-color: #1890ff;
          color: #1890ff;
          background: #f0f7ff;
        }

        .style-btn.active {
          border-color: #1890ff;
          background: #1890ff;
          color: white;
          box-shadow: 0 2px 4px rgba(24, 144, 255, 0.3);
        }

        .option-toggles {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toggle-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .toggle-item:hover {
          background: #f5f5f5;
        }

        .toggle-item input[type="checkbox"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #1890ff;
        }

        .toggle-item span {
          font-size: 13px;
          color: #333;
          user-select: none;
        }

        .map-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .action-btn {
          padding: 8px 12px;
          border: 1px solid #d0d0d0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #555;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .action-icon {
          font-size: 14px;
        }

        .action-btn:hover {
          background: #f0f7ff;
          border-color: #1890ff;
          color: #1890ff;
        }

        .action-btn:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
};

export default EnhancedMapControls;
