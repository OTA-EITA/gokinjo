import React from 'react';

interface MapContainerProps {
  // Map container is just a simple div with ID for Leaflet
}

export const MapContainer: React.FC<MapContainerProps> = () => {
  return <div id="map" className="map" />;
};
