import React from 'react';
import { UI_CONFIG } from '../constants';

export const AppStyles: React.FC = () => (
  <style>{`
    .app {
      display: flex;
      height: 100vh;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .sidebar {
      width: ${UI_CONFIG.SIDEBAR_WIDTH}px;
      padding: 20px;
      background-color: #f8f9fa;
      overflow-y: auto;
      border-right: 1px solid #dee2e6;
    }
    .map {
      flex: 1;
      height: 100vh;
      position: relative;
      transition: opacity 0.3s ease-in-out;
    }
    .map.transitioning {
      opacity: 0.7;
    }
    .loading {
      text-align: center;
      padding: 20px;
      color: #6c757d;
    }
    .layer-controls, .search-filters, .statistics-dashboard, .areas-list {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      border: 1px solid #dee2e6;
    }
    .checkbox-label {
      display: block;
      margin: 8px 0;
      cursor: pointer;
      font-size: 14px;
    }
    .checkbox-label input {
      margin-right: 8px;
    }
    .checkbox-label.small {
      font-size: 12px;
      margin: 4px 0;
    }
    .heatmap-label {
      background: linear-gradient(90deg, #0066ff, #00ffff, #00ff00, #ffff00, #ff9900, #ff0000);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: bold;
      border: 1px solid #ff6b6b;
      border-radius: 4px;
      padding: 4px 8px;
      margin: 4px 0;
    }
    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .search-input-container {
      position: relative;
    }
    .search-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
    }
    .search-suggestion-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    }
    .search-suggestion-item:last-child {
      border-bottom: none;
    }
    .search-suggestion-item:hover {
      background-color: #f8f9fa;
    }
    .search-suggestion-item:active {
      background-color: #e9ecef;
    }
    .search-suggestion-item.selected {
      background-color: #e7f3ff;
      border-left: 3px solid #1890ff;
    }
    .suggestion-text {
      font-size: 14px;
      color: #333;
    }
    .highlight {
      background-color: #fff3cd;
      color: #856404;
      font-weight: bold;
      border-radius: 2px;
      padding: 0 2px;
    }
    .filter-group {
      margin: 15px 0;
    }
    .filter-group-label {
      display: block;
      font-weight: bold;
      color: #555;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .filter-checkboxes {
      margin-left: 10px;
    }
    .range-sliders {
      display: flex;
      gap: 10px;
      margin-top: 8px;
    }
    .range-slider {
      flex: 1;
    }
    .clear-filters-btn, .toggle-statistics-btn, .toggle-comparison-btn, .export-btn {
      background: #1890ff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 5px 0;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .toggle-comparison-btn {
      background: #722ed1;
    }
    .toggle-comparison-btn:hover {
      background: #9254de;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(114, 46, 209, 0.3);
    }
    .toggle-timeseries-btn {
      background: #13c2c2;
    }
    .toggle-timeseries-btn:hover {
      background: #36cfc9;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(19, 194, 194, 0.3);
    }
    .toggle-route-btn {
      background: #52c41a;
    }
    .toggle-route-btn:hover {
      background: #73d13d;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
    }
    .clear-filters-btn:hover, .toggle-statistics-btn:hover, .export-btn:hover {
      background: #40a9ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
    }
    .filter-results {
      font-size: 12px;
      color: #666;
      margin: 10px 0;
    }
    .export-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    .csv-btn {
      background: #52c41a;
    }
    .csv-btn:hover {
      background: #73d13d;
    }
    .pdf-btn {
      background: #ff4d4f;
    }
    .pdf-btn:hover {
      background: #ff7875;
    }
    .chart-container {
      margin: 20px 0;
      background: #fafafa;
      padding: 15px;
      border-radius: 6px;
    }
    .chart-canvas {
      max-width: 100%;
      max-height: 300px;
    }
    .area-item {
      padding: 12px;
      margin: 8px 0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #dee2e6;
      transition: all 0.2s ease;
    }
    .area-item:hover {
      background: #e7f3ff;
      border-color: #1890ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .area-item.selected {
      background: #1890ff;
      color: white;
      border-color: #1890ff;
    }
    .selected-area {
      margin-top: 20px;
      padding: 15px;
      background: #e7f3ff;
      border-radius: 6px;
      border: 1px solid #1890ff;
    }
    .statistics-header {
      border-bottom: 1px solid #e7f3ff;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .statistics-dashboard {
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
      animation: fadeInUp 0.3s ease-out;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .marker-cluster-small {
      background-color: rgba(181, 226, 140, 0.6);
    }
    .marker-cluster-small div {
      background-color: rgba(110, 204, 57, 0.6);
    }
    .marker-cluster-medium {
      background-color: rgba(241, 211, 87, 0.6);
    }
    .marker-cluster-medium div {
      background-color: rgba(240, 194, 12, 0.6);
    }
    .marker-cluster-large {
      background-color: rgba(253, 156, 115, 0.6);
    }
    .marker-cluster-large div {
      background-color: rgba(241, 128, 23, 0.6);
    }
    .marker-cluster-crime {
      background-color: rgba(255, 107, 107, 0.6);
    }
    .marker-cluster-crime div {
      background-color: rgba(255, 59, 48, 0.6);
    }
    .marker-cluster {
      background-clip: padding-box;
      border-radius: 20px;
    }
    .marker-cluster div {
      width: 30px;
      height: 30px;
      margin-left: 5px;
      margin-top: 5px;
      text-align: center;
      border-radius: 15px;
      font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
    }
    .marker-cluster span {
      line-height: 30px;
      color: white;
      font-weight: bold;
    }
    .filter-header {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      user-select: none;
    }
    .filter-header:hover {
      background-color: #f8f9fa;
      border-radius: 4px;
      margin: -4px;
      padding: 12px 4px;
    }
    .filter-toggle {
      transition: transform 0.2s ease;
      font-size: 12px;
      color: #666;
    }
    .filter-toggle.open {
      transform: rotate(180deg);
    }
    .filter-content {
      animation: slideDown 0.3s ease-out;
    }
    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
        overflow: hidden;
      }
      to {
        opacity: 1;
        max-height: 1000px;
      }
    }
    .ward-tooltip {
      background: rgba(24, 144, 255, 0.9);
      border: none;
      border-radius: 4px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      padding: 4px 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
      padding: 0;
    }
    .leaflet-popup-content {
      margin: 0;
    }
  `}</style>
);
