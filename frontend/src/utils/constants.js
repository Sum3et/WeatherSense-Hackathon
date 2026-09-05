/**
 * WeatherSense — constants and configuration.
 */

// 75 National Weather Observatories across all 28 States & 8 UTs
export const MAJOR_CITIES = [
  // North
  { city: 'Delhi', state: 'Delhi', region: 'North', lat: 28.6139, lon: 77.2090 },
  { city: 'Srinagar', state: 'Jammu & Kashmir', region: 'North', lat: 34.0837, lon: 74.7973 },
  { city: 'Jammu', state: 'Jammu & Kashmir', region: 'North', lat: 32.7266, lon: 74.8570 },
  { city: 'Leh', state: 'Ladakh', region: 'North', lat: 34.1526, lon: 77.5771 },
  { city: 'Kargil', state: 'Ladakh', region: 'North', lat: 34.5539, lon: 76.1349 },
  { city: 'Shimla', state: 'Himachal Pradesh', region: 'North', lat: 31.1048, lon: 77.1734 },
  { city: 'Dharamshala', state: 'Himachal Pradesh', region: 'North', lat: 32.2190, lon: 76.3234 },
  { city: 'Dehradun', state: 'Uttarakhand', region: 'North', lat: 30.3165, lon: 78.0322 },
  { city: 'Nainital', state: 'Uttarakhand', region: 'North', lat: 29.3919, lon: 79.4542 },
  { city: 'Chandigarh', state: 'Chandigarh', region: 'North', lat: 30.7333, lon: 76.7794 },
  { city: 'Amritsar', state: 'Punjab', region: 'North', lat: 31.6340, lon: 74.8723 },
  { city: 'Ludhiana', state: 'Punjab', region: 'North', lat: 30.9010, lon: 75.8573 },
  { city: 'Jaipur', state: 'Rajasthan', region: 'North', lat: 26.9124, lon: 75.7873 },
  { city: 'Jodhpur', state: 'Rajasthan', region: 'North', lat: 26.2389, lon: 73.0243 },
  { city: 'Udaipur', state: 'Rajasthan', region: 'North', lat: 24.5854, lon: 73.7125 },
  { city: 'Lucknow', state: 'Uttar Pradesh', region: 'North', lat: 26.8467, lon: 80.9462 },
  { city: 'Varanasi', state: 'Uttar Pradesh', region: 'North', lat: 25.3176, lon: 82.9739 },
  { city: 'Agra', state: 'Uttar Pradesh', region: 'North', lat: 27.1767, lon: 78.0081 },
  { city: 'Prayagraj', state: 'Uttar Pradesh', region: 'North', lat: 25.4358, lon: 81.8463 },

  // West & Central
  { city: 'Mumbai', state: 'Maharashtra', region: 'West', lat: 19.0760, lon: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', region: 'West', lat: 18.5204, lon: 73.8567 },
  { city: 'Nagpur', state: 'Maharashtra', region: 'Central', lat: 21.1458, lon: 79.0882 },
  { city: 'Nashik', state: 'Maharashtra', region: 'West', lat: 19.9975, lon: 73.7898 },
  { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', region: 'West', lat: 19.8762, lon: 75.3433 },
  { city: 'Ahmedabad', state: 'Gujarat', region: 'West', lat: 23.0225, lon: 72.5714 },
  { city: 'Surat', state: 'Gujarat', region: 'West', lat: 21.1702, lon: 72.8311 },
  { city: 'Vadodara', state: 'Gujarat', region: 'West', lat: 22.3072, lon: 73.1812 },
  { city: 'Rajkot', state: 'Gujarat', region: 'West', lat: 22.3039, lon: 70.8022 },
  { city: 'Bhopal', state: 'Madhya Pradesh', region: 'Central', lat: 23.2599, lon: 77.4126 },
  { city: 'Indore', state: 'Madhya Pradesh', region: 'Central', lat: 22.7196, lon: 75.8577 },
  { city: 'Gwalior', state: 'Madhya Pradesh', region: 'Central', lat: 26.2183, lon: 78.1828 },
  { city: 'Jabalpur', state: 'Madhya Pradesh', region: 'Central', lat: 23.1815, lon: 79.9864 },
  { city: 'Raipur', state: 'Chhattisgarh', region: 'Central', lat: 21.2514, lon: 81.6296 },
  { city: 'Bilaspur', state: 'Chhattisgarh', region: 'Central', lat: 22.0797, lon: 82.1409 },
  { city: 'Panaji', state: 'Goa', region: 'West', lat: 15.4909, lon: 73.8278 },

  // South
  { city: 'Bengaluru', state: 'Karnataka', region: 'South', lat: 12.9716, lon: 77.5946 },
  { city: 'Mysuru', state: 'Karnataka', region: 'South', lat: 12.2958, lon: 76.6394 },
  { city: 'Mangaluru', state: 'Karnataka', region: 'South', lat: 12.9141, lon: 74.8560 },
  { city: 'Chennai', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lon: 80.2707 },
  { city: 'Coimbatore', state: 'Tamil Nadu', region: 'South', lat: 11.0168, lon: 76.9558 },
  { city: 'Madurai', state: 'Tamil Nadu', region: 'South', lat: 9.9252, lon: 78.1198 },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu', region: 'South', lat: 10.7905, lon: 78.7047 },
  { city: 'Hyderabad', state: 'Telangana', region: 'South', lat: 17.3850, lon: 78.4867 },
  { city: 'Warangal', state: 'Telangana', region: 'South', lat: 17.9689, lon: 79.5941 },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', region: 'South', lat: 17.6868, lon: 83.2185 },
  { city: 'Vijayawada', state: 'Andhra Pradesh', region: 'South', lat: 16.5062, lon: 80.6480 },
  { city: 'Tirupati', state: 'Andhra Pradesh', region: 'South', lat: 13.6288, lon: 79.4192 },
  { city: 'Kochi', state: 'Kerala', region: 'South', lat: 9.9312, lon: 76.2673 },
  { city: 'Thiruvananthapuram', state: 'Kerala', region: 'South', lat: 8.5241, lon: 76.9366 },
  { city: 'Kozhikode', state: 'Kerala', region: 'South', lat: 11.2588, lon: 75.7804 },

  // East
  { city: 'Kolkata', state: 'West Bengal', region: 'East', lat: 22.5726, lon: 88.3639 },
  { city: 'Siliguri', state: 'West Bengal', region: 'East', lat: 26.7271, lon: 88.3953 },
  { city: 'Asansol', state: 'West Bengal', region: 'East', lat: 23.6739, lon: 86.9524 },
  { city: 'Patna', state: 'Bihar', region: 'East', lat: 25.5941, lon: 85.1376 },
  { city: 'Gaya', state: 'Bihar', region: 'East', lat: 24.7914, lon: 85.0002 },
  { city: 'Muzaffarpur', state: 'Bihar', region: 'East', lat: 26.1209, lon: 85.3647 },
  { city: 'Bhubaneswar', state: 'Odisha', region: 'East', lat: 20.2961, lon: 85.8245 },
  { city: 'Cuttack', state: 'Odisha', region: 'East', lat: 20.4625, lon: 85.8830 },
  { city: 'Rourkela', state: 'Odisha', region: 'East', lat: 22.2604, lon: 84.8536 },
  { city: 'Ranchi', state: 'Jharkhand', region: 'East', lat: 23.3441, lon: 85.3096 },
  { city: 'Jamshedpur', state: 'Jharkhand', region: 'East', lat: 22.8046, lon: 86.2029 },

  // Northeast
  { city: 'Guwahati', state: 'Assam', region: 'Northeast', lat: 26.1445, lon: 91.7362 },
  { city: 'Dibrugarh', state: 'Assam', region: 'Northeast', lat: 27.4728, lon: 94.9120 },
  { city: 'Silchar', state: 'Assam', region: 'Northeast', lat: 24.8170, lon: 92.7926 },
  { city: 'Shillong', state: 'Meghalaya', region: 'Northeast', lat: 25.5788, lon: 91.8933 },
  { city: 'Cherrapunji', state: 'Meghalaya', region: 'Northeast', lat: 25.2986, lon: 91.5822 },
  { city: 'Imphal', state: 'Manipur', region: 'Northeast', lat: 24.8170, lon: 93.9368 },
  { city: 'Aizawl', state: 'Mizoram', region: 'Northeast', lat: 23.7271, lon: 92.7176 },
  { city: 'Agartala', state: 'Tripura', region: 'Northeast', lat: 23.8315, lon: 91.2868 },
  { city: 'Kohima', state: 'Nagaland', region: 'Northeast', lat: 25.6751, lon: 94.1086 },
  { city: 'Itanagar', state: 'Arunachal Pradesh', region: 'Northeast', lat: 27.0844, lon: 93.6053 },
  { city: 'Gangtok', state: 'Sikkim', region: 'Northeast', lat: 27.3389, lon: 88.6065 },

  // Islands & UTs
  { city: 'Port Blair', state: 'Andaman & Nicobar Islands', region: 'Islands', lat: 11.6234, lon: 92.7265 },
  { city: 'Kavaratti', state: 'Lakshadweep', region: 'Islands', lat: 10.5667, lon: 72.6417 },
  { city: 'Puducherry', state: 'Puducherry', region: 'South', lat: 11.9416, lon: 79.8083 },
];

// Event categories
export const EVENT_CATEGORIES = [
  'Heavy Rain', 'Flood', 'Waterlogging', 'Thunderstorm', 'Lightning',
  'Cyclone', 'Strong Wind', 'Heatwave', 'Fog', 'Hailstorm',
  'Landslide', 'Dust Storm', 'Cold Wave', 'Other',
];

// Status colors
export const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  color: 'amber',   bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  VERIFIED: { label: 'Verified', color: 'emerald',  bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  FLAGGED:  { label: 'Flagged',  color: 'orange',  bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/30' },
  SPAM:     { label: 'Spam',     color: 'red',     bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
  REJECTED: { label: 'Rejected', color: 'slate',   bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30' },
};

// Event category icons (emoji for map markers)
export const CATEGORY_ICONS = {
  'Heavy Rain':  '🌧️',
  'Flood':       '🌊',
  'Waterlogging':'💧',
  'Thunderstorm':'⛈️',
  'Lightning':   '⚡',
  'Cyclone':     '🌀',
  'Strong Wind': '💨',
  'Heatwave':    '🌡️',
  'Fog':         '🌫️',
  'Hailstorm':   '🌨️',
  'Landslide':   '⛰️',
  'Dust Storm':  '🌪️',
  'Cold Wave':   '🥶',
  'Other':       '🔆',
};

// Event category colors for map markers
export const CATEGORY_COLORS = {
  'Heavy Rain':  '#3b82f6',
  'Flood':       '#1d4ed8',
  'Waterlogging':'#6366f1',
  'Thunderstorm':'#7c3aed',
  'Lightning':   '#a855f7',
  'Cyclone':     '#dc2626',
  'Strong Wind': '#78716c',
  'Heatwave':    '#ef4444',
  'Fog':         '#94a3b8',
  'Hailstorm':   '#60a5fa',
  'Landslide':   '#92400e',
  'Dust Storm':  '#d97706',
  'Cold Wave':   '#0ea5e9',
  'Other':       '#6b7280',
};

// Source labels
export const SOURCE_CONFIG = {
  citizen:    { label: 'Citizen Report', color: 'text-sky-400',    border: 'border-sky-500/30',    bg: 'bg-sky-500/10' },
  imd:        { label: 'IMD Official',   color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  open_meteo: { label: 'Open-Meteo',     color: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10' },
  reddit:     { label: 'Reddit',         color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  meta:       { label: 'Meta',           color: 'text-blue-500',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10' },
  public_web: { label: 'Public Web',     color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  simulation: { label: 'Simulation',     color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' },
};

// India map center
export const INDIA_CENTER = [20.5937, 78.9629];
export const INDIA_ZOOM = 5;

// Confidence score thresholds
export const CONFIDENCE_LEVELS = {
  HIGH:      { min: 80,  label: 'High Confidence',     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  MODERATE:  { min: 60,  label: 'Moderate Confidence', color: 'text-yellow-400',  bg: 'bg-yellow-500/15' },
  LOW:       { min: 40,  label: 'Low Confidence',      color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  SUSPICIOUS:{ min: 0,   label: 'Suspicious',          color: 'text-red-400',     bg: 'bg-red-500/15' },
};

export function getConfidenceLevel(score) {
  if (score >= 80) return CONFIDENCE_LEVELS.HIGH;
  if (score >= 60) return CONFIDENCE_LEVELS.MODERATE;
  if (score >= 40) return CONFIDENCE_LEVELS.LOW;
  return CONFIDENCE_LEVELS.SUSPICIOUS;
}
