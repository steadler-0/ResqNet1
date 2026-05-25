export const mockStats = [
  { label: 'Active Incidents', value: '24', unit: 'nationwide' },
  { label: 'Response Teams', value: '12', unit: 'deployed' },
  { label: 'Shelters Open', value: '8', unit: 'facilities' },
  { label: 'Citizen Alerts', value: '156', unit: 'today' },
];

// India state disaster intensity data (0-100 scale)
export const INDIA_STATE_DISASTER_DATA = {
  'Andhra Pradesh': { intensity: 72, incidents: 18, type: 'Cyclone' },
  'Arunachal Pradesh': { intensity: 34, incidents: 4, type: 'Landslide' },
  Assam: { intensity: 88, incidents: 31, type: 'Flood' },
  Bihar: { intensity: 76, incidents: 22, type: 'Flood' },
  Chhattisgarh: { intensity: 45, incidents: 9, type: 'Drought' },
  Goa: { intensity: 28, incidents: 3, type: 'Storm' },
  Gujarat: { intensity: 61, incidents: 14, type: 'Cyclone' },
  Haryana: { intensity: 38, incidents: 6, type: 'Heatwave' },
  'Himachal Pradesh': { intensity: 55, incidents: 11, type: 'Landslide' },
  Jharkhand: { intensity: 47, incidents: 8, type: 'Drought' },
  Karnataka: { intensity: 52, incidents: 13, type: 'Flood' },
  Kerala: { intensity: 82, incidents: 26, type: 'Flood' },
  'Madhya Pradesh': { intensity: 43, incidents: 8, type: 'Drought' },
  Maharashtra: { intensity: 67, incidents: 17, type: 'Flood' },
  Manipur: { intensity: 59, incidents: 12, type: 'Landslide' },
  Meghalaya: { intensity: 41, incidents: 7, type: 'Flood' },
  Mizoram: { intensity: 36, incidents: 5, type: 'Landslide' },
  Nagaland: { intensity: 33, incidents: 4, type: 'Landslide' },
  Odisha: { intensity: 78, incidents: 24, type: 'Cyclone' },
  Punjab: { intensity: 31, incidents: 4, type: 'Heatwave' },
  Rajasthan: { intensity: 49, incidents: 10, type: 'Heatwave' },
  Sikkim: { intensity: 62, incidents: 15, type: 'Earthquake' },
  'Tamil Nadu': { intensity: 65, incidents: 16, type: 'Cyclone' },
  Telangana: { intensity: 58, incidents: 13, type: 'Flood' },
  Tripura: { intensity: 44, incidents: 8, type: 'Flood' },
  'Uttar Pradesh': { intensity: 54, incidents: 12, type: 'Flood' },
  Uttarakhand: { intensity: 69, incidents: 19, type: 'Landslide' },
  'West Bengal': { intensity: 74, incidents: 21, type: 'Cyclone' },
  Delhi: { intensity: 40, incidents: 7, type: 'Heatwave' },
};

