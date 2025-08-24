// TypeScript版近隣情報マッピングアプリ（定数化・モジュール化対応版）
// JSDocによる型安全性を保持

// ========== 定数定義 ==========
const API_CONFIG = {
  BASE_URL: 'http://localhost:8081',
  ENDPOINTS: {
    HEALTH: '/health',
    AREAS: '/v1/areas',
    SCHOOLS: '/v1/areas/{ward_code}/{town_code}/schools',
    CRIMES: '/v1/areas/{ward_code}/{town_code}/crimes',
    SAFETY_SCORE: '/v1/schools/{id}/safety-score',
    SAFETY_SCORES: '/v1/areas/{ward_code}/{town_code}/safety-scores',
  }
};

const MAP_CONFIG = {
  CENTER: [35.6762, 139.6503],
  DEFAULT_ZOOM: 11,
  TILE_LAYER: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors'
  },
  FIT_BOUNDS_PADDING: 0.1
};

const ICON_CONFIG = {
  BASE_URL: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img',
  SCHOOL_COLORS: {
    elementary: 'green',
    junior_high: 'orange',
    high: 'red',
    default: 'blue'
  },
  CRIME_COLORS: {
    '窃盗': 'violet',
    '暴行': 'red', 
    '詐欺': 'yellow',
    default: 'grey'
  },
  SIZES: {
    SCHOOL: [25, 41],
    CRIME: [20, 32],
    ANCHOR_SCHOOL: [12, 41],
    ANCHOR_CRIME: [10, 32],
    POPUP_ANCHOR: [1, -34],
    POPUP_ANCHOR_CRIME: [1, -30]
  }
};

const SAFETY_CONFIG = {
  RADIUS_METERS: 500,
  SCORE_LEVELS: {
    VERY_SAFE: { min: 90, color: 'darkgreen', label: '非常に安全' },
    SAFE: { min: 70, color: 'green', label: '安全' },
    MODERATE: { min: 50, color: 'orange', label: '注意' },
    CAUTION: { min: 0, color: 'red', label: '警戒' }
  },
  CIRCLE_STYLE: {
    fillOpacity: 0.2,
    weight: 2
  }
};

const UI_CONFIG = {
  SIDEBAR_WIDTH: 350,
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 200
};

const LABELS = {
  SCHOOL_TYPES: {
    elementary: '小学校',
    junior_high: '中学校',
    high: '高等学校'
  },
  PUBLIC_PRIVATE: {
    public: '公立',
    private: '私立'
  },
  SAFETY_LEVELS: {
    very_safe: '非常に安全',
    safe: '安全',
    moderate: '注意',
    caution: '警戒'
  },
  UI: {
    APP_TITLE: '近隣情報マッピング',
    APP_SUBTITLE: 'Tokyo Crime & Schools (TypeScript)',
    LOADING: 'Loading...',
    LAYER_CONTROLS: 'レイヤー表示',
    AREA_SELECTION: 'エリア選択:',
    SELECTED_PREFIX: '選択中: ',
    SCHOOL_LIST: '学校一覧',
    SAFETY_SCORES: '安全性スコア',
    SCHOOL_LAYER: '学校',
    CRIME_LAYER: '犯罪',
    SAFETY_RANGE_LAYER: '安全範囲 (半径500m)'
  }
};

const ERROR_MESSAGES = {
  FAILED_TO_LOAD_AREAS: 'Failed to load areas',
  FAILED_TO_LOAD_AREA_DATA: 'Failed to load area data',
  FAILED_TO_INITIALIZE_MAP: 'Failed to initialize map',
  HTTP_ERROR: 'HTTP error! status:',
  NETWORK_ERROR: 'Network error occurred'
};

// ========== ユーティリティ関数 ==========

/**
 * 学校タイプに応じたアイコンURLを取得
 * @param {Object} school 
 * @returns {string}
 */
