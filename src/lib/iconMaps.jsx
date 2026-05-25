import {
  AlertTriangle,
  Bell,
  Box,
  Building2,
  Car,
  ClipboardList,
  CircleAlert,
  Droplets,
  Flame,
  HeartPulse,
  Home,
  Hospital,
  LayoutGrid,
  Map,
  MapPin,
  Package,
  Radio,
  Shield,
  Sun,
  Thermometer,
  TreePine,
  Users,
  User,
  Waves,
  Wind,
  Zap,
  Activity,
  Utensils,
} from 'lucide-react';

export const DISASTER_ICON = {
  Flood: Waves,
  Fire: Flame,
  Wildfire: TreePine,
  'Fire Accident': Car,
  Earthquake: Activity,
  'Building Collapse': Building2,
  'Medical Emergency': HeartPulse,
  Pandemic: AlertTriangle,
  Cyclone: Wind,
  Landslide: AlertTriangle,
  Drought: Sun,
  Heatwave: Thermometer,
};

export const SCARCITY_ICON = {
  water: Droplets,
  food: Utensils,
  medical: HeartPulse,
  shelter: Home,
  power: Zap,
};

export const FACILITY_ICON = {
  shelter: Home,
  hospital: Hospital,
  relief: Package,
};

export const STAT_ICONS = [AlertTriangle, Shield, Home, Radio];

export const QUICK_ACCESS_ICONS = {
  dashboard: LayoutGrid,
  sos: CircleAlert,
  map: MapPin,
  coordinator: ClipboardList,
};

/** Sidebar navigation — matches reference ResqNet layout */
export const SIDEBAR_ITEMS = [
  { page: 'dashboard', key: 'nav_dashboard', Icon: LayoutGrid },
  { page: 'alerts', key: 'nav_alerts', Icon: Bell },
  { page: 'map', key: 'nav_map', Icon: Map },
  { page: 'sos', key: 'nav_sos_send', Icon: CircleAlert },
  { page: 'coordinator', key: 'nav_coordinator', Icon: Users },
  { page: 'map', key: 'nav_resources', Icon: Box },
  { page: 'profile', key: 'nav_profile', Icon: User },
];

export function DisasterIcon({ type, className = 'h-4 w-4', strokeWidth = 2 }) {
  const Icon = DISASTER_ICON[type] || AlertTriangle;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function FacilityIcon({ type, className = 'h-4 w-4', strokeWidth = 2 }) {
  const Icon = FACILITY_ICON[type] || Package;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
