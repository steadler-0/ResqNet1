/**
 * Generates public/facilities-india.json (3000+ facilities)
 * Run: node scripts/generate-facilities.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'facilities-india.json');

const STATES = [
  { name: 'Maharashtra', lat: 19.75, lng: 75.7 },
  { name: 'Uttar Pradesh', lat: 26.85, lng: 80.95 },
  { name: 'Bihar', lat: 25.96, lng: 85.56 },
  { name: 'West Bengal', lat: 22.99, lng: 87.85 },
  { name: 'Madhya Pradesh', lat: 23.47, lng: 77.41 },
  { name: 'Tamil Nadu', lat: 11.13, lng: 78.66 },
  { name: 'Rajasthan', lat: 27.02, lng: 74.22 },
  { name: 'Karnataka', lat: 15.32, lng: 75.71 },
  { name: 'Gujarat', lat: 22.26, lng: 71.19 },
  { name: 'Andhra Pradesh', lat: 15.91, lng: 79.74 },
  { name: 'Odisha', lat: 20.95, lng: 85.1 },
  { name: 'Telangana', lat: 18.11, lng: 79.02 },
  { name: 'Kerala', lat: 10.85, lng: 76.27 },
  { name: 'Jharkhand', lat: 23.61, lng: 85.28 },
  { name: 'Assam', lat: 26.2, lng: 92.94 },
  { name: 'Punjab', lat: 31.15, lng: 75.34 },
  { name: 'Haryana', lat: 29.06, lng: 76.08 },
  { name: 'Delhi', lat: 28.61, lng: 77.21 },
  { name: 'Chhattisgarh', lat: 21.28, lng: 81.87 },
  { name: 'Himachal Pradesh', lat: 31.1, lng: 77.17 },
];

const PREFIX = {
  shelter: ['NDRF Shelter', 'Community Shelter', 'Flood Relief Camp', 'Cyclone Shelter', 'Emergency Housing'],
  hospital: ['District Hospital', 'Govt Medical College', 'Primary Health Centre', 'Trauma Care Unit', 'Emergency Hospital'],
  relief: ['Relief Distribution Hub', 'NDRF Supply Depot', 'Food & Water Center', 'Rescue Coordination Point', 'Civil Defence Post'],
};

function rnd(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gen(type, count, startId) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const st = pick(STATES);
    const lat = st.lat + rnd(-2.2, 2.2);
    const lng = st.lng + rnd(-2.2, 2.2);
    const cap = Math.floor(rnd(80, 2500));
    const avail = Math.floor(cap * rnd(0.15, 0.95));
    const name = `${pick(PREFIX[type])} — ${st.name}`;
    list.push({
      id: `${type}-${startId + i}`,
      type,
      name,
      address: `${Math.floor(rnd(1, 199))} ${pick(['Main Rd', 'Station Rd', 'NH Bypass', 'Civil Lines'])}, ${st.name}, India`,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      capacity: cap,
      available: avail,
      phone: `+91-${Math.floor(rnd(70000, 99999))}${Math.floor(rnd(10000, 99999))}`,
      contact: `${pick(['Control Room', 'Duty Officer', 'Helpline'])} ${Math.floor(rnd(100, 999))}`,
      distance: null,
    });
  }
  return list;
}

const facilities = [
  ...gen('shelter', 1100, 1),
  ...gen('hospital', 1100, 2000),
  ...gen('relief', 1100, 4000),
];

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(facilities));
console.log(`Wrote ${facilities.length} facilities to ${OUT}`);