const getSchoolIcon = (school) => {
  const color = ICON_CONFIG.SCHOOL_COLORS[school.type] || ICON_CONFIG.SCHOOL_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 犯罪タイプに応じたアイコンURLを取得
 * @param {Object} crime 
 * @returns {string}
 */
const getCrimeIcon = (crime) => {
  const color = ICON_CONFIG.CRIME_COLORS[crime.category] || ICON_CONFIG.CRIME_COLORS.default;
  return `${ICON_CONFIG.BASE_URL}/marker-icon-2x-${color}.png`;
};

/**
 * 安全スコアに応じた色を取得
 * @param {number} score 
 * @returns {string}
 */
const getSafetyScoreColor = (score) => {
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.VERY_SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.SAFE.min) return SAFETY_CONFIG.SCORE_LEVELS.SAFE.color;
  if (score >= SAFETY_CONFIG.SCORE_LEVELS.MODERATE.min) return SAFETY_CONFIG.SCORE_LEVELS.MODERATE.color;
  return SAFETY_CONFIG.SCORE_LEVELS.CAUTION.color;
};

/**
 * 安全レベルの日本語ラベルを取得
 * @param {string} level 
 * @returns {string}
 */
const getSafetyLevelLabel = (level) => {
  return LABELS.SAFETY_LEVELS[level] || level;
};

/**
 * 学校種別の日本語ラベルを取得
 * @param {string} type 
 * @returns {string}
 */
const getSchoolTypeLabel = (type) => {
  return LABELS.SCHOOL_TYPES[type] || type;
};

/**
 * 公立/私立の日本語ラベルを取得
 * @param {string} publicPrivate 
 * @returns {string}
 */
const getPublicPrivateLabel = (publicPrivate) => {
  return LABELS.PUBLIC_PRIVATE[publicPrivate] || publicPrivate;
};

/**
 * APIエンドポイントURLを構築
 * @param {string} endpoint 
 * @param {Object} params 
 * @returns {string}
 */
const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  return url;
};

/**
 * 安全なfetch処理
 * @param {string} url 
 * @returns {Promise<Object|null>}
 */
const safeFetch = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.HTTP_ERROR} ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
};

// ========== React型定義（JSDoc） ==========

/**
 * @typedef {Object} Area
 * @property {number} id
 * @property {string} ward_code
 * @property {string} town_code
 * @property {string} name
 */

/**
 * @typedef {Object} School
 * @property {number} id
 * @property {string} name
 * @property {'elementary'|'junior_high'|'high'} type
 * @property {'public'|'private'} public_private
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} address
 * @property {number} area_id
 */

/**
 * @typedef {Object} Crime
 * @property {number} id
 * @property {string} category
 * @property {string} date
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} description
 * @property {number} area_id
 */

/**
 * @typedef {Object} SafetyScore
 * @property {number} school_id
 * @property {string} school_name
 * @property {number} score
 * @property {number} crime_count
 * @property {number} radius_meters
 * @property {string} last_updated
 * @property {'very_safe'|'safe'|'moderate'|'caution'} score_level
 */

const { useState, useEffect } = React;

/**
 * メインアプリケーションコンポーネント
 * @returns {React.ReactElement}
 */
