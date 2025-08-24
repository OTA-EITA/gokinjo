const { useState, useEffect } = React;

const API_BASE_URL = 'http://localhost:8081';

function App() {
    const [areas, setAreas] = useState([]);
    const [schools, setSchools] = useState([]);
    const [crimes, setCrimes] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [map, setMap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeMap();
        loadAreas();
    }, []);

    const initializeMap = () => {
        // Center on Tokyo (approximately)
        const mapInstance = L.map('map').setView([35.6762, 139.6503], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);
    };

    const loadAreas = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/v1/areas`);
            const data = await response.json();
            setAreas(data.areas || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load areas:', error);
            setLoading(false);
        }
    };

    const loadAreaData = async (wardCode, townCode) => {
        try {
            setLoading(true);
            
            // Load schools
            const schoolsResponse = await fetch(`${API_BASE_URL}/v1/areas/${wardCode}/${townCode}/schools`);
            const schoolsData = await schoolsResponse.json();
            setSchools(schoolsData.schools || []);

            // For now, we'll just display schools since crimes endpoint might not be implemented yet
            setLoading(false);
        } catch (error) {
            console.error('Failed to load area data:', error);
            setLoading(false);
        }
    };

    const displayDataOnMap = () => {
        if (!map) return;

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add school markers
        schools.forEach(school => {
            if (school.latitude && school.longitude) {
                const marker = L.marker([school.latitude, school.longitude])
                    .bindPopup(`
                        <strong>${school.name}</strong><br/>
                        Type: ${school.type}<br/>
                        ${school.public_private}<br/>
                        Address: ${school.address}
                    `);
                marker.addTo(map);
            }
        });

        // Fit map to show all markers
        if (schools.length > 0) {
            const group = new L.featureGroup(
                schools
                    .filter(s => s.latitude && s.longitude)
                    .map(s => L.marker([s.latitude, s.longitude]))
            );
            map.fitBounds(group.getBounds().pad(0.1));
        }
    };

    useEffect(() => {
        displayDataOnMap();
    }, [schools, map]);

    const handleAreaClick = (area) => {
        setSelectedArea(area);
        loadAreaData(area.ward_code, area.town_code);
    };

    return React.createElement('div', { className: 'app' },
        React.createElement('div', { className: 'sidebar' },
            React.createElement('h1', null, '近隣情報マッピング'),
            React.createElement('h2', null, 'Tokyo Crime & Schools'),
            
            loading && React.createElement('div', null, 'Loading...'),
            
            React.createElement('div', { className: 'areas-list' },
                React.createElement('h3', null, 'Areas:'),
                areas.map(area => 
                    React.createElement('div', {
                        key: area.id,
                        className: `area-item ${selectedArea?.id === area.id ? 'selected' : ''}`,
                        onClick: () => handleAreaClick(area)
                    },
                        React.createElement('strong', null, area.name),
                        React.createElement('br'),
                        React.createElement('small', null, `Ward: ${area.ward_code}, Town: ${area.town_code}`)
                    )
                )
            ),

            selectedArea && React.createElement('div', { className: 'selected-area' },
                React.createElement('h3', null, `Selected: ${selectedArea.name}`),
                React.createElement('p', null, `Schools found: ${schools.length}`)
            )
        ),
        
        React.createElement('div', { id: 'map', className: 'map' }),
        
        // Add some basic styling
        React.createElement('style', null, `
            .app {
                display: flex;
                height: 100vh;
                font-family: Arial, sans-serif;
            }
            .sidebar {
                width: 300px;
                padding: 20px;
                background-color: #f5f5f5;
                overflow-y: auto;
            }
            .map {
                flex: 1;
                height: 100vh;
            }
            .area-item {
                padding: 10px;
                margin: 5px 0;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                border: 1px solid #ddd;
            }
            .area-item:hover {
                background: #e6f7ff;
            }
            .area-item.selected {
                background: #1890ff;
                color: white;
            }
            .selected-area {
                margin-top: 20px;
                padding: 15px;
                background: #e6f7ff;
                border-radius: 4px;
            }
            h1, h2, h3 {
                margin-top: 0;
            }
            body {
                margin: 0;
                padding: 0;
            }
        `)
    );
}

// Initialize the app
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
