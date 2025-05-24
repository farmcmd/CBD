// script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";


// --- Firebase Configuration ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCEH65YbNirj_IRmtsIJZS-HNEbsRBBsSQ", // Your Firebase API Key
    authDomain: "sustainable-tourism-65025.firebaseapp.com",
    projectId: "sustainable-tourism-65025",
    storageBucket: "sustainable-tourism-65025.firebasestorage.app",
    messagingSenderId: "781325465882",
    appId: "1:781325465882:web:9435b02bd618f0c16814a3",
    measurementId: "G-SZJ1RX5QS4"
};

// Initialize Firebase
let app;
let db;
let analytics;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app); // Get a reference to the Firestore service using the new method
    analytics = getAnalytics(app); // Get a reference to the Analytics service using the new method
    console.log("Firebase initialized successfully."); // Debugging line
} catch (error) {
    console.error("Error initializing Firebase:", error); // Debugging line
    // Update network stats status on Firebase initialization error
    const networkStatsStatusElement = document.getElementById('network-stats-status');
    if (networkStatsStatusElement) {
        networkStatsStatusElement.textContent = `Firebase 初始化失敗: ${error.message}. 無法載入網路統計。`;
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600');
        networkStatsStatusElement.classList.add('text-red-600');
    }
    const networkTotalCarbonReductionElement = document.getElementById('network-total-carbon-reduction');
    if (networkTotalCarbonReductionElement) {
        networkTotalCarbonReductionElement.textContent = '載入失敗';
    }
}


// --- Data Definitions ---
// Define transportData here, outside initMap, with placeholder travelMode
let transportData = {
    // Added metersPerPoint for score calculation based on distance
    // Corrected carbon reduction values based on user feedback
    bike: { name: '腳踏車', icon: '🚲', carbonReductionPer10km: 350, travelMode: null, metersPerPoint: 10000 }, // 10km = 10000m
    walk: { name: '步行', icon: '🚶‍♂️', carbonReductionPer10km: 400, travelMode: null, metersPerPoint: 8000 },   // 8km = 8000m
    bus_train: { name: '共乘巴士 (公車/火車/遊覽巴士)', icon: '🚌', carbonReductionPer10km: 300, travelMode: null, metersPerPoint: 15000 }, // 15km = 15000m
    carpool_2_moto: { name: '私家車共乘 2 人 / 摩托車', icon: '🏍️🚗', carbonReductionPer10km: 100, travelMode: null, metersPerPoint: 25000 }, // 25km = 25000m
    carpool_3: { name: '私家車共乘 3 人', icon: '🚗', carbonReductionPer10km: 120, travelMode: null, metersPerPoint: 20000 }, // 20km = 20000m
    carpool_4: { name: '私家車共乘 4 人', icon: '🚗', carbonReductionPer10km: 150, travelMode: null, metersPerPoint: 18000 }, // 18km = 18000m
    carpool_5: { name: '私家車共乘 5 人', icon: '🚗', carbonReductionPer10km: 200, travelMode: null, metersPerPoint: 16000 }, // 16km = 16000m
    thsr_haoxing: { name: '高鐵假期x台灣好行', icon: '🚄🚌', carbonReductionPer10km: 0, travelMode: null, metersPerPoint: Infinity } // THSR doesn't get points from distance in this model
    // Taxi info is not included here as it's not for mileage calculation
};