const App = () => {
    // State management with type-safe initial values
    const [areas, setAreas] = useState(/** @type {Area[]} */ ([]));
    const [schools, setSchools] = useState(/** @type {School[]} */ ([]));
    const [crimes, setCrimes] = useState(/** @type {Crime[]} */ ([]));
    const [safetyScores, setSafetyScores] = useState(/** @type {SafetyScore[]} */ ([]));
    const [selectedArea, setSelectedArea] = useState(/** @type {Area|null} */ (null));
    const [map, setMap] = useState(/** @type {L.Map|null} */ (null));
    const [loading, setLoading] = useState(/** @type {boolean} */ (true));

    // レイヤー表示制御
    const [showSchools, setShowSchools] = useState(/** @type {boolean} */ (true));
    const [showCrimes, setShowCrimes] = useState(/** @type {boolean} */ (true));
    const [showSafetyScores, setShowSafetyScores] = useState(/** @type {boolean} */ (false));

    // マーカーグループ管理
    const [schoolMarkers, setSchoolMarkers] = useState(/** @type {L.LayerGroup|null} */ (null));
    const [crimeMarkers, setCrimeMarkers] = useState(/** @type {L.LayerGroup|null} */ (null));
    const [safetyCircles, setSafetyCircles] = useState(/** @type {L.LayerGroup|null} */ (null));

    useEffect(() => {
        initializeMap();
        loadAreas();
    }, []);

    // レイヤー表示状態が変わったときに地図を更新
    useEffect(() => {
        displayDataOnMap();
    }, [schools, crimes, safetyScores, showSchools, showCrimes, showSafetyScores, map]);

    /**
     * 地図を初期化
     * @returns {void}
     */
    const initializeMap = () => {
        try {
            const mapInstance = L.map('map').setView(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM);

            L.tileLayer(MAP_CONFIG.TILE_LAYER.URL, {
                attribution: MAP_CONFIG.TILE_LAYER.ATTRIBUTION
            }).addTo(mapInstance);

            setMap(mapInstance);
        } catch (error) {
            console.error(ERROR_MESSAGES.FAILED_TO_INITIALIZE_MAP, error);
        }
    };

    /**
     * エリアデータを読み込み
     * @returns {Promise<void>}
     */
    const loadAreas = async () => {
        try {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AREAS}`;
            const data = await safeFetch(url);
            
            if (data) {
                setAreas(data.areas || []);
            }
            setLoading(false);
        } catch (error) {
            console.error(ERROR_MESSAGES.FAILED_TO_LOAD_AREAS, error);
            setLoading(false);
        }
    };

    /**
     * 選択されたエリアのデータを読み込み
     * @param {string} wardCode 
     * @param {string} townCode 
     * @returns {Promise<void>}
     */
    const loadAreaData = async (wardCode, townCode) => {
        try {
            setLoading(true);

            // Load schools
            const schoolsUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SCHOOLS, { ward_code: wardCode, town_code: townCode })}`;
            const schoolsData = await safeFetch(schoolsUrl);
            if (schoolsData) {
                setSchools(schoolsData.schools || []);
            }

            // Load crimes
            const crimesUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.CRIMES, { ward_code: wardCode, town_code: townCode })}`;
            const crimesData = await safeFetch(crimesUrl);
            if (crimesData) {
                setCrimes(crimesData.crimes || []);
            }

            // Load safety scores
            const safetyUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SAFETY_SCORES, { ward_code: wardCode, town_code: townCode })}`;
            const safetyData = await safeFetch(safetyUrl);
            if (safetyData) {
                setSafetyScores(safetyData.safety_scores || []);
            }

            setLoading(false);
        } catch (error) {
            console.error(ERROR_MESSAGES.FAILED_TO_LOAD_AREA_DATA, error);
            setLoading(false);
        }
    };

    /**
     * 地図上にデータを表示
     * @returns {void}
     */
    const displayDataOnMap = () => {
        if (!map) return;

        // Clear existing markers
        if (schoolMarkers) {
            map.removeLayer(schoolMarkers);
            setSchoolMarkers(null);
        }
        if (crimeMarkers) {
            map.removeLayer(crimeMarkers);
            setCrimeMarkers(null);
        }
        if (safetyCircles) {
            map.removeLayer(safetyCircles);
            setSafetyCircles(null);
        }

        // School markers
        if (showSchools && schools.length > 0) {
            const schoolMarkersGroup = L.layerGroup();

            schools.forEach(school => {
                if (school.latitude && school.longitude) {
                    const safetyScore = safetyScores.find(s => s.school_id === school.id);
                    const scoreText = safetyScore ?
                        `<br/><strong>安全スコア: ${safetyScore.score.toFixed(1)}</strong> (${getSafetyLevelLabel(safetyScore.score_level)})` : '';

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

        // Crime markers
        if (showCrimes && crimes.length > 0) {
            const crimeMarkersGroup = L.layerGroup();

            crimes.forEach(crime => {
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

        // Safety score circles (when enabled)
        if (showSafetyScores && safetyScores.length > 0) {
            const safetyCirclesGroup = L.layerGroup();

            safetyScores.forEach(score => {
                const school = schools.find(s => s.id === score.school_id);
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

        // Fit map to show all data
        const allMarkers = [];
        if (showSchools && schools.length > 0) {
            schools.forEach(school => {
                if (school.latitude && school.longitude) {
                    allMarkers.push(L.marker([school.latitude, school.longitude]));
                }
            });
        }
        if (showCrimes && crimes.length > 0) {
            crimes.forEach(crime => {
                if (crime.latitude && crime.longitude) {
                    allMarkers.push(L.marker([crime.latitude, crime.longitude]));
                }
            });
        }

        if (allMarkers.length > 0) {
            const group = new L.featureGroup(allMarkers);
            map.fitBounds(group.getBounds().pad(MAP_CONFIG.FIT_BOUNDS_PADDING));
        }
    };

    /**
     * エリアクリックハンドラ
     * @param {Area} area 
     */
    const handleAreaClick = (area) => {
        setSelectedArea(area);
        loadAreaData(area.ward_code, area.town_code);
    };

    return React.createElement('div', { className: 'app' },
        React.createElement('div', { className: 'sidebar' },
            React.createElement('h1', null, LABELS.UI.APP_TITLE),
            React.createElement('h2', null, LABELS.UI.APP_SUBTITLE),

            loading && React.createElement('div', { className: 'loading' }, LABELS.UI.LOADING),

            // レイヤー制御
            React.createElement('div', { className: 'layer-controls' },
                React.createElement('h3', null, LABELS.UI.LAYER_CONTROLS),
                React.createElement('label', { className: 'checkbox-label' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: showSchools,
                        onChange: (e) => setShowSchools(e.target.checked)
                    }),
                    ` ${LABELS.UI.SCHOOL_LAYER} (${schools.length}件)`
                ),
                React.createElement('label', { className: 'checkbox-label' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: showCrimes,
                        onChange: (e) => setShowCrimes(e.target.checked)
                    }),
                    ` ${LABELS.UI.CRIME_LAYER} (${crimes.length}件)`
                ),
                React.createElement('label', { className: 'checkbox-label' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: showSafetyScores,
                        onChange: (e) => setShowSafetyScores(e.target.checked)
                    }),
                    ` ${LABELS.UI.SAFETY_RANGE_LAYER}`
                )
            ),

            React.createElement('div', { className: 'areas-list' },
                React.createElement('h3', null, LABELS.UI.AREA_SELECTION),
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
                React.createElement('h3', null, `${LABELS.UI.SELECTED_PREFIX}${selectedArea.name}`),
                React.createElement('p', null, `学校: ${schools.length}件 | 犯罪: ${crimes.length}件`)
            ),

            // 学校一覧
            showSchools && schools.length > 0 && React.createElement('div', { className: 'schools-list' },
                React.createElement('h3', null, LABELS.UI.SCHOOL_LIST),
                schools.map(school =>
                    React.createElement('div', {
                        key: school.id,
                        className: 'school-item'
                    },
                        React.createElement('strong', null, school.name),
                        React.createElement('br'),
                        React.createElement('small', null, `${getSchoolTypeLabel(school.type)} | ${getPublicPrivateLabel(school.public_private)}`)
                    )
                )
            ),

            // 安全性スコア一覧
            showSafetyScores && safetyScores.length > 0 && React.createElement('div', { className: 'safety-scores' },
                React.createElement('h3', null, LABELS.UI.SAFETY_SCORES),
                safetyScores.map(score =>
                    React.createElement('div', {
                        key: score.school_id,
                        className: 'safety-score-item',
                        style: { borderLeft: `4px solid ${getSafetyScoreColor(score.score)}` }
                    },
                        React.createElement('strong', null, score.school_name),
                        React.createElement('br'),
                        React.createElement('span', { className: 'score' },
                            `スコア: ${score.score.toFixed(1)} (${getSafetyLevelLabel(score.score_level)})`
                        ),
                        React.createElement('br'),
                        React.createElement('small', null, `周辺犯罪: ${score.crime_count}件`)
                    )
                )
            )
        ),

        React.createElement('div', { id: 'map', className: 'map' }),

        // Enhanced styling
        React.createElement('style', null, `
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
            }

            .loading {
                text-align: center;
                padding: 20px;
                color: #6c757d;
            }

            .layer-controls {
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

            .schools-list {
                margin-top: 20px;
            }

            .school-item {
                background: white;
                padding: 8px;
                margin: 4px 0;
                border-radius: 4px;
                font-size: 12px;
                border: 1px solid #e9ecef;
            }

            .safety-scores {
                margin-top: 20px;
            }

            .safety-score-item {
                background: white;
                padding: 10px;
                margin: 5px 0;
                border-radius: 4px;
                font-size: 12px;
            }

            .score {
                font-weight: bold;
                color: #333;
            }

            h1 {
                color: #1890ff;
                margin-top: 0;
                font-size: 24px;
            }
            h2 {
                color: #666;
                font-size: 14px;
                margin-top: 0;
            }
            h3 {
                margin-top: 0;
                margin-bottom: 12px;
                color: #333;
                font-size: 16px;
            }

            body {
                margin: 0;
                padding: 0;
                font-family: 'Helvetica Neue', Arial, sans-serif;
            }
        `)
    );
};

// Initialize the app
const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
}