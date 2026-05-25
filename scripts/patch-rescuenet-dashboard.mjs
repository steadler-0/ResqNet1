import fs from 'fs';

const dash = 'C:/Users/Yuvaraj B/Desktop/RescueNet/src/pages/DashboardPage.jsx';
let c = fs.readFileSync(dash, 'utf8');

if (!c.includes('EmergencyGeoSection')) {
  c = c.replace(
    "import Badge from '../components/Badge';",
    "import Badge from '../components/Badge';\nimport EmergencyGeoSection from '../sections/EmergencyGeoSection';"
  );
  c = c.replace(
    '      </div>\n    </div>\n  );\n}\n',
    `      </div>

      <EmergencyGeoSection />
    </div>
  );
}
`
  );
  fs.writeFileSync(dash, c);
  console.log('DashboardPage patched');
} else {
  console.log('DashboardPage already has EmergencyGeoSection');
}

const css = 'C:/Users/Yuvaraj B/Desktop/RescueNet/src/index.css';
let cssContent = fs.readFileSync(css, 'utf8');
if (!cssContent.includes('user-location-marker')) {
  cssContent += `
/* SentinelX map marker on RescueNet */
.user-location-marker-wrapper { background: transparent !important; border: none !important; }
.user-location-marker { position: relative; width: 36px; height: 36px; }
.user-location-pulse {
  position: absolute; inset: 4px; border-radius: 50%;
  background: rgba(84, 122, 149, 0.35);
  animation: rn-location-pulse 1.8s ease-out infinite;
}
.user-location-dot {
  position: absolute; top: 50%; left: 50%; width: 14px; height: 14px;
  margin: -7px 0 0 -7px; border-radius: 50%;
  background: #547A95; border: 3px solid #fff;
  box-shadow: 0 0 12px rgba(84, 122, 149, 0.6);
}
@keyframes rn-location-pulse {
  0% { transform: scale(0.5); opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}
.leaflet-container { font-family: Inter, system-ui, sans-serif; }
`;
  fs.writeFileSync(css, cssContent);
  console.log('index.css updated');
}