// Points of Interest Data (Removed iconUrl for default markers)
const pois = [
    // Removed 'iconUrl' property to use default Google Maps markers
    // 'socialLink' property is kept for external links.
    { id: 'poi1', name: '水里永續共好聯盟打氣站', coords: { lat: 23.809799, lng: 120.849286 }, icon: '🌲', description: '營業時間上午8:00~17:00。\n\n不定期辦理活動，小尖兵們完成的永續任務的分數請在此出示，感謝您一起為地球減碳努力!\n\n本區共分為三個單位(水里鄉圖書館內):\n1. 社團法人南投縣水里鄉商圈創生共好協會 - 致力於推動水里地區商圈振興、永續農業、文化保存與地方創生行動。以多元合作模式打造出一個能共好、共學、共榮的地方創新平台。\n2. 水里溪畔驛站 - 在圖書館內的一處靜懿的景觀休憩場域，小農午餐需要事先預訂喔!\n3. 水里青農里山基地 - 是由臺大實驗林水里營林區輔導的里山餐桌團隊打造的里山及永續教育基地，由返鄉青農共同打造的農業與社區發展平台，以農村生產、生活、生態致力於推廣友善農業、食農教育及永續發展為目標。在這裡可以預約由小農開發的豐富教具進行DIY活動與食農、永續教育等活動!', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW' },
    { id: 'poi2', name: '漫遊堤岸風光', coords: { lat: 23.808537, lng: 120.849415 }, icon: '🏞️', description: '起點：水里親水公園。終點：永興村，途中經過社子生態堤防、永興大橋、永興社區等地，路線全長約4公里，坡度平緩，適合親子及大眾。', image: '' },
    { id: 'poi3', name: '鑫鮮菇園', coords: { lat: 23.794049, lng: 120.859407 }, icon: '🍄', description: '營業時間: 需預約。\n\n提供香菇園區種植導覽與體驗行程 (時長20分鐘)。\n香菇/袖珍菇三角飯糰食農體驗(時長90分鐘)。', image: '', socialLink: 'https://www.facebook.com/xinxianguyuan', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_3', formLink: 'YOUR_FORM_LINK_3', lineId: 'YOUR_LINE_ID_3' } }, // Added sroiInfo
    { id: 'poi4', name: '永興神木', coords: { lat: 23.784127, lng: 120.862294 }, icon: '🌳', description: '社區麵包坊營業時間”上午9:00~17:00。\n\n永興神木（百年大樟樹）位於永興社區活動中心旁。樟樹群由三棵母子樹所形成，第一代木就是母樹，二代木則是母樹根系再長出的兩棵子樹，連成一體。樹齡約300年、樹圍6.2公尺、樹徑1.6公尺、樹高約26公尺、樹冠幅400平方公尺，一旁供俸老樹公及福德祠是居民的信仰中心。\n\n社區活動中心二樓設有社區麵包坊，由北海扶輪社、臺大實驗林、水里商工，共同扶持社區成立，利用當地種植的果物製作的吐司產品是新鮮別具風味的暢銷品。', image: '', socialLink: 'https://www.shli.gov.tw/story/1/6' },
    { id: 'poi5', name: '森林小白宮', coords: { lat: 23.779408, lng: 120.844019 }, icon: '🏠', description: '接駁、共乘、摩托。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n小白宮森林生態導覽，親子活動(彩繪/木藝/親子皮影)。', image: '', socialLink: 'https://wild-kids-studio.waca.tw/' },
    { id: 'poi6', name: '瑪路馬咖啡莊園', coords: { lat: 23.778239, lng: 120.843859 }, icon: '☕', description: '接駁、共乘、摩托。\n\n活動資訊: 咖啡座、咖啡園導覽。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/people/%E9%A6%AC%E8%B7%AF%E7%91%AA%E5%92%96%E5%95%A1%E8%8E%8A%E5%9C%92/100063961898841/' },
    { id: 'poi7', name: '指令教育農場', coords: { lat: 23.802776, lng: 120.864715 }, icon: '👆', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/FarmCMD/', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_7', formLink: 'YOUR_FORM_LINK_7', lineId: 'https://line.me/ti/g2/HFRcE4eII1eQ761y0Zs3QEvs70saIQ-dHYbYgA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Updated LINE ID
    { id: 'poi8', name: '明揚養蜂', coords: { lat: 23.803787, lng: 120.862401 }, icon: '🐝', description: '共乘、台灣好行、摩托。\n\n活動資訊: 育蜂場導覽、生態導覽、蜂蜜食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/MingYangBee/?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_8', formLink: 'YOUR_FORM_LINK_8', lineId: 'https://line.me/ti/g2/VuGeDsA2K8tPEJ9JOElK70LbUmGk8dW_7Q2zxA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    { id: 'poi9', name: '蛇窯文化園區', coords: { lat: 23.801177, lng: 120.864479 }, icon: '🏺', description: '共乘、台灣好行。\n\n活動資訊: 購票入園，完成食農器皿文化參觀可獲得永續與環境教育點數10點。', image: '', socialLink: 'https://www.facebook.com/sskshop/?locale=zh_TW' },
    { id: 'poi10', name: '雨社山下', coords: { lat: 23.790644, lng: 120.896569 }, icon: '🥒', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=61557727713841&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_10', formLink: 'YOUR_FORM_LINK_10', lineId: 'https://line.me/ti/g2/ltdgi_rY8K-frnjS9Q0n0n2vGSO8uw8m5uGUWA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    { id: 'poi11', name: '阿爾喜莊園', coords: { lat: 23.803119, lng: 120.926340 }, icon: '🍋', description: '接駁、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育、農業循環經濟教學。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/AHEIemon?locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_11', formLink: 'YOUR_FORM_LINK_11', lineId: 'https://line.me/ti/g2/f2JhyAIKmKvProOMzM2z4Mb-6ogaJOOsPT0jug?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Added sroiInfo
    // Re-added sroiInfo for poi12
    { id: 'poi12', name: '湧健酪梨園', coords: { lat: 23.725349, lng: 120.846123 }, icon: '🥑', description: '台灣好行、共乘、摩托。\n\n活動資訊: 農場導覽、生態導覽、食農教育。完成單一活動可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100085673588842&locale=zh_TW', sroiInfo: { reportLink: 'YOUR_REPORT_LINK_12', formLink: 'YOUR_FORM_LINK_12', lineId: 'https://line.me/ti/g2/PIlIHjGJgO-mmn3JvqgCJ9_mPY7Aoeqg8VOEDg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default' } }, // Re-added sroiInfo for poi12
    { id: 'poi13', name: '謝家肉圓', coords: { lat: 23.817521, lng: 120.853831 }, icon: '🥟', description: '步行、摩托、台灣好行。營業時間 11:00–17:00。\n\n在地人巷內70年老店。', image: '', socialLink: 'https://www.facebook.com/profile.php?id=100054428473137&locale=zh_TW' },
    { id: 'poi14', name: '機車貓聯盟', coords: { lat: 23.810883, lng: 120.855798 }, icon: '🍚', description: '共乘、摩托、台灣好行。營業時間 11:00–17:00。\n\n無菜單料理店，50%以上使用在地食材，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://m.facebook.com/機車貓聯盟-552637305127422/' }, // Added social link (using the one from search result)
    { id: 'poi15', name: '二坪大觀冰店', coords: { lat: 23.813627, lng: 120.859651 }, icon: '🍦', description: '共乘、摩托。\n\n在地推薦古早味枝仔冰。台電員工福利社60年老店。', image: '', socialLink: 'https://www.facebook.com/2pinIce/' },
    { id: 'poi16', name: '水里里山村', coords: { lat: 23.813459, lng: 120.853787 }, icon: '🏡', description: '共乘、摩托。\n\n在地推鑑環保旅宿，任一消費金額可獲得永續與環境教育任務點數10點。', image: '', socialLink: 'https://tg-ecohotel.com/' }, // Added website link
    // Updated description for poi17
    { id: 'poi17', name: '水里星光市集', coords: { lat: 23.813636, lng: 120.850816 }, icon: '💡', description: '參加”逛市集增里程”地產地銷最減碳，支持在地消費獲得減碳量。\n\n本年度預計於星光市集舉辦「食農教育」活動，場次及內容請洽水里鄉商圈創生共好協會。', image: '', socialLink: 'https://www.facebook.com/p/%E6%B0%B4%E9%87%8C%E9%84%89%E5%95%86%E5%9C%88%E5%89%B5%E7%94%9F%E5%85%B1%E5%A5%BD%E5%8D%94%E6%9C%83-100076220760859/?locale=zh_TW', isNew: true, marketScheduleLink: 'https://www.facebook.com/photo/?fbid=2583695705169366&set=pcb.2583695981835995' },
    // New POI: 森音
    { id: 'poi18', name: '森音', coords: { lat: 23.742587, lng: 120.866954 }, icon: '🎶', description: '接駁、摩托、私家車。需預約。\n\n完成單一活動可獲得永續與環境教育任務點數10點。\n\n森音森林導覽，親子活動(咖啡座/木藝上板/森林育樂/畫廊)。', image: '', socialLink: 'https://www.facebook.com/morinooto111' }
];

 // Sustainable Actions Data with points
 const sustainableActions = [
     { name: '支持在地飲食', points: 5 },
     { name: '減少剩食', points: 5 },
     { name: '自備環保用品', points: 5 },
     { name: '回收分類', points: 5 },
     { name: '保育行為', points: 10 },
     { name: '導覽參加', points: 10 },
     { name: '不破壞棲地', points: 10 },
     { name: '支持小農', points: 5 },
     { name: '遵守營火', points: 5 }
 ];


// Sustainable Activities Data
const activities = [
    // validCodes are now only used for reference, verification checks format only
    // TODO: Replace the placeholder image URL below with a permanent, publicly accessible URL for the SROI image
    { id: 'act1', name: 'SROI 社會責任農產品購買', points: 15, validCodes: ['ABC123', 'XYZ789'], image: 'https://placehold.co/400x200/4caf50/white?text=SROI+Image' }, // Added placeholder image URL with green color
    { id: 'act2', name: '生態棲地破冰活動', points: 20, validCodes: ['DEF456', 'UVW012'] },
    { id: 'act3', name: 'ESG社會責任活動講堂', points: 25, validCodes: ['GHI789', 'RST345'] },
    { id: 'act4', name: 'CBD里山生態廊道永續旅遊', points: 30, validCodes: ['JKL012', 'QRS678'] },
    { id: 'act5', name: '里山倡議食農下午茶講堂', points: 20, validCodes: ['MNO345', 'PQR901'] },
    { id: 'act6', name: '小白宮x山形工作室', points: 10, validCodes: ['PQR678', 'STU234'] },
    { id: 'act7', name: '其他永續與環境教育活動及課程', points: 10, validCodes: ['VWX901', 'YZA567'] }
    // Add more activities and valid codes as needed
];

// New Market Data
const marketTypes = [
    { id: 'starlight_market', name: '水里星光市集', icon: '🌟' }, // Updated name
    { id: 'farmers_market', name: '小農市集', icon: '🧑‍🌾' },
    { id: 'festival_market', name: '其他節慶市集', icon: '🎉' }
];

const marketProductData = {
    'agricultural_products': { name: '農產品', mileage: 5000, carbonReduction: 20, points: 5, icon: '🥕' }, // 5km, 20g, 5 points
    'local_snacks': { name: '在地小吃', mileage: 3000, carbonReduction: 12, points: 3, icon: '🍜' },      // 3km, 12g, 3 points
    'creative_products': { name: '文創商品', mileage: 2000, carbonReduction: 8, points: 2, icon: '🎨' },   // 2km, 8g, 2 points
    'services': { name: '服務類', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛠️' },           // 2km, 8g, 2 points
    'others': { name: '其他', mileage: 2000, carbonReduction: 8, points: 2, icon: '🛍️' }                 // 2km, 8g, 2 points
};


// --- State Variables ---
let currentTransport = null; // This is for the *overall* selected transport on the homepage
let totalMileage = 0; // in meters
let totalCarbonReduction = 0; // in grams
let totalScore = 0;
let playerName = ''; // New state variable for player name
let playerCode = ''; // New state variable for player code
let map = null; // Google Map object
// Re-added Directions Service and Renderer
let directionsService = null; // Google Maps DirectionsService object
let directionsRenderer = null; // Google Maps DirectionsRenderer object
let poiMarkers = []; // Array to store Google Maps Marker objects
let selectedActivity = null; // To store the currently selected activity for verification
// Re-added selectedStartPoi and selectedEndPoi
let selectedStartPoi = null; // To store the selected start POI object
let selectedEndPoi = null; // To store the selected end POI object
let loggedActions = []; // Array to store sustainable action logs
let selectedSustainableActions = []; // Array to store selected sustainable action names

// New state variable for the currently selected POI in the log trip modal
let currentLogTripPoi = null;

// New state variable for network-wide total carbon reduction
let networkTotalCarbonReduction = 0;

// New state for market selection
let selectedMarketType = null;
let selectedMarketProduct = null;


// --- DOM Elements ---
const homepageSection = document.getElementById('homepage');
const missionPageSection = document.getElementById('mission-page');
// const thsrInfoDiv = document.getElementById('thsr-info'); // This div is now unused for display, kept for reference
const playerNameInput = document.getElementById('player-name'); // New input element for player name
const playerCodeDisplay = document.getElementById('player-code'); // New element to display player code
const totalMileageSpan = document.getElementById('total-mileage');
const totalCarbonReductionSpan = document.getElementById('total-carbon-reduction');
const totalScoreSpan = document.getElementById('total-score');
const currentTransportDisplay = document.getElementById('current-transport-display');
const mapElement = document.getElementById('map');
const mapStatusElement = document.getElementById('map-status'); // Get the map status element
// Re-added selectedPointsDisplay and calculateMileageButton
const selectedPointsDisplay = document.getElementById('selected-points-display'); // New element for selected points
const calculateMileageButton = document.getElementById('calculate-mileage-button'); // New button
// Re-added tripCalculationStatusElement
const tripCalculationStatusElement = document.getElementById('trip-calculation-status'); // New status element
const poiListElement = document.getElementById('poi-list');
const poiModal = document.getElementById('poi-modal');
const poiModalTitle = document.getElementById('poi-modal-title');
const poiModalImage = document.getElementById('poi-modal-image');
const poiModalDescription = document.getElementById('poi-modal-description');
const poiModalCoordinates = document.getElementById('poi-modal-coordinates');
const poiModalSocialDiv = document.getElementById('poi-modal-social'); // New element for social links in modal
const poiModalDynamicButtonsDiv = document.getElementById('poi-modal-dynamic-buttons'); // Container for dynamic buttons
// Re-added setAsStartButton and setAsEndButton
const setAsStartButton = document.getElementById('set-as-start-button'); // New button in modal
const setAsEndButton = document.getElementById('set-as-end-button'); // New button in modal
const activityModal = document.getElementById('activity-modal'); // Activity Modal
const selectedActivityNameElement = document.getElementById('selected-activity-name'); // Element to show selected activity name in modal
const verificationCodeInput = document.getElementById('verification-code-input'); // Input in Activity Modal
const activityContentInput = document.getElementById('activity-content-input'); // New input for activity content
const submitActivityLogButton = document.getElementById('submit-activity-log'); // Button in Activity Modal (renamed from submitVerificationCode)
const activityLogStatusElement = document.getElementById('activity-log-status'); // Status in Activity Modal (renamed from verificationStatus)
const activityListElement = document.getElementById('activity-list');
const participateActivityButton = document.getElementById('participate-activity-button'); // Participate button
const sustainableActionLogTextarea = document.getElementById('sustainable-action-log');
const logActionButton = document.getElementById('log-action-button');
const actionLogStatusElement = document.getElementById('action-log-status'); // Status for sustainable actions
const backToHomeButton = document.getElementById('back-to-home');
const changeTransportButton = document.getElementById('change-transport-button'); // New button
const loggedActionsListElement = document.getElementById('logged-actions-list'); // Element to display logged actions
const thsrInfoModal = document.getElementById('thsr-info-modal'); // THSR Info Modal
const selectableActionsListElement = document.getElementById('selectable-actions-list'); // Element to display selectable actions
const downloadDataButton = document.getElementById('download-data-button'); // New download button element
const activityModalImage = document.getElementById('activity-modal-image'); // Get the activity modal image element

// New DOM elements for Log Trip Modal
const logTripModal = document.getElementById('log-trip-modal');
const logTripPoiNameElement = document.getElementById('log-trip-poi-name');
const logTripTransportOptionsDiv = document.getElementById('log-trip-transport-options');
const logTripMileageInput = document.getElementById('log-trip-mileage');
const submitLogTripButton = document.getElementById('submit-log-trip');
const logTripStatusElement = document.getElementById('log-trip-status');
const logTripTransportStatusElement = document.getElementById('log-trip-transport-status'); // Status for transport selection
const logTripMileageStatusElement = document.getElementById('log-trip-mileage-status'); // Status for mileage input

// New DOM elements for Taxi Info Modal
const taxiInfoModal = document.getElementById('taxi-info-modal');
const taxiInfoButton = document.getElementById('taxi-info-button'); // Button to open taxi info modal

// New DOM elements for POI Review Section
const poiReviewSection = document.getElementById('poi-review-section');
const consumptionAmountInput = document.getElementById('consumption-amount');
const reviewCodeInput = document.getElementById('review-code');
const submitPoiReviewButton = document.getElementById('submit-poi-review');
const poiReviewStatusElement = document.getElementById('poi-review-status');

// New DOM elements for poi12 specific buttons
const poi12ButtonsDiv = document.getElementById('poi12-buttons');
// Re-added sroiOrderButton for poi12
const sroiOrderButtonPoi12 = document.getElementById('sroi-order-button-poi12');


// New DOM elements for SROI Info Modal
const sroiInfoModal = document.getElementById('sroi-info-modal');
const sroiModalPoiNameElement = document.getElementById('sroi-modal-poi-name');
const sroiModalContentBody = document.getElementById('sroi-modal-content-body');
const showSroiInfoButton = document.getElementById('show-sroi-info-button'); // Get the new SROI button

// New DOM element for network total carbon reduction display
const networkTotalCarbonReductionElement = document.getElementById('network-total-carbon-reduction');
const networkStatsStatusElement = document.getElementById('network-stats-status'); // Status for network stats

// New Market Modal DOM Elements
const marketMileageButton = document.getElementById('market-mileage-button');
const marketSelectionModal = document.getElementById('market-selection-modal');
const marketTypeSelectionStep = document.getElementById('market-type-selection-step');
const marketTypeOptionsDiv = document.getElementById('market-type-options');
const productTypeSelectionStep = document.getElementById('product-type-selection-step');
const selectedMarketTypeDisplay = document.getElementById('selected-market-type-display');
const productTypeOptionsDiv = document.getElementById('product-type-options');
const submitMarketActivityButton = document.getElementById('submit-market-activity-button');
const marketActivityStatusElement = document.getElementById('market-activity-status');
const backToMarketTypeButton = document.getElementById('back-to-market-type-button');
const marketStoreCodeInput = document.getElementById('market-store-code'); // Added for store code

// New Photo Album Modal DOM Elements
const photoAlbumPromoButton = document.getElementById('photo-album-promo-button');
const photoAlbumModal = document.getElementById('photo-album-modal');


// --- Local Storage ---
const localStorageKey = 'shuilSustainableTourismData_v2.2'; // Updated key for versioning
const localStorageActionsKey = 'shuilSustainableTourismActions_v2.2'; // Updated key for versioning

function loadData() {
    console.log("Loading data from localStorage..."); // Debugging line
    const data = localStorage.getItem(localStorageKey);
    if (data) {
        const parsedData = JSON.parse(data);
        totalMileage = parsedData.totalMileage || 0;
        totalCarbonReduction = parsedData.totalCarbonReduction || 0;
        totalScore = parsedData.totalScore || 0;
        playerName = parsedData.playerName || ''; // Load player name
        playerCode = parsedData.playerCode || ''; // Load player code

        // If player code is not loaded (first time or cleared data), generate a new one
        if (!playerCode) {
            playerCode = generateRandomCode();
            console.log("Generated new player code:", playerCode); // Debugging line
        } else {
             console.log("Loaded player code:", playerCode); // Debugging line
        }


        updateStatsDisplay();
         document.getElementById('stats-load-status').textContent = '已成功載入之前的旅遊數據。'; // Update status message
         document.getElementById('stats-load-status').classList.remove('text-gray-600');
         document.getElementById('stats-load-status').classList.add('text-green-600');

    } else {
         // If no data at all, generate a new code and initialize stats
         playerCode = generateRandomCode();
         totalMileage = 0;
         totalCarbonReduction = 0;
         totalScore = 0;
         playerName = '';
         console.log("No data found, generated new player code and initialized stats:", playerCode); // Debugging line
         updateStatsDisplay(); // Update display with initial stats and new code
         document.getElementById('stats-load-status').textContent = '未發現先前的旅遊數據，已建立新的永續旅者紀錄。'; // Update status message
         document.getElementById('stats-load-status').classList.remove('text-gray-600');
         document.getElementById('stats-load-status').classList.add('text-blue-600');
    }

    // Load action logs
    console.log("Loading action logs from localStorage..."); // Debugging line
    const actionsData = localStorage.getItem(localStorageActionsKey);
    if (actionsData) {
        loggedActions = JSON.parse(actionsData);
        console.log("Loaded action logs:", loggedActions); // Debugging line
        renderLoggedActions(); // Display loaded actions
    } else {
         loggedActions = []; // Initialize as empty array if no data
         loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>'; // Show empty message if no data
         console.log("No action logs found."); // Debugging line
    }
     saveData(); // Save data including the potentially new code and initialized actions
     console.log("Data loading complete."); // Debugging line

     // Fetch and display network-wide total (only if Firebase initialized successfully)
    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
         console.warn("Firebase not initialized, cannot fetch network total.");
    }
}

function saveData() {
    console.log("Saving data to localStorage..."); // Debugging line
    const dataToSave = {
        totalMileage: totalMileage,
        totalCarbonReduction: totalCarbonReduction,
        totalScore: totalScore,
        playerName: playerNameInput.value.trim(), // Save player name from input
        playerCode: playerCode // Save player code
    };
    localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
    console.log("Saved main data:", dataToSave); // Debugging line


    // Save action logs
    localStorage.setItem(localStorageActionsKey, JSON.stringify(loggedActions));
    console.log("Saved action logs:", loggedActions); // Debugging line

    // Send player data to Firebase (only if Firebase initialized successfully)
    if (db && playerCode) { // Ensure playerCode exists before saving to Firebase
       savePlayerDataToFirebase({
           playerCode: playerCode,
           playerName: playerNameInput.value.trim(),
           totalMileage: totalMileage,
           totalCarbonReduction: totalCarbonReduction,
           totalScore: totalScore,
           lastUpdated: serverTimestamp() // Use the imported serverTimestamp function
       });
    } else {
        console.warn("Firebase not initialized or player code missing, cannot save player data.");
    }
}

function updateStatsDisplay() {
    totalMileageSpan.textContent = `${(totalMileage / 1000).toFixed(2)} km`; // Display in km
    totalCarbonReductionSpan.textContent = `${totalCarbonReduction.toFixed(2)} g`;
    totalScoreSpan.textContent = totalScore;
    playerNameInput.value = playerName; // Set player name input value
    playerCodeDisplay.textContent = playerCode; // Display player code
    console.log("Stats display updated."); // Debugging line
}

// --- Generate Random Code ---
function generateRandomCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let code = '';
    // 3 random letters
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // 5 random digits
    for (let i = 0; i < 5; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
}

// --- Firebase Integration ---

// Function to save individual player data to Firebase
async function savePlayerDataToFirebase(playerData) {
    console.log("Attempting to save player data to Firebase for永續旅者:", playerData.playerCode); // Debugging line
     // Check if db is initialized before proceeding
     if (!db) {
          console.error("Firebase Firestore not initialized. Cannot save永續旅者data.");
          return;
     }
    try {
        // Use playerCode as the document ID in the 'players' collection
        // Use the imported collection and doc functions
        const playerDocRef = doc(collection(db, 'players'), playerData.playerCode);


        // Use set with merge: true to create or update the document
        // Use the imported setDoc function
        await setDoc(playerDocRef, playerData, { merge: true });


        console.log("永續旅者data saved to Firebase successfully for永續旅者:", playerData.playerCode); // Debugging line
        // After saving, fetch the updated network total (which sums all player data)
        fetchNetworkTotalCarbonReduction();

    } catch (e) {
        console.error("Error saving 永續旅者 data to Firebase: ", e); // Debugging line
        // Optional: Display an error message to the user
    }
}


// Function to fetch and display network-wide total carbon reduction from Firebase
async function fetchNetworkTotalCarbonReduction() {
    console.log("Attempting to fetch network total carbon reduction from Firebase..."); // Debugging line
     // Check if db is initialized before proceeding
     if (!db) {
          console.error("Firebase Firestore not initialized. Cannot fetch data.");
          networkTotalCarbonReductionElement.textContent = '載入失敗';
          networkStatsStatusElement.textContent = 'Firebase 未初始化。';
          networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600');
          networkStatsStatusElement.classList.add('text-red-600');
          return;
     }

    networkTotalCarbonReductionElement.textContent = '載入中...';
    networkStatsStatusElement.textContent = '從伺服器載入中...';
    networkStatsStatusElement.classList.remove('text-green-600', 'text-red-600', 'text-blue-600'); // Remove all previous status colors
    networkStatsStatusElement.classList.add('text-gray-600'); // Set to gray for loading


    try {
        // Get all documents in the 'players' collection
        // Use the imported collection and getDocs functions
        const playersSnapshot = await getDocs(collection(db, 'players'));


        let totalCarbonAcrossNetwork = 0;

        if (!playersSnapshot.empty) {
            playersSnapshot.forEach(doc => {
                const playerData = doc.data();
                // Add each player's totalCarbonReduction to the network total
                totalCarbonAcrossNetwork += (playerData.totalCarbonReduction || 0); // Use 0 if value is missing
            });
             console.log(`Processed ${playersSnapshot.size} 永續旅者documents.`); // Debugging line
        } else {
             console.log("No 永續旅者data found in Firebase 'players' collection."); // Debugging line
        }

        networkTotalCarbonReduction = totalCarbonAcrossNetwork; // Update the state variable
        networkTotalCarbonReductionElement.textContent = `${networkTotalCarbonReduction.toFixed(2)} g`;
        networkStatsStatusElement.textContent = '網路統計數據載入成功。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-red-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-green-600');
        console.log("Network total carbon reduction calculated and displayed:", networkTotalCarbonReduction, "g"); // Debugging line


    } catch (e) {
        console.error("Error fetching network total carbon reduction from Firebase: ", e); // Debugging line
        networkTotalCarbonReduction = 0; // Reset to 0 on error
        networkTotalCarbonReductionElement.textContent = '載入失敗';
        networkStatsStatusElement.textContent = '無法載入網路統計數據。';
        networkStatsStatusElement.classList.remove('text-gray-600', 'text-green-600', 'text-blue-600');
        networkStatsStatusElement.classList.add('text-red-600');
    }
}


// --- Page Navigation ---
function showHomepage() {
    homepageSection.style.display = 'block';
    missionPageSection.style.display = 'none';
     // Reset selected points and clear trip line when returning to homepage
    resetSelectedPoints(); // Re-added resetSelectedPoints
    clearTripLine(); // Re-added clearTripLine
     // Clear selected actions when returning to homepage
     clearSelectedActions();
     // Clear selected activity state
     selectedActivity = null;
      // Remove highlight from previously selected activity item
     const previousSelectedItem = activityListElement.querySelector(`.selected-activity-item`);
     if (previousSelectedItem) {
                 previousSelectedItem.classList.remove('selected-activity-item');
     }
     console.log("Showing homepage."); // Debugging line
     // Ensure network total is fetched/updated when returning to homepage
    if (db) {
        fetchNetworkTotalCarbonReduction();
    } else {
         console.warn("Firebase not initialized, cannot fetch network total on homepage.");
    }
}

function showMissionPage() {
    homepageSection.style.display = 'none';
    missionPageSection.style.display = 'block';

    // Trigger map resize and recenter after the container becomes visible
    // This helps the map render correctly if it was initialized while hidden
    if (map) {
         console.log("Map exists, triggering resize and recenter."); // Debugging line
         google.maps.event.trigger(map, 'resize');
         map.setCenter({ lat: 23.810, lng: 120.850 }); // Re-center to default location
         console.log("Map container is now visible. Triggered resize and recenter."); // Debugging line
    } else {
         console.log("Map not initialized yet when showing mission page."); // Debugging line
         // If map is not initialized, update status to reflect this
         const missionPageMapStatus = document.getElementById('map-status');
         if (missionPageMapStatus) {
              mapStatusElement.innerHTML = '地圖載入中... (等待 Google Maps API)<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
              mapStatusElement.classList.remove('text-green-600', 'text-red-600');
              mapStatusElement.classList.add('text-gray-600');
         }
    }


    // Check if transportData is defined before accessing its properties
    currentTransportDisplay.textContent = currentTransport && transportData[currentTransport] ? transportData[currentTransport].name : '未選擇';
     updateSelectedPointsDisplay(); // Re-added updateSelectedPointsDisplay
     console.log("Showing mission page. Current transport:", currentTransport); // Debugging line
}

// --- Google Map Initialization and POI Markers ---
// This function is called automatically by the Google Maps API script's callback parameter
function initMap() {
     console.log("initMap function called by Google Maps API."); // Debugging line

     // ** Added check for google.maps object and potential API loading errors **
     if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
         console.error("Google Maps API not loaded. Please check your API key, network connection, and browser console for errors.");
         // Check for common API loading errors logged by Google Maps itself
         if (window.google && window.google.maps && window.google.maps.api && window.google.maps.api.loaded === false) {
              console.error("Google Maps API failed to load. Check the network tab for details on the API request.");
         } else {
              console.error("Google Maps API object is not available.");
         }

         // Update map status element in mission page
         const missionPageMapStatus = document.getElementById('map-status');
         if (missionPageMapStatus) {
              mapStatusElement.innerHTML = '地圖載入失敗：API 金鑰認證失敗。請檢查您的金鑰和限制設定。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
              mapStatusElement.classList.remove('text-gray-600', 'text-green-600');
              mapStatusElement.classList.add('text-red-600');
         }
         // Re-added tripCalculationStatusElement update
         if (tripCalculationStatusElement) {
            tripCalculationStatusElement.textContent = '地圖服務未載入，無法計算路徑。';
            tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-red-600');
         }
         return; // Exit if API is not loaded
     }
      console.log("Google Maps API object is available."); // Debugging line


     // Assign google.maps.TravelMode values after the API is loaded
     // Re-added travelMode assignments
     transportData.bike.travelMode = google.maps.TravelMode.BICYCLING;
     transportData.walk.travelMode = google.maps.TravelMode.WALKING;
     transportData.bus_train.travelMode = google.maps.TravelMode.TRANSIT; // Using TRANSIT for public transport
     transportData.carpool_2_moto.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_3.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_4.travelMode = google.maps.TravelMode.DRIVING;
     transportData.carpool_5.travelMode = google.maps.TravelMode.DRIVING;
     transportData.thsr_haoxing.travelMode = google.maps.TravelMode.TRANSIT; // Using TRANSIT mode


    // Default view centered around Shuil里 (approximate coordinates)
    const defaultCoords = { lat: 23.810, lng: 120.850 };

    console.log("Initializing Google Map with center:", defaultCoords); // Debugging line
    map = new google.maps.Map(mapElement, {
        center: defaultCoords,
        zoom: 13, // Zoom level 13
         mapTypeControl: false, // Optional: hide map type control
         streetViewControl: false // Optional: hide street view control
    });
     console.log("Google Map object created:", map); // Debugging line


    // Re-added Directions Service and Renderer
    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map, suppressMarkers: true }); // suppressMarkers: true to use our own POI markers
    console.log("DirectionsService and DirectionsRenderer initialized.");


    // Add POI markers with default icons and labels
    console.log("Adding POI markers with default icons. Total POIs:", pois.length); // Debugging line
    pois.forEach(poi => {
        // Removed the custom icon property here to use default markers
        const marker = new google.maps.Marker({
            position: poi.coords,
            map: map,
            title: poi.name, // Marker title on hover
             label: { // Add label property to display text
                text: poi.name, // Display the POI name
                color: '#000000', // Label text color (black)
                fontSize: '12px', // Label font size
                fontWeight: 'bold', // Label font weight
                className: 'map-label' // Optional: Add a class for custom styling if needed
            }
        });

        // Store POI data with the marker
        marker.poiData = poi;

        // Add click listener to marker
        marker.addListener('click', function() {
            // For all POIs, including poi17, clicking the marker will open the standard POI modal.
            showPoiModal(this.poiData);
        });

        poiMarkers.push(marker); // Store marker object
    });
    console.log("POI markers added to map with default icons."); // Debugging line


    // The DirectionsRenderer will handle drawing the route polyline
    // We no longer need a separate tripPolyline object managed manually.
    // tripPolyline = new google.maps.Polyline({...});
    // tripPolyline.setMap(null);

    // Update map status element in mission page
     const missionPageMapStatus = document.getElementById('map-status');
     if (missionPageMapStatus) {
         mapStatusElement.innerHTML = '地圖載入成功！請從下方景點列表或地圖上選擇起點和終點。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
         mapStatusElement.classList.remove('text-gray-600', 'text-red-600');
         mapStatusElement.classList.add('text-green-600');
     }
     console.log("Google Map initialization complete."); // Debugging line
}
window.initMap = initMap; // Make initMap globally available

// --- POI Selection and Mileage Calculation ---

function updateSelectedPointsDisplay() {
    const startName = selectedStartPoi ? selectedStartPoi.name : '未選擇';
    const endName = selectedEndPoi ? selectedEndPoi.name : '未選擇';
    selectedPointsDisplay.textContent = `起點: ${startName} | 終點: ${endName}`;
     // Update list item highlights
     updatePoiListItemHighlights();
     console.log("Selected points display updated."); // Debugging line
}

function updatePoiListItemHighlights() {
     // Remove all existing highlights
     poiListElement.querySelectorAll('li').forEach(item => { // Changed selector to 'li'
         item.classList.remove('poi-list-item-start', 'poi-list-item-end');
     });

     // Add highlight to selected start POI list item
     if (selectedStartPoi) {
         const startItem = poiListElement.querySelector(`li[data-poi-id="${selectedStartPoi.id}"]`);
         if (startItem) {
             startItem.classList.add('poi-list-item-start');
         }
     }

     // Add highlight to selected end POI list item
     if (selectedEndPoi) {
         const endItem = poiListElement.querySelector(`li[data-poi-id="${selectedEndPoi.id}"]`);
         if (endItem) {
             endItem.classList.add('poi-list-item-end');
         }
     }
     console.log("POI list item highlights updated."); // Debugging line
}


function resetSelectedPoints() {
    selectedStartPoi = null;
    selectedEndPoi = null;
    updateSelectedPointsDisplay();
     // Clear the displayed route on the map
     clearTripLine();
     console.log("Selected points reset."); // Debugging line
}

function calculateTripMileage() {
    console.log("Calculate mileage button clicked."); // Debugging line
    // Check if directionsService is initialized
    if (!directionsService) {
        tripCalculationStatusElement.textContent = '地圖服務尚未載入，請稍候再試。';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.error("DirectionsService not initialized."); // Debugging line
        return;
    }

    if (!selectedStartPoi || !selectedEndPoi) {
        tripCalculationStatusElement.textContent = '請先選擇起點和終點景點！';
        tripCalculationStatusElement.classList.remove('text-green-600');
        tripCalculationStatusElement.classList.add('text-red-600');
        console.warn("Start or end POI not selected."); // Debugging line
        return;
    }

     if (selectedStartPoi.id === selectedEndPoi.id) {
         tripCalculationStatusElement.textContent = '起點和終點不能是同一個景點！';
         tripCalculationStatusElement.classList.remove('text-green-600');
         tripCalculationStatusElement.classList.add('text-red-600');
         console.warn("Start and end POI are the same."); // Debugging line
         return;
     }

     if (currentTransport === null) {
          tripCalculationStatusElement.textContent = '請先在首頁選擇交通方式！';
          tripCalculationStatusElement.classList.remove('text-green-600');
          tripCalculationStatusElement.classList.add('text-red-600');
          console.warn("Transport mode not selected."); // Debugging line
          return;
     }

    tripCalculationStatusElement.textContent = '正在計算路徑...'; // Added loading indicator
    tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
    tripCalculationStatusElement.classList.add('text-gray-700');
    clearTripLine(); // Clear previous route

    // Determine travel mode based on selected transport (simplified)
    let travelMode = google.maps.TravelMode.DRIVING; // Default
     // Find the selected transport data object
     const selectedTransportData = transportData[currentTransport];
     if (selectedTransportData && selectedTransportData.travelMode) {
         travelMode = selectedTransportData.travelMode;
     }
     console.log("Calculating trip with travel mode:", travelMode); // Debugging line


    const request = {
        origin: selectedStartPoi.coords,
        destination: selectedEndPoi.coords,
        travelMode: travelMode
         // Optional: Add optimizeWaypoints: true if you had multiple waypoints
    };

    directionsService.route(request, (response, status) => {
        console.log("Directions service response status:", status); // Debugging line
        if (status === 'OK') {
            // Display the route on the map
            directionsRenderer.setDirections(response);
            console.log("Route rendered on map."); // Debugging line

            // Get the distance from the response
            const route = response.routes[0];
            const leg = route.legs[0]; // Assuming a simple A to B route with one leg
            const distanceInMeters = leg.distance.value; // Distance in meters
            console.log("Calculated distance:", distanceInMeters, "meters"); // Debugging line

            // Add this distance to total mileage
            totalMileage += distanceInMeters;

            // Calculate carbon reduction for this trip
            let tripCarbonReduction = 0;
             if (currentTransport && transportData[currentTransport].carbonReductionPer10km > 0) {
                 // Carbon reduction per meter = (reduction per 10km / 10000 meters)
                 const carbonReductionPerMeter = transportData[currentTransport].carbonReductionPer10km / 10000;
                 tripCarbonReduction = distanceInMeters * carbonReductionPerMeter;
                 totalCarbonReduction += tripCarbonReduction;
             }
            console.log("Calculated carbon reduction:", tripCarbonReduction, "grams"); // Debugging line


            // Calculate score based on metersPerPoint for the selected transport
            let scoreForThisTrip = 0;
            if (currentTransport && transportData[currentTransport].metersPerPoint !== Infinity) {
                 const metersPerPoint = transportData[currentTransport].metersPerPoint;
                 scoreForThisTrip = Math.floor(distanceInMeters / metersPerPoint);
                 totalScore += scoreForThisTrip;
                 console.log("Score earned this trip based on metersPerPoint:", scoreForThisTrip); // Debugging line
            } else {
                 console.log("No distance-based score for this transport type."); // Debugging line
            }


            // Update displays
            updateStatsDisplay();
             tripCalculationStatusElement.textContent = `本次旅程里程 (路徑): ${(distanceInMeters / 1000).toFixed(2)} km, 估計減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;
             tripCalculationStatusElement.classList.remove('text-red-600', 'text-gray-700');
             tripCalculationStatusElement.classList.add('text-green-600');


            // --- Log the trip calculation result ---
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            const newLogEntry = {
                type: 'trip_calculation', // New type for trip calculation logs
                startPoiName: selectedStartPoi.name,
                endPoiName: selectedEndPoi.name,
                transportName: transportData[currentTransport].name,
                transportIcon: transportData[currentTransport].icon,
                mileageInMeters: distanceInMeters,
                carbonReduction: tripCarbonReduction,
                points: scoreForThisTrip, // Score from this trip
                timestamp: timestamp
            };

            loggedActions.push(newLogEntry); // Add new log to the array
            saveData(); // Save updated logs and potentially send data to server
            renderLoggedActions(); // Re-render the list
            console.log("Logged trip calculation:", newLogEntry); // Debugging line
            // --- End of logging ---

        } else {
            // Handle errors, e.g., route not found
            tripCalculationStatusElement.textContent = `計算路徑失敗: ${status}`;
            tripCalculationStatusElement.classList.remove('text-green-600', 'text-gray-700');
            tripCalculationStatusElement.classList.add('text-red-600');
            console.error('Directions request failed due to ' + status); // Debugging line
        }
    });
}

function clearTripLine() {
     // DirectionsRenderer handles clearing the displayed route
     if (directionsRenderer) {
         directionsRenderer.setDirections({ routes: [] }); // Clear directions
         console.log("Trip line cleared."); // Debugging line
     }
}


// --- POI List and Modal ---
function populatePoiList() {
    poiListElement.innerHTML = ''; // Clear existing list
    pois.forEach(poi => {
        const listItem = document.createElement('li');
        listItem.classList.add('clickable-list-item', 'hover:text-green-700', 'p-3', 'rounded-md', 'transition-colors', 'duration-150'); // Added more Tailwind classes for better styling
        listItem.dataset.poiId = poi.id; // Store POI ID for highlighting

        // Create a span for the text content (POI name and icon)
        const textSpan = document.createElement('span');
        // Use the emoji icon from the poi data for the list item display
        let poiNameDisplay = `${poi.icon} ${poi.name}`;

        // Add "NEW" indicator if isNew flag is true
        if (poi.isNew) {
            poiNameDisplay += ' <span class="new-indicator text-red-500 font-bold text-xs ml-1">NEW</span>'; // Added NEW indicator
        }
        // Add (SROI) tag if sroiInfo exists
        if (poi.sroiInfo) {
            poiNameDisplay += ' <span class="text-purple-600 font-semibold text-xs ml-1">(SROI)</span>';
        }
        textSpan.innerHTML = poiNameDisplay; // Use innerHTML to render the span tag for NEW and SROI

        // Add a click listener to the text span to show the modal
        textSpan.addEventListener('click', (event) => {
            event.stopPropagation();
            showPoiModal(poi); // Always show POI modal first
        });
        listItem.appendChild(textSpan);

        // Create a container for icons (social, navigation, and log trip)
        const iconGroup = document.createElement('div');
        iconGroup.classList.add('icon-group', 'flex', 'items-center', 'space-x-3'); // Use Tailwind for spacing

        // Add social media link icon if available
        if (poi.socialLink) {
            const socialLinkElement = document.createElement('a');
            socialLinkElement.href = poi.socialLink;
            socialLinkElement.target = "_blank"; // Open in new tab
            socialLinkElement.classList.add('social-icon', 'text-gray-600', 'hover:text-blue-500'); // Tailwind styling
            // Determine icon based on link (simple check)
            if (poi.socialLink.includes('facebook')) {
                 socialLinkElement.innerHTML = '<i class="fab fa-facebook fa-lg"></i>'; // Facebook icon, larger
            } else if (poi.socialLink.includes('instagram')) {
                 socialLinkElement.innerHTML = '<i class="fab fa-instagram fa-lg"></i>'; // Instagram icon, larger
            } else {
                 socialLinkElement.innerHTML = '<i class="fas fa-link fa-lg"></i>'; // Generic link icon, larger
            }
            iconGroup.appendChild(socialLinkElement);
        }

        // Add navigation link icon
        const navigationLinkElement = document.createElement('a');
        // Use Google Maps navigation URL format
        navigationLinkElement.href = `https://www.google.com/maps/search/?api=1&query=$${poi.coords.lat},${poi.coords.lng}`; // Correct Google Maps link
        navigationLinkElement.target = "_blank"; // Open in new tab (will open Google Maps app if installed)
        navigationLinkElement.classList.add('navigation-icon', 'text-gray-600', 'hover:text-emerald-500'); // Tailwind styling
        navigationLinkElement.innerHTML = '<i class="fas fa-compass fa-lg"></i>'; // Compass icon, larger
        iconGroup.appendChild(navigationLinkElement);

        // Add Log Trip icon/button
        const logTripIcon = document.createElement('button'); // Changed to button for better accessibility
        logTripIcon.classList.add('log-trip-icon', 'text-gray-600', 'hover:text-orange-500', 'p-1', 'rounded-full', 'focus:outline-none', 'focus:ring-2', 'focus:ring-orange-300'); // Tailwind styling
        logTripIcon.title = `記錄前往 ${poi.name} 的旅程`;
        logTripIcon.innerHTML = '<i class="fas fa-car-side fa-lg"></i>'; // Car icon, larger
        logTripIcon.addEventListener('click', (event) => {
             event.stopPropagation(); // Prevent triggering the modal or list item click
             showLogTripModal(poi);
        });
        iconGroup.appendChild(logTripIcon);


        listItem.appendChild(iconGroup);


        // Store POI data on the list item and its ID for highlighting
        // listItem.poiData = poi; // Already done by marker
        // Add click listener to the list item for selecting start/end points (still useful)
        // Clicking the list item (outside the textSpan or icons) will show the POI modal.
        listItem.addEventListener('click', () => showPoiModal(poi));
        poiListElement.appendChild(listItem);
    });
     updatePoiListItemHighlights(); // Re-added updatePoiListItemHighlights
     console.log("POI list populated with navigation and log trip icons."); // Debugging line
}

function showPoiModal(poi) {
    console.log("Showing POI modal for:", poi.name); // Debugging line
    // Store the POI data temporarily for the modal buttons
    poiModal.currentPoi = poi;

    poiModalTitle.textContent = poi.name;
    // Use innerHTML to allow <br> tags from description
    let modalDescriptionHTML = poi.description.replace(/\n/g, '<br>'); // Replace newline with <br>

    // Add specific content for poi17 (水里星光市集) - this is now part of its main description
    // but we can still add extra dynamic elements if needed.
    if (poi.id === 'poi17') {
        // The main description is already updated. We can add the schedule link here if needed.
        modalDescriptionHTML += '<br><br>'; // Add some spacing
        // Add link if marketScheduleLink exists
        if (poi.marketScheduleLink) {
             modalDescriptionHTML += `<p class="font-semibold text-green-800">出攤日期預告:</p>`;
            modalDescriptionHTML += `<p><a href="${poi.marketScheduleLink}" target="_blank" class="text-blue-600 hover:underline">點此查看最新出攤日期</a></p>`;
        }
         // The second part of the description for poi17 is already included in its `description` field.
    }


    poiModalDescription.innerHTML = modalDescriptionHTML; // Set the updated description


     poiModalCoordinates.textContent = `座標: ${poi.coords.lat}, ${poi.coords.lng}`; // Use .lat and .lng for Google Maps coords

    // Handle image display (if any)
    if (poi.image) {
        poiModalImage.src = poi.image;
        poiModalImage.classList.remove('hidden');
    } else {
        poiModalImage.classList.add('hidden');
        poiModalImage.src = ''; // Clear src
    }

    // Add social media link in modal if available
    poiModalSocialDiv.innerHTML = ''; // Clear previous content
    if (poi.socialLink) {
        const socialLinkElement = document.createElement('a');
        socialLinkElement.href = poi.socialLink;
        socialLinkElement.target = "_blank"; // Open in new tab
        socialLinkElement.classList.add('text-green-600', 'hover:underline', 'font-semibold', 'block', 'mt-2'); // Changed link color
        // Determine link text based on link (simple check)
        if (poi.socialLink.includes('facebook')) {
             socialLinkElement.innerHTML = '<i class="fab fa-facebook mr-1"></i>前往 Facebook 粉絲專頁'; // Added icon
        } else if (poi.socialLink.includes('instagram')) {
             socialLinkElement.innerHTML = '<i class="fab fa-instagram mr-1"></i>前往 Instagram 頁面'; // Added icon
        } else if (poi.socialLink.includes('waca.tw') || poi.socialLink.includes('tg-ecohotel.com') || poi.socialLink.includes('shli.gov.tw') || poi.socialLink.includes('taiwantrip.com.tw')) { // Added checks for specific website types and taiwantrip
             socialLinkElement.innerHTML = '<i class="fas fa-link mr-1"></i>前往官方網站'; // Added icon
        }
         else {
             socialLinkElement.innerHTML = '<i class="fas fa-link mr-1"></i>前往相關網站'; // Added icon
        }
        poiModalSocialDiv.appendChild(socialLinkElement);
    }

    // --- Handle POI Review Section Visibility and Setup ---
    // Check if the current POI is '機車貓聯盟' (poi14) or '水里里山村' (poi16)
    if (poi.id === 'poi14' || poi.id === 'poi16') {
        poiReviewSection.classList.remove('hidden'); // Show the review section
        // Clear previous input values and status message
        consumptionAmountInput.value = '';
        reviewCodeInput.value = '';
        poiReviewStatusElement.textContent = '';
        poiReviewStatusElement.classList.remove('text-green-600', 'text-red-600');
    } else {
        poiReviewSection.classList.add('hidden'); // Hide the review section
    }

     // --- Handle poi12 specific buttons visibility ---
     // poi12 now has the game link button and the SROI button
     if (poi.id === 'poi12') {
         poi12ButtonsDiv.classList.remove('hidden'); // Show poi12 specific buttons
          // Ensure the main SROI button container is hidden if poi12 is selected
          document.getElementById('sroi-info-button-container').classList.add('hidden');
     } else {
         poi12ButtonsDiv.classList.add('hidden'); // Hide poi12 specific buttons
         // Ensure the main SROI button container is shown if sroiInfo exists and it's not poi12
         if (poi.sroiInfo) {
              document.getElementById('sroi-info-button-container').classList.remove('hidden');
              showSroiInfoButton.sroiInfo = poi.sroiInfo; // Store sroiInfo on the button
              showSroiInfoButton.poiName = poi.name; // Store POI name
         } else {
              document.getElementById('sroi-info-button-container').classList.add('hidden');
              showSroiInfoButton.sroiInfo = null; // Clear stored info
              showSroiInfoButton.poiName = null; // Clear stored name
         }
     }

    // --- Dynamically add "逛市集增里程" button for 水里星光市集 (poi17) ---
    poiModalDynamicButtonsDiv.innerHTML = ''; // Clear previous dynamic buttons
    if (poi.id === 'poi17') {
        const marketButtonInModal = document.createElement('button');
        marketButtonInModal.id = 'poi-modal-market-button'; // Give it an ID if needed for styling/selection
        marketButtonInModal.className = 'w-full mt-3 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition-all duration-300 ease-in-out text-center';
        marketButtonInModal.innerHTML = '<i class="fas fa-store mr-2"></i>逛市集增里程';
        marketButtonInModal.addEventListener('click', () => {
            hidePoiModal(); // Close the current POI modal
            showMarketSelectionModal(); // Open the market selection modal
        });
        poiModalDynamicButtonsDiv.appendChild(marketButtonInModal);
    }


    poiModal.classList.remove('hidden');
}

function hidePoiModal() {
    console.log("Hiding POI modal."); // Debugging line
    poiModal.classList.add('hidden');
    poiModal.currentPoi = null; // Clear temporary data
}

// --- POI Review Submission ---
function submitPoiReview() {
    console.log("Submit POI review button clicked."); // Debugging line
    const currentPoi = poiModal.currentPoi;
    if (!currentPoi) {
        console.error("No POI selected for review submission.");
        return; // Should not happen if button is only shown for valid POIs
    }

    const consumptionAmount = parseFloat(consumptionAmountInput.value);
    const reviewCode = reviewCodeInput.value.trim();

    // Validation
    if (isNaN(consumptionAmount) || consumptionAmount <= 0) {
        poiReviewStatusElement.textContent = '請輸入有效的消費金額。';
        poiReviewStatusElement.className = 'mt-3 text-sm font-semibold text-red-600'; // Use className for Tailwind
        console.warn("Invalid consumption amount:", consumptionAmount);
        return;
    }

    // Check if the code is exactly 3 digits (0-9)
    const codeRegex = /^[0-9]{3}$/;
    if (!codeRegex.test(reviewCode)) {
        poiReviewStatusElement.textContent = '請輸入有效的3碼數字審核碼。';
        poiReviewStatusElement.className = 'mt-3 text-sm font-semibold text-red-600'; // Use className
        console.warn("Invalid review code format:", reviewCode);
        return;
    }

    // If validation passes, add points and log the action
    const pointsEarned = 10; // As per requirement
    totalScore += pointsEarned;
    updateStatsDisplay(); // Update score display
    // saveData(); // Save the updated score and potentially send data to server // Called in newLogEntry

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLogEntry = {
        type: 'poi_review', // Mark this as a POI review log
        poiName: currentPoi.name,
        consumption: consumptionAmount,
        reviewCode: reviewCode,
        timestamp: timestamp,
        points: pointsEarned
    };

    loggedActions.push(newLogEntry); // Add new log to the array
    saveData(); // Save updated logs and potentially send data to server
    renderLoggedActions(); // Re-render the list

    console.log(`Logged review for ${currentPoi.name}: Consumption ${consumptionAmount}, Code ${reviewCode}. Points: ${pointsEarned}`); // Debugging line

    poiReviewStatusElement.textContent = `審核成功！獲得 +${pointsEarned} 積分！`;
    poiReviewStatusElement.className = 'mt-3 text-sm font-semibold text-green-600'; // Use className

    // Clear input fields after successful submission
    consumptionAmountInput.value = '';
    reviewCodeInput.value = '';

    // Optional: Hide the review section after submission, or leave it visible with success message
    // poiReviewSection.classList.add('hidden');

    // Reset status message after a few seconds
    setTimeout(() => {
        poiReviewStatusElement.textContent = '';
        poiReviewStatusElement.className = 'mt-3 text-sm font-semibold text-gray-600'; // Reset class
    }, 5000); // Display success message for 5 seconds
}


// --- Sustainable Activities and Verification Modal ---
 function populateActivityList() {
     activityListElement.innerHTML = ''; // Clear existing list
     activities.forEach(activity => {
         const listItem = document.createElement('li');
         listItem.classList.add('clickable-list-item', 'p-2', 'rounded-md', 'hover:bg-blue-100', 'transition-colors'); // Added Tailwind classes
         listItem.textContent = `${activity.name} (${activity.points} 分)`;
         // Store activity data on the list item
         listItem.activityData = activity;
         listItem.addEventListener('click', handleActivityItemClick); // Add click listener
         activityListElement.appendChild(listItem);
     });
     console.log("Activity list populated."); // Debugging line
 }

 function handleActivityItemClick() {
     console.log("Activity item clicked:", this.activityData.name); // Debugging line
     // Remove highlight from previously selected item
     if (selectedActivity) {
         // Find the previously selected item in the list and remove its highlight
         const previousSelectedItem = Array.from(activityListElement.children).find(child => child.activityData.id === selectedActivity.id);
         if (previousSelectedItem) {
             previousSelectedItem.classList.remove('selected-activity-item', 'bg-blue-200', 'font-semibold'); // Tailwind classes for selection
         }
     }

     // Set the newly selected activity
     selectedActivity = this.activityData;
     this.classList.add('selected-activity-item', 'bg-blue-200', 'font-semibold'); // Highlight the selected item with Tailwind

     console.log("Selected Activity:", selectedActivity.name); // Debugging line
 }


 function showActivityModal() {
     console.log("Participate activity button clicked. Showing activity modal."); // Debugging line
     if (!selectedActivity) {
         alert('請先從列表中選擇一個永續山村任務活動。');
         console.warn("No activity selected when trying to show modal."); // Debugging line
         return;
     }
     selectedActivityNameElement.textContent = selectedActivity.name; // Display selected activity name in modal
     verificationCodeInput.value = ''; // Clear previous input
     activityContentInput.value = ''; // Clear previous input
     activityLogStatusElement.textContent = ''; // Clear previous status
     activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-gray-700'; // Reset class

     // Check if the selected activity has an image and display it
     if (selectedActivity.image) {
         activityModalImage.src = selectedActivity.image;
         activityModalImage.classList.remove('hidden');
          activityModalImage.alt = `${selectedActivity.name} 相關圖片`; // Set alt text
     } else {
         activityModalImage.classList.add('hidden');
         activityModalImage.src = ''; // Clear src if no image
          activityModalImage.alt = ''; // Clear alt text
     }


     activityModal.classList.remove('hidden');
 }

 function hideActivityModal() {
     console.log("Hiding activity modal."); // Debugging line
     activityModal.classList.add('hidden');
 }

 function logActivity() {
     console.log("Submit activity log button clicked."); // Debugging line
     if (!selectedActivity) {
         activityLogStatusElement.textContent = '請先選擇一個活動。';
         activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
         console.warn("No activity selected when logging."); // Debugging line
         return;
     }

     const inputCode = verificationCodeInput.value.trim();
     const activityContent = activityContentInput.value.trim();

     if (!inputCode) {
         activityLogStatusElement.textContent = '請輸入活動驗證碼。';
         activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
         console.warn("Verification code is empty."); // Debugging line
         return;
     }

     // Updated regex for any 6 alphanumeric characters
     const codeRegex = /^[a-zA-Z0-9]{6}$/;

     if (codeRegex.test(inputCode)) { // Check if the format is correct
         // If format is correct, verification is successful based on user's request
         const pointsEarned = selectedActivity.points;
         totalScore += pointsEarned;
         updateStatsDisplay();
         // saveData(); // Called in newLogEntry

         const now = new Date();
         const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

         const newLogEntry = {
             type: 'activity', // Mark this as an activity log
             activityName: selectedActivity.name,
             content: activityContent,
             timestamp: timestamp,
             points: pointsEarned
         };

         loggedActions.push(newLogEntry); // Add new log to the array
         saveData(); // Save updated logs and potentially send data to server
         renderLoggedActions(); // Re-render the list

         console.log("Logged Activity:", selectedActivity.name, "Content:", activityContent, "Code:", inputCode, "Points:", pointsEarned, "at", timestamp); // Debugging line
         activityLogStatusElement.textContent = `活動已記錄！獲得 +${pointsEarned} 積分！`;
         activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-green-600'; // Use className

         // Clear inputs and selected activity state
         verificationCodeInput.value = '';
         activityContentInput.value = '';
         if (selectedActivity) { // Deselect
            const currentSelectedItem = Array.from(activityListElement.children).find(child => child.activityData.id === selectedActivity.id);
            if (currentSelectedItem) {
                currentSelectedItem.classList.remove('selected-activity-item', 'bg-blue-200', 'font-semibold');
            }
            selectedActivity = null;
         }

         activityModalImage.classList.add('hidden');
         activityModalImage.src = '';


         // Reset status message after a few seconds
         setTimeout(() => {
             activityLogStatusElement.textContent = '';
             activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-gray-700'; // Reset class
         }, 5000); // Display success message for 5 seconds

     } else {
         // If format is incorrect
         activityLogStatusElement.textContent = '無效的驗證碼格式。請輸入任 6 個英文字母或數字。';
         activityLogStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
         console.warn("Invalid verification code format."); // Debugging line
     }
 }


// --- Sustainable Actions Logging ---

// Function to populate the selectable action list
function populateSelectableActionsList() {
    selectableActionsListElement.innerHTML = ''; // Clear existing list
    sustainableActions.forEach(action => {
        const actionItem = document.createElement('div');
        actionItem.classList.add('selectable-action-item', 'p-2', 'border', 'rounded-md', 'cursor-pointer', 'hover:bg-green-50', 'transition-colors'); // Added Tailwind classes
        actionItem.textContent = `${action.name} (${action.points} 分)`;
        actionItem.actionData = action; // Store action data
        actionItem.addEventListener('click', toggleSustainableActionSelection);
        selectableActionsListElement.appendChild(actionItem);
    });
    console.log("Selectable actions list populated."); // Debugging line
}

// Function to handle action item click (toggle selection)
function toggleSustainableActionSelection() {
    const actionItem = this;
    const actionName = actionItem.actionData.name;

    const index = selectedSustainableActions.indexOf(actionName);

    if (index === -1) {
        // If not selected, add to selected list and highlight
        selectedSustainableActions.push(actionName);
        actionItem.classList.add('selected', 'bg-green-100', 'border-green-500', 'font-semibold'); // Tailwind for selection
    } else {
        // If selected, remove from selected list and remove highlight
        selectedSustainableActions.splice(index, 1);
        actionItem.classList.remove('selected', 'bg-green-100', 'border-green-500', 'font-semibold'); // Tailwind for deselection
    }
     console.log("Selected Actions:", selectedSustainableActions); // Log selected actions
}

// Function to clear selected actions
function clearSelectedActions() {
     selectedSustainableActions = []; // Clear the array
     // Remove 'selected' class from all action items
     selectableActionsListElement.querySelectorAll('.selectable-action-item').forEach(item => {
         item.classList.remove('selected', 'bg-green-100', 'border-green-500', 'font-semibold');
     });
     console.log("Selected actions cleared."); // Debugging line
}


function logSustainableAction() {
    console.log("Log action button clicked."); // Debugging line
    const actionText = sustainableActionLogTextarea.value.trim();

    if (selectedSustainableActions.length === 0) {
         actionLogStatusElement.textContent = '請至少選擇一個永續行動項目。';
         actionLogStatusElement.className = 'mt-3 text-sm font-semibold text-red-600'; // Use className
         console.warn("No sustainable action selected."); // Debugging line
         return;
    }

    if (!actionText) {
         actionLogStatusElement.textContent = '請輸入您具體的行動內容。';
         actionLogStatusElement.className = 'mt-3 text-sm font-semibold text-red-600'; // Use className
         console.warn("Sustainable action content is empty."); // Debugging line
         return;
    }


    // Calculate points from selected actions
    let pointsEarnedFromActions = 0;
    selectedSustainableActions.forEach(selectedName => {
         const action = sustainableActions.find(act => act.name === selectedName);
         if (action) {
             pointsEarnedFromActions += action.points;
         }
    });

    totalScore += pointsEarnedFromActions; // Add points to total score
    updateStatsDisplay(); // Update score display
    // saveData(); // Called in newLogEntry


    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLogEntry = {
        type: 'action', // Mark this as a sustainable action log
        text: actionText,
        timestamp: timestamp,
        actions: [...selectedSustainableActions], // Store selected action names
        points: pointsEarnedFromActions // Store points earned from this log
    };

    loggedActions.push(newLogEntry); // Add new log to the array
    saveData(); // Save updated logs and potentially send data to server
    renderLoggedActions(); // Re-render the list

    console.log("Logged Action:", actionText, "Selected:", selectedSustainableActions, "Points:", pointsEarnedFromActions, "at", timestamp); // Debugging line
    actionLogStatusElement.textContent = `行動已記錄！獲得 +${pointsEarnedFromActions} 積分！`;
    actionLogStatusElement.className = 'mt-3 text-sm font-semibold text-green-600'; // Use className

    // Clear selected actions and textarea
    clearSelectedActions();
    sustainableActionLogTextarea.value = '';

     // Reset status message after a few seconds
     setTimeout(() => {
         actionLogStatusElement.textContent = '';
         actionLogStatusElement.className = 'mt-3 text-sm font-semibold text-gray-600'; // Reset class
     }, 5000); // Display success message for 5 seconds

}

function renderLoggedActions() {
    loggedActionsListElement.innerHTML = ''; // Clear current list
    console.log("Rendering logged actions. Total logs:", loggedActions.length); // Debugging line

    if (loggedActions.length === 0) {
        loggedActionsListElement.innerHTML = '<p class="text-gray-500 text-center">尚無行動紀錄</p>';
        return;
    }

    // Sort logs by timestamp in descending order (most recent first)
    const sortedLogs = [...loggedActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


    sortedLogs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.classList.add('action-log-item'); // Base class from CSS

        let logContentHTML = '';
        let pointsText = ''; // Initialize pointsText here

        // Add points information if points are defined and greater than 0
        if (log.points !== undefined && log.points > 0) {
             pointsText = `<p class="log-points">獲得積分: ${log.points}</p>`;
        } else if (log.points === 0) { // Explicitly show 0 points if applicable
             pointsText = `<p class="log-points text-gray-600">獲得積分: 0</p>`;
        } else {
             pointsText = ''; // No points info if not applicable
        }


        switch (log.type) {
            case 'action':
                logContentHTML = `
                    <p class="log-type">永續行動記錄</p>
                    <p class="text-sm text-gray-700 mb-1">選擇的行動: ${log.actions ? log.actions.join(', ') : '無'}</p>
                    <p>${log.text}</p>
                `;
                break;
            case 'activity':
                logContentHTML = `
                    <p class="log-type">永續山村任務活動記錄</p>
                    <p class="text-sm text-gray-700 mb-1">活動名稱: ${log.activityName}</p>`;
                 if (log.content) { // Only add content if it exists
                      logContentHTML += `<p>活動內容/課程名稱: ${log.content}</p>`;
                 }
                break;
            case 'trip_to_poi':
                 logContentHTML = `
                     <p class="log-type">前往景點旅程記錄 (手動)</p>
                     <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                     <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                     <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>`;
                     // Only add carbon reduction if it's greater than 0
                     if (log.carbonReduction > 0) {
                          logContentHTML += `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>`;
                     }
                break;
            case 'poi_review':
                 logContentHTML = `
                      <p class="log-type">永續消費記錄</p>
                      <p class="text-sm text-gray-700 mb-1">景點: ${log.poiName}</p>
                      <p class="text-sm text-gray-700 mb-1">消費金額: ${log.consumption}</p>
                      <p class="text-sm text-gray-700 mb-1">審核碼: ${log.reviewCode}</p>
                  `;
                 break;
            case 'trip_calculation': // New type for trip calculation from map
                  logContentHTML = `
                      <p class="log-type">旅程計算記錄 (地圖)</p>
                      <p class="text-sm text-gray-700 mb-1">起點: ${log.startPoiName}</p>
                      <p class="text-sm text-gray-700 mb-1">終點: ${log.endPoiName}</p>
                      <p class="text-sm text-gray-700 mb-1">交通方式: ${log.transportName} (${log.transportIcon})</p>
                      <p class="text-sm text-gray-700 mb-1">里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>
                       ${log.carbonReduction > 0 ? `<p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}
                  `;
                 break;
            case 'market_visit': // New case for market visits
                logContentHTML = `
                    <p class="log-type">逛市集增里程記錄</p>
                    <p class="text-sm text-gray-700 mb-1">市集類型: ${log.marketTypeName}</p>
                    <p class="text-sm text-gray-700 mb-1">消費項目: ${log.productName} (${log.productIcon})</p>
                    <p class="text-sm text-gray-700 mb-1">增加里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>
                    <p class="text-sm text-gray-700 mb-1">估計減碳: ${log.carbonReduction.toFixed(2)} g</p>
                    ${log.storeCode ? `<p class="text-sm text-gray-700 mb-1">商店碼: ${log.storeCode}</p>` : ''}
                `;
                break;
        }

        logItem.innerHTML = `
            ${logContentHTML}
            ${pointsText}
            <p class="timestamp">${log.timestamp}</p>
        `;
        loggedActionsListElement.appendChild(logItem);
    });
    console.log("Logged actions rendered."); // Debugging line
}

// --- Log Trip Modal (Manual Logging) ---

// Function to show the manual log trip modal
function showLogTripModal(poi) {
    console.log("Showing log trip modal for:", poi.name);
    currentLogTripPoi = poi; // Store the POI being logged

    logTripPoiNameElement.textContent = poi.name; // Set the POI name in the modal
    logTripMileageInput.value = ''; // Clear previous mileage input
    logTripStatusElement.textContent = ''; // Clear previous status
    logTripTransportOptionsDiv.innerHTML = ''; // Clear previous options for transport selection
    selectedLogTripTransport = null; // Reset selected transport for this modal

    // Populate transport options in the modal (excluding THSR and Taxi for manual log)
    for (const key in transportData) {
        if (key !== 'thsr_haoxing' && key !== 'taxi') { // Assuming 'taxi' is not a key in transportData for mileage
            const transportOption = transportData[key];
            const button = document.createElement('button');
            // Added more descriptive classes for styling
            button.className = 'log-trip-transport-button px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm';
            button.textContent = `${transportOption.icon} ${transportOption.name}`;
            button.dataset.transport = key; // Store transport key
            button.addEventListener('click', handleLogTripTransportSelect);
            logTripTransportOptionsDiv.appendChild(button);
        }
    }


    logTripTransportStatusElement.classList.add('hidden'); // Hide transport status initially
    logTripMileageStatusElement.classList.add('hidden'); // Hide mileage status initially

    logTripModal.classList.remove('hidden');
}

// Function to hide the manual log trip modal
function hideLogTripModal() {
    console.log("Hiding log trip modal.");
    logTripModal.classList.add('hidden');
    currentLogTripPoi = null; // Clear the stored POI
    selectedLogTripTransport = null; // Clear selected transport
    // Remove selected class from transport buttons in the modal
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold'); // Tailwind for selection
    });
}

// Function to handle selection of transport in the manual log trip modal
let selectedLogTripTransport = null; // State variable for selected transport in this modal

function handleLogTripTransportSelect() {
    console.log("Log trip transport button clicked:", this.dataset.transport);
    // Remove selected class from all buttons in this modal
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold'); // Tailwind for selection
    });

    // Add selected class to the clicked button
    this.classList.add('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold'); // Tailwind for selection
    selectedLogTripTransport = this.dataset.transport; // Store the selected transport key
    logTripTransportStatusElement.classList.add('hidden'); // Hide status if transport is selected
    console.log("Selected manual log trip transport:", selectedLogTripTransport);
}


// Function to submit the manual trip log
function submitLogTrip() {
    console.log("Submit log trip button clicked.");

    // Clear previous status messages
    logTripStatusElement.textContent = '';
    logTripStatusElement.className = 'mt-4 text-sm font-semibold text-gray-700'; // Reset class
    logTripTransportStatusElement.classList.add('hidden');
    logTripMileageStatusElement.classList.add('hidden');


    if (!currentLogTripPoi) {
        console.error("No POI selected for manual trip logging.");
         logTripStatusElement.textContent = '發生錯誤：未選擇景點。';
         logTripStatusElement.classList.add('text-red-600');
        return;
    }

    if (!selectedLogTripTransport) {
        logTripTransportStatusElement.textContent = '請選擇交通方式。';
        logTripTransportStatusElement.classList.remove('hidden');
        logTripTransportStatusElement.classList.add('text-red-600');
        console.warn("No transport selected for manual log trip.");
        return;
    }

    const mileageKm = parseFloat(logTripMileageInput.value);

    if (isNaN(mileageKm) || mileageKm < 0) { // Allow 0 km for cases where user might just want to log arrival without distance
        logTripMileageStatusElement.textContent = '請輸入有效的里程數 (大於等於 0)。';
        logTripMileageStatusElement.classList.remove('hidden');
        logTripMileageStatusElement.classList.add('text-red-600');
        console.warn("Invalid mileage input:", mileageKm);
        return;
    }

    const mileageInMeters = mileageKm * 1000; // Convert km to meters

    // Calculate carbon reduction for this manual trip
    let tripCarbonReduction = 0;
    const transportInfo = transportData[selectedLogTripTransport];
    if (transportInfo && transportInfo.carbonReductionPer10km > 0) {
        const carbonReductionPerMeter = transportInfo.carbonReductionPer10km / 10000;
        tripCarbonReduction = mileageInMeters * carbonReductionPerMeter;
    }

    // --- FIX: Add the calculated values to the total stats ---
    totalMileage += mileageInMeters;
    totalCarbonReduction += tripCarbonReduction;
    // Calculate score for this manual trip
    let scoreForThisTrip = 0;
     if (transportInfo && transportInfo.metersPerPoint !== Infinity) {
          const metersPerPoint = transportInfo.metersPerPoint;
          scoreForThisTrip = Math.floor(mileageInMeters / metersPerPoint);
          totalScore += scoreForThisTrip; // Add to total score
     } else {
         console.log("No distance-based score for this manual transport type."); // Debugging line
     }
    // --- END FIX ---


    updateStatsDisplay(); // Update displays
    // saveData(); // Called in newLogEntry

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newLogEntry = {
        type: 'trip_to_poi', // Mark this as a manual trip to POI log
        poiName: currentLogTripPoi.name,
        transportName: transportInfo.name,
        transportIcon: transportInfo.icon,
        mileageInMeters: mileageInMeters,
        carbonReduction: tripCarbonReduction,
        points: scoreForThisTrip, // Score from this trip
        timestamp: timestamp
    };

    loggedActions.push(newLogEntry); // Add new log to the array
    saveData(); // Save updated logs and potentially send data to server
    renderLoggedActions(); // Re-render the list

    console.log("Logged Manual Trip:", newLogEntry); // Debugging line

    logTripStatusElement.textContent = `已記錄前往 ${currentLogTripPoi.name} 的旅程！里程: ${mileageKm.toFixed(2)} km, 估計減碳: ${tripCarbonReduction.toFixed(2)} g. 獲得分數: ${scoreForThisTrip}`;
    logTripStatusElement.classList.add('text-green-600'); // Add green for success

    // Clear inputs and reset state after submission
    logTripMileageInput.value = '';
    selectedLogTripTransport = null;
    logTripTransportOptionsDiv.querySelectorAll('.log-trip-transport-button').forEach(button => {
        button.classList.remove('selected', 'bg-orange-300', 'border-orange-600', 'text-orange-900', 'font-semibold'); // Tailwind for selection
    });

     // --- MODIFICATION: Close the modal on successful submission with a delay ---
     setTimeout(() => {
        hideLogTripModal();
     }, 1500); // Close modal after 1.5 seconds


     currentLogTripPoi = null; // Clear stored POI
}


// --- THSR Info Modal ---
 function showThsrInfoModal() {
     console.log("Showing THSR info modal.");
     thsrInfoModal.classList.remove('hidden');
 }

 function hideThsrInfoModal() {
     console.log("Hiding THSR info modal.");
     thsrInfoModal.classList.add('hidden');
 }

 // --- Taxi Info Modal ---
 function showTaxiInfoModal() {
     console.log("Showing taxi info modal.");
     // Populate the modal content with the taxi information
     // Removed placeholder text and added the new field
     // const taxiInfoContent = taxiInfoModal.querySelector('.modal-content div'); // This might be too generic
     // It's better to have specific IDs if the content is dynamic or complex, but for static it's okay.
     // For now, assuming the structure is static as in the HTML.
     taxiInfoModal.classList.remove('hidden');
 }

 function hideTaxiInfoModal() {
     console.log("Hiding taxi info modal.");
     taxiInfoModal.classList.add('hidden');
 }

 // --- SROI Info Modal ---
 function showSroiInfoModal(sroiInfo, poiName) {
      console.log("Showing SROI info modal for:", poiName);
      sroiModalPoiNameElement.textContent = poiName; // Set the POI name in the modal

      // Clear previous content
      sroiModalContentBody.innerHTML = '';

      // Add Report Link
      if (sroiInfo.reportLink) {
          const reportLinkElement = document.createElement('a');
          reportLinkElement.href = sroiInfo.reportLink;
          reportLinkElement.target = "_blank";
          reportLinkElement.classList.add('block', 'text-blue-600', 'hover:underline', 'font-semibold');
          reportLinkElement.innerHTML = '<i class="fas fa-file-alt mr-1"></i>農場影響力報告書';
          sroiModalContentBody.appendChild(reportLinkElement);
      } else {
           const noReportElement = document.createElement('p');
           noReportElement.classList.add('text-gray-600');
           noReportElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>農場影響力報告書：未提供';
           sroiModalContentBody.appendChild(noReportElement);
      }

      // Add Form Link
      if (sroiInfo.formLink) {
          const formLinkElement = document.createElement('a');
          formLinkElement.href = sroiInfo.formLink;
          formLinkElement.target = "_blank";
          formLinkElement.classList.add('block', 'text-blue-600', 'hover:underline', 'font-semibold', 'mt-2'); // Added mt-2 for spacing
          formLinkElement.innerHTML = '<i class="fas fa-clipboard-list mr-1"></i>採購表單';
          sroiModalContentBody.appendChild(formLinkElement);
      } else {
           const noFormElement = document.createElement('p');
           noFormElement.classList.add('text-gray-600', 'mt-2'); // Added mt-2
           noFormElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>採購表單：未提供';
           sroiModalContentBody.appendChild(noFormElement);
      }

      // Add LINE ID - Check if it's a URL or just an ID
      if (sroiInfo.lineId) {
        const lineDisplayElement = document.createElement('p');
        lineDisplayElement.classList.add('text-gray-700', 'font-semibold', 'mt-2');
        if (sroiInfo.lineId.startsWith('https://line.me/')) { // Check if it's a LINE URL
            lineDisplayElement.innerHTML = `<i class="fab fa-line mr-1"></i><a href="${sroiInfo.lineId}" target="_blank" class="text-blue-600 hover:underline">加入LINE群組/好友</a>`;
        } else { // Assume it's an ID
            lineDisplayElement.innerHTML = `<i class="fab fa-line mr-1"></i>LINE ID: ${sroiInfo.lineId}`;
        }
        sroiModalContentBody.appendChild(lineDisplayElement);
      } else {
           const noLineIdElement = document.createElement('p');
           noLineIdElement.classList.add('text-gray-600', 'mt-2'); // Added mt-2
           noLineIdElement.innerHTML = '<i class="fas fa-info-circle mr-1"></i>LINE ID：未提供';
           sroiModalContentBody.appendChild(noLineIdElement);
      }


      sroiInfoModal.classList.remove('hidden');
 }

 function hideSroiInfoModal() {
      console.log("Hiding SROI info modal.");
      sroiInfoModal.classList.add('hidden');
      sroiModalPoiNameElement.textContent = ''; // Clear POI name
      sroiModalContentBody.innerHTML = ''; // Clear content
 }


// --- Download Data ---
function downloadTourismData() {
    console.log("Download data button clicked."); // Debugging line

    // Create a simple HTML report
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>水里永續旅遊數據報告 V2.2</title>
            <style>
                body { font-family: 'Noto Sans TC', sans-serif; line-height: 1.6; padding: 20px; margin: 0; background-color: #f9f9f9; color: #333; }
                h1, h2 { color: #1b5e20; }
                .container { max-width: 800px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .stats { margin-bottom: 20px; padding: 15px; border: 1px solid #a5d6a7; border-radius: 8px; background-color: #e8f5e9; }
                .stats p { margin: 5px 0; }
                .log-entry { border-bottom: 1px solid #eee; padding: 10px 0; margin-bottom: 10px; }
                .log-entry:last-child { border-bottom: none; margin-bottom: 0; }
                .log-entry p { margin: 3px 0; }
                .log-type { font-weight: bold; color: #388e3c; font-size: 1.1em; }
                .timestamp { font-size: 0.8em; color: #757575; text-align: right; }
                .log-points { font-weight: bold; color: #1b5e20; }
            </style>
             <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <h1>水里永續旅遊數據報告 V2.2</h1>

                <div class="stats">
                    <h2>您的旅遊統計</h2>
                    <p><strong>永續旅者姓名:</strong> ${playerNameInput.value.trim() || '未提供'}</p>
                    <p><strong>永續旅者或集團企業員工隨機碼:</strong> ${playerCode}</p>
                    <p><strong>累計里程:</strong> ${(totalMileage / 1000).toFixed(2)} km</p>
                    <p><strong>減碳總量:</strong> ${totalCarbonReduction.toFixed(2)} g</p>
                    <p><strong>永續分數:</strong> ${totalScore}</p>
                </div>

                <h2>我的行動紀錄</h2>
                <div>
    `;

    if (loggedActions.length === 0) {
        htmlContent += '<p>尚無行動紀錄</p>';
    } else {
        // Sort logs by timestamp in descending order (most recent first)
        const sortedLogs = [...loggedActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedLogs.forEach(log => {
            htmlContent += '<div class="log-entry">';
            let logDetail = '';
            let pointsContent = (log.points !== undefined && log.points > 0) ? `<p class="log-points">獲得積分: ${log.points}</p>` : (log.points === 0 ? `<p class="log-points text-gray-600">獲得積分: 0</p>` : '');

            switch (log.type) {
                case 'action':
                    logDetail = `<p class="log-type">永續行動記錄</p><p>選擇的行動: ${log.actions ? log.actions.join(', ') : '無'}</p><p>內容: ${log.text}</p>`;
                    break;
                case 'activity':
                    logDetail = `<p class="log-type">永續山村任務活動記錄</p><p>活動名稱: ${log.activityName}</p>${log.content ? `<p>活動內容/課程名稱: ${log.content}</p>` : ''}`;
                    break;
                case 'trip_to_poi':
                     logDetail = `<p class="log-type">前往景點旅程記錄 (手動)</p><p>景點: ${log.poiName}</p><p>交通方式: ${log.transportName} (${log.transportIcon})</p><p>里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>${log.carbonReduction > 0 ? `<p>估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}`;
                    break;
                case 'poi_review':
                     logDetail = `<p class="log-type">永續消費記錄</p><p>景點: ${log.poiName}</p><p>消費金額: ${log.consumption}</p><p>審核碼: ${log.reviewCode}</p>`;
                    break;
                case 'trip_calculation':
                      logDetail = `<p class="log-type">旅程計算記錄 (地圖)</p><p>起點: ${log.startPoiName}</p><p>終點: ${log.endPoiName}</p><p>交通方式: ${log.transportName} (${log.transportIcon})</p><p>里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p>${log.carbonReduction > 0 ? `<p>估計減碳: ${log.carbonReduction.toFixed(2)} g</p>` : ''}`;
                    break;
                case 'market_visit':
                    logDetail = `<p class="log-type">逛市集增里程記錄</p><p>市集類型: ${log.marketTypeName}</p><p>消費項目: ${log.productName} (${log.productIcon})</p><p>增加里程: ${(log.mileageInMeters / 1000).toFixed(2)} km</p><p>估計減碳: ${log.carbonReduction.toFixed(2)} g</p>${log.storeCode ? `<p>商店碼: ${log.storeCode}</p>` : ''}`;
                    break;
            }
            htmlContent += `${logDetail}${pointsContent}<p class="timestamp">${log.timestamp}</p></div>`;
        });
    }

    htmlContent += `
                </div> </div> </body>
        </html>
    `;

    // Create a Blob with explicit UTF-8 charset and HTML type
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    console.log("Blob created with UTF-8 charset and HTML type:", blob); // Debugging line


    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `水里永續旅遊數據_${playerCode}_V2.2.html`; // Change filename extension to .html and include player code and version
    console.log("Download link created:", a.href, "Filename:", a.download); // Debugging line


    // Append to body and trigger click
    document.body.appendChild(a);
    console.log("Triggering download."); // Debugging line
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
     console.log("Download data removed and object URL revoked."); // Debugging line
}

 // --- Market Selection Modal Functions ---
function showMarketSelectionModal() {
    console.log("Showing market selection modal.");
    marketSelectionModal.classList.remove('hidden');
    marketTypeSelectionStep.classList.remove('hidden');
    productTypeSelectionStep.classList.add('hidden');
    backToMarketTypeButton.classList.add('hidden');
    submitMarketActivityButton.disabled = true;
    marketActivityStatusElement.textContent = '';
    marketActivityStatusElement.className = 'mt-4 text-sm font-semibold text-gray-700'; // Reset class
    if(marketStoreCodeInput) marketStoreCodeInput.value = ''; // Clear store code input
    selectedMarketType = null;
    selectedMarketProduct = null;
    populateMarketTypeOptions();
    productTypeOptionsDiv.innerHTML = ''; // Clear previous product options
}

function hideMarketSelectionModal() {
    console.log("Hiding market selection modal.");
    marketSelectionModal.classList.add('hidden');
}

function populateMarketTypeOptions() {
    marketTypeOptionsDiv.innerHTML = ''; // Clear existing options
    marketTypes.forEach(market => {
        const button = document.createElement('button');
        button.className = 'market-option-button w-full text-left p-4 border rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-150 ease-in-out'; // Tailwind classes
        button.innerHTML = `<span class="text-2xl mr-3">${market.icon}</span><span class="font-semibold">${market.name}</span>`;
        button.dataset.marketId = market.id;
        button.addEventListener('click', () => handleMarketTypeSelect(market));
        marketTypeOptionsDiv.appendChild(button);
    });
}

function handleMarketTypeSelect(market) {
    console.log("Market type selected:", market.name);
    selectedMarketType = market;
    // Highlight selected market button
    marketTypeOptionsDiv.querySelectorAll('.market-option-button').forEach(btn => {
        btn.classList.remove('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'); // Tailwind for selection
        if (btn.dataset.marketId === market.id) {
            btn.classList.add('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'); // Tailwind for selection
        }
    });

    marketTypeSelectionStep.classList.add('hidden');
    productTypeSelectionStep.classList.remove('hidden');
    backToMarketTypeButton.classList.remove('hidden');
    selectedMarketTypeDisplay.textContent = market.name;
    populateProductOptions();
    submitMarketActivityButton.disabled = true; // Require product selection
    if(marketStoreCodeInput) marketStoreCodeInput.value = ''; // Clear store code when changing market type
    marketActivityStatusElement.textContent = ''; // Clear status message
}

function populateProductOptions() {
    productTypeOptionsDiv.innerHTML = ''; // Clear existing options
    Object.keys(marketProductData).forEach(productKey => {
        const product = marketProductData[productKey];
        const button = document.createElement('button');
        button.className = 'product-option-button w-full text-left p-3 border rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-150 ease-in-out flex items-center justify-between'; // Tailwind classes
        button.innerHTML = `
            <div>
                <span class="text-xl mr-2">${product.icon}</span>
                <span class="font-medium">${product.name}</span>
            </div>
            <span class="text-xs text-gray-600"> +${product.mileage / 1000}km, ${product.carbonReduction}g, ${product.points}分</span>
        `;
        button.dataset.productId = productKey;
        button.addEventListener('click', () => handleMarketProductSelect(productKey));
        productTypeOptionsDiv.appendChild(button);
    });
}

function handleMarketProductSelect(productKey) {
    console.log("Market product selected:", marketProductData[productKey].name);
    selectedMarketProduct = marketProductData[productKey];
    // Highlight selected product button
    productTypeOptionsDiv.querySelectorAll('.product-option-button').forEach(btn => {
        btn.classList.remove('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'); // Tailwind for selection
        if (btn.dataset.productId === productKey) {
            btn.classList.add('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'); // Tailwind for selection
        }
    });
    submitMarketActivityButton.disabled = false; // Enable submit button
    marketActivityStatusElement.textContent = ''; // Clear status message
}

function handleBackToMarketType() {
    console.log("Back to market type selection.");
    marketTypeSelectionStep.classList.remove('hidden');
    productTypeSelectionStep.classList.add('hidden');
    backToMarketTypeButton.classList.add('hidden');
    selectedMarketProduct = null;
    submitMarketActivityButton.disabled = true;
    marketActivityStatusElement.textContent = '';
    if(marketStoreCodeInput) marketStoreCodeInput.value = ''; // Clear store code
    // Clear product selection highlight
    productTypeOptionsDiv.querySelectorAll('.product-option-button.selected').forEach(btn => {
        btn.classList.remove('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'); // Tailwind for selection
    });
}


function submitMarketActivity() {
    console.log("Submitting market activity.");
    const storeCode = marketStoreCodeInput ? marketStoreCodeInput.value.trim() : '';
    const storeCodeRegex = /^[0-9]{5}$/; // Regex for exactly 5 digits

    if (!selectedMarketType || !selectedMarketProduct) {
        marketActivityStatusElement.textContent = '請選擇市集類型和消費商品。';
        marketActivityStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
        return;
    }

    if (!storeCodeRegex.test(storeCode)) {
        marketActivityStatusElement.textContent = '請輸入有效的5位數字商店碼。';
        marketActivityStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
        return;
    }

    totalMileage += selectedMarketProduct.mileage;
    totalCarbonReduction += selectedMarketProduct.carbonReduction;
    totalScore += selectedMarketProduct.points;

    updateStatsDisplay();

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLogEntry = {
        type: 'market_visit',
        marketTypeName: selectedMarketType.name,
        marketTypeIcon: selectedMarketType.icon,
        productName: selectedMarketProduct.name,
        productIcon: selectedMarketProduct.icon,
        mileageInMeters: selectedMarketProduct.mileage,
        carbonReduction: selectedMarketProduct.carbonReduction,
        points: selectedMarketProduct.points,
        storeCode: storeCode, // Save the store code
        timestamp: timestamp
    };
    loggedActions.push(newLogEntry);
    saveData();
    renderLoggedActions();

    marketActivityStatusElement.textContent = `已記錄於 ${selectedMarketType.name} 消費 ${selectedMarketProduct.name} (商店碼: ${storeCode})！獲得 +${selectedMarketProduct.points} 積分。`;
    marketActivityStatusElement.className = 'mt-4 text-sm font-semibold text-green-600'; // Use className

    // Clear store code input
    if(marketStoreCodeInput) marketStoreCodeInput.value = '';

    // Reset selections for next entry
    selectedMarketType = null;
    selectedMarketProduct = null;
    submitMarketActivityButton.disabled = true;
    marketTypeOptionsDiv.querySelectorAll('.market-option-button.selected').forEach(btn => btn.classList.remove('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'));
    productTypeOptionsDiv.querySelectorAll('.product-option-button.selected').forEach(btn => btn.classList.remove('selected', 'bg-purple-600', 'text-white', 'ring-2', 'ring-purple-700'));


    // Go back to market type selection after a short delay, allowing user to see the message
    setTimeout(() => {
        handleBackToMarketType(); // This will clear the product selection and hide the product step
        marketActivityStatusElement.textContent = '您可以記錄下一筆消費，或關閉此視窗。';
        marketActivityStatusElement.className = 'mt-4 text-sm font-semibold text-gray-700'; // Neutral status
    }, 3000); // 3 seconds delay
}

// --- Photo Album Modal Functions ---
function showPhotoAlbumModal() {
    console.log("Showing photo album modal.");
    if (photoAlbumModal) {
        photoAlbumModal.classList.remove('hidden');
    }
}

function hidePhotoAlbumModal() {
    console.log("Hiding photo album modal.");
    if (photoAlbumModal) {
        photoAlbumModal.classList.add('hidden');
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Loading data and setting up listeners.");
    loadData();
    populatePoiList();
    populateActivityList();
    populateSelectableActionsList();

    playerNameInput.addEventListener('input', saveData);

    document.querySelectorAll('.transport-option').forEach(button => {
        button.addEventListener('click', () => {
            const transportType = button.dataset.transport;
            console.log("Transport option button clicked:", transportType);
            if (transportType === 'thsr_haoxing') {
                showThsrInfoModal();
                return;
            }
            document.querySelectorAll('.transport-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentTransport = transportType;
            showMissionPage();
        });
    });

    // New Market Mileage Button Listener
    if (marketMileageButton) {
        marketMileageButton.addEventListener('click', showMarketSelectionModal);
        console.log("Market mileage button listener added.");
    }
    if (marketSelectionModal) {
        marketSelectionModal.querySelector('.close-button').addEventListener('click', hideMarketSelectionModal);
        marketSelectionModal.addEventListener('click', (e) => { if (e.target === marketSelectionModal) hideMarketSelectionModal(); });
        console.log("Market selection modal listeners added.");
    }
    if (submitMarketActivityButton) {
        submitMarketActivityButton.addEventListener('click', submitMarketActivity);
        console.log("Submit market activity button listener added.");
    }
    if (backToMarketTypeButton) {
        backToMarketTypeButton.addEventListener('click', handleBackToMarketType);
        console.log("Back to market type button listener added.");
    }

    // Photo Album Promo Button Listener
    if (photoAlbumPromoButton) {
        photoAlbumPromoButton.addEventListener('click', showPhotoAlbumModal);
    }
    if (photoAlbumModal) {
        photoAlbumModal.querySelector('.close-button').addEventListener('click', hidePhotoAlbumModal);
        photoAlbumModal.addEventListener('click', (e) => { if (e.target === photoAlbumModal) hidePhotoAlbumModal(); });
    }


    calculateMileageButton.addEventListener('click', calculateTripMileage);
    poiModal.querySelector('.close-button').addEventListener('click', hidePoiModal);
    poiModal.addEventListener('click', (e) => { if (e.target === poiModal) hidePoiModal(); });
    setAsStartButton.addEventListener('click', () => {
        if (poiModal.currentPoi) { selectedStartPoi = poiModal.currentPoi; updateSelectedPointsDisplay(); hidePoiModal(); }
    });
    setAsEndButton.addEventListener('click', () => {
        if (poiModal.currentPoi) { selectedEndPoi = poiModal.currentPoi; updateSelectedPointsDisplay(); hidePoiModal(); }
    });
    submitPoiReviewButton.addEventListener('click', submitPoiReview);

    if (sroiOrderButtonPoi12) {
        sroiOrderButtonPoi12.addEventListener('click', () => {
            const poi12Data = pois.find(p => p.id === 'poi12');
            if (poi12Data && poi12Data.sroiInfo) showSroiInfoModal(poi12Data.sroiInfo, poi12Data.name);
        });
    }
    if (showSroiInfoButton) {
        showSroiInfoButton.addEventListener('click', () => {
            if (showSroiInfoButton.sroiInfo && showSroiInfoButton.poiName) showSroiInfoModal(showSroiInfoButton.sroiInfo, showSroiInfoButton.poiName);
        });
    }

    participateActivityButton.addEventListener('click', showActivityModal);
    activityModal.querySelector('.close-button').addEventListener('click', hideActivityModal);
    activityModal.addEventListener('click', (e) => { if (e.target === activityModal) hideActivityModal(); });
    submitActivityLogButton.addEventListener('click', logActivity);
    logActionButton.addEventListener('click', logSustainableAction);
    backToHomeButton.addEventListener('click', showHomepage);
    changeTransportButton.addEventListener('click', showHomepage);
    thsrInfoModal.querySelector('.close-button').addEventListener('click', hideThsrInfoModal);
    thsrInfoModal.addEventListener('click', (e) => { if (e.target === thsrInfoModal) hideThsrInfoModal(); });
    downloadDataButton.addEventListener('click', downloadTourismData);
    logTripModal.querySelector('.close-button').addEventListener('click', hideLogTripModal);
    logTripModal.addEventListener('click', (e) => { if (e.target === logTripModal) hideLogTripModal(); });
    submitLogTripButton.addEventListener('click', submitLogTrip);
    taxiInfoButton.addEventListener('click', showTaxiInfoModal);
    taxiInfoModal.querySelector('.close-button').addEventListener('click', hideTaxiInfoModal);
    taxiInfoModal.addEventListener('click', (e) => { if (e.target === taxiInfoModal) hideTaxiInfoModal(); });
    sroiInfoModal.querySelector('.close-button').addEventListener('click', hideSroiInfoModal);
    sroiInfoModal.addEventListener('click', (e) => { if (e.target === sroiInfoModal) hideSroiInfoModal(); });

    showHomepage();
    console.log("All event listeners set up. Initial homepage display triggered.");
});

 // Ensure map resizes if window is resized
 window.addEventListener('resize', () => {
     if (map && map.getCenter) { // Check if map and getCenter are defined
         // Google Maps handles resize automatically, but calling center can help
         // map.setCenter(map.getCenter()); // Re-center after resize
     }
 });


 // Add a global error handler for the Google Maps API script
 window.gm_authFailure = function() {
     console.error("Google Maps API authentication failure. Check your API key and its restrictions.");
     const mapStatusElement = document.getElementById('map-status');
     if (mapStatusElement) {
         mapStatusElement.innerHTML = '地圖載入失敗：API 金鑰認證失敗。請檢查您的金鑰和限制設定。<br><span class="text-xs">若地圖未正確載入，請利用景點列表中的 <i class="fas fa-car-side text-orange-500"></i> 圖示記錄您的里程。</span>';
         mapStatusElement.className = 'text-center text-sm text-red-600 mt-4'; // Use className
     }
      const tripCalculationStatusElement = document.getElementById('trip-calculation-status');
      if (tripCalculationStatusElement) {
          tripCalculationStatusElement.textContent = '地圖服務未載入，無法計算路徑。';
          tripCalculationStatusElement.className = 'mt-4 text-sm font-semibold text-red-600'; // Use className
      }
 };