// India facilities data (shelters, hospitals, relief centers)
export const INDIA_FACILITIES = [
  // Delhi region
  { id: 'sh-1', type: 'shelter', name: 'NDMC Community Shelter', address: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167, capacity: 500, available: 320, distance: null },
  { id: 'hp-1', type: 'hospital', name: 'AIIMS Delhi', address: 'Ansari Nagar East, New Delhi', lat: 28.5672, lng: 77.2100, capacity: 2000, available: 1240, distance: null },
  { id: 'rc-1', type: 'relief', name: 'Red Cross Relief Hub - Delhi', address: 'Red Cross Road, New Delhi', lat: 28.6200, lng: 77.2050, capacity: 1000, available: 780, distance: null },
  { id: 'sh-2', type: 'shelter', name: 'Yamuna Flood Shelter', address: 'Shahdara, Delhi', lat: 28.6700, lng: 77.2910, capacity: 800, available: 650, distance: null },

  // Mumbai region
  { id: 'hp-2', type: 'hospital', name: 'KEM Hospital Mumbai', address: 'Parel, Mumbai', lat: 18.9968, lng: 72.8404, capacity: 1800, available: 1100, distance: null },
  { id: 'sh-3', type: 'shelter', name: 'BMC Emergency Shelter', address: 'Dharavi, Mumbai', lat: 19.0422, lng: 72.8497, capacity: 600, available: 410, distance: null },
  { id: 'rc-2', type: 'relief', name: 'Mumbai Relief Coordination', address: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, capacity: 2000, available: 1650, distance: null },

  // Chennai region
  { id: 'hp-3', type: 'hospital', name: 'Govt. General Hospital Chennai', address: 'Park Town, Chennai', lat: 13.0801, lng: 80.2838, capacity: 2200, available: 1400, distance: null },
  { id: 'sh-4', type: 'shelter', name: 'Chennai Flood Shelter Network', address: 'Adyar, Chennai', lat: 13.0012, lng: 80.2565, capacity: 1200, available: 900, distance: null },
  { id: 'rc-3', type: 'relief', name: 'TN Disaster Relief Center', address: 'Anna Salai, Chennai', lat: 13.0524, lng: 80.2497, capacity: 3000, available: 2200, distance: null },

  // Kolkata region
  { id: 'hp-4', type: 'hospital', name: 'SSKM Hospital Kolkata', address: 'AJC Bose Road, Kolkata', lat: 22.5415, lng: 88.3424, capacity: 1500, available: 980, distance: null },
  { id: 'sh-5', type: 'shelter', name: 'Cyclone Shelter Kolkata', address: 'Salt Lake City, Kolkata', lat: 22.5806, lng: 88.4200, capacity: 700, available: 520, distance: null },
  { id: 'rc-4', type: 'relief', name: 'WB Relief Distribution Hub', address: 'Esplanade, Kolkata', lat: 22.5640, lng: 88.3517, capacity: 1500, available: 1200, distance: null },

  // Bangalore region
  { id: 'hp-5', type: 'hospital', name: 'Victoria Hospital Bangalore', address: 'Fort, Bangalore', lat: 12.9619, lng: 77.5736, capacity: 1600, available: 1050, distance: null },
  { id: 'sh-6', type: 'shelter', name: 'BBMP Emergency Shelter', address: 'Rajajinagar, Bangalore', lat: 12.9947, lng: 77.5550, capacity: 450, available: 310, distance: null },
  { id: 'rc-5', type: 'relief', name: 'Karnataka Relief Center', address: 'MG Road, Bangalore', lat: 12.9757, lng: 77.6011, capacity: 1800, available: 1400, distance: null },

  // Hyderabad region
  { id: 'hp-6', type: 'hospital', name: 'Osmania General Hospital', address: 'Afzalgunj, Hyderabad', lat: 17.3757, lng: 78.4765, capacity: 1400, available: 890, distance: null },
  { id: 'sh-7', type: 'shelter', name: 'GHMC Flood Shelter', address: 'Secunderabad, Hyderabad', lat: 17.4410, lng: 78.4983, capacity: 550, available: 380, distance: null },

  // Bhopal region
  { id: 'sh-8', type: 'shelter', name: 'MP State Shelter Center', address: 'TT Nagar, Bhopal', lat: 23.2280, lng: 77.4026, capacity: 400, available: 290, distance: null },
  { id: 'rc-6', type: 'relief', name: 'MP Disaster Relief Hub', address: 'Arera Colony, Bhopal', lat: 23.2107, lng: 77.4526, capacity: 1200, available: 950, distance: null },

  // Patna region
  { id: 'hp-7', type: 'hospital', name: 'PMCH Hospital Patna', address: 'Ashok Rajpath, Patna', lat: 25.6014, lng: 85.1376, capacity: 1000, available: 650, distance: null },
  { id: 'sh-9', type: 'shelter', name: 'Bihar Flood Emergency Shelter', address: 'Kankarbagh, Patna', lat: 25.5811, lng: 85.1420, capacity: 900, available: 720, distance: null },
];

// Coordinator queue mock data
export const COORDINATOR_QUEUE = [
  {
    id: 'cq-001', type: 'Flood', location: 'Assam, Kamrup District', time: '2 min ago',
    reporter: 'Citizen App', priority: 'Critical', status: 'Unassigned', lat: 26.1445, lng: 91.7362,
    description: 'Major flooding — 200+ families trapped', responder: null,
  },
  {
    id: 'cq-002', type: 'Building Collapse', location: 'Mumbai, Dharavi', time: '8 min ago',
    reporter: 'Field Unit 4', priority: 'Critical', status: 'In Progress', lat: 19.0422, lng: 72.8497,
    description: 'Partial collapse of 4-floor structure', responder: 'Team Alpha',
  },
  {
    id: 'cq-003', type: 'Cyclone', location: 'Odisha, Puri Coast', time: '15 min ago',
    reporter: 'NDRF', priority: 'High', status: 'Assigned', lat: 19.8103, lng: 85.8314,
    description: 'Category 3 cyclone landfall expected', responder: 'NDRF Unit 2',
  },
  {
    id: 'cq-004', type: 'Medical Emergency', location: 'Kerala, Wayanad', time: '22 min ago',
    reporter: 'Citizen App', priority: 'High', status: 'Unassigned', lat: 11.6854, lng: 76.1320,
    description: '50+ landslide victims need evacuation', responder: null,
  },
  {
    id: 'cq-005', type: 'Earthquake', location: 'Sikkim, Gangtok', time: '35 min ago',
    reporter: 'Seismic Monitor', priority: 'High', status: 'In Progress', lat: 27.3389, lng: 88.6065,
    description: 'M5.4 earthquake — structural assessment ongoing', responder: 'Team Bravo',
  },
  {
    id: 'cq-006', type: 'Drought', location: 'Rajasthan, Jodhpur', time: '1 hr ago',
    reporter: 'State Authority', priority: 'Medium', status: 'Assigned', lat: 26.2389, lng: 73.0243,
    description: 'Water scarcity — 12 villages affected', responder: 'Relief Corps 3',
  },
  {
    id: 'cq-007', type: 'Fire', location: 'Delhi, Chandni Chowk', time: '1.5 hrs ago',
    reporter: 'Fire Brigade', priority: 'Medium', status: 'Resolved', lat: 28.6507, lng: 77.2300,
    description: 'Market fire — contained, 3 injuries', responder: 'Fire Unit 7',
  },
  {
    id: 'cq-008', type: 'Heatwave', location: 'UP, Lucknow', time: '2 hrs ago',
    reporter: 'Health Dept', priority: 'Low', status: 'Monitoring', lat: 26.8467, lng: 80.9462,
    description: 'Heat stress — 8 hospitalizations', responder: 'Health Team 1',
  },
];
