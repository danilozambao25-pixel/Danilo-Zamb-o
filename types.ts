export enum UserRole {
  COMPANY = 'COMPANY',
  DRIVER = 'DRIVER',
  USER = 'USER'
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  companyId: string;
}

export interface BusRoute {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  points: LatLng[]; 
  geometry?: LatLng[]; 
  status: 'NORMAL' | 'DELAYED' | 'BROKEN' | 'TRAFFIC';
  incidentDescription?: string;
  currentLocation?: LatLng;
  qrCodeData: string;
  isOffRoute: boolean;
  assignedDriverId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favoriteRoutes: string[];
  companyId?: string; // Para motoristas e admin
}

export type IncidentType = 'BREAKDOWN' | 'TRAFFIC' | 'ACCIDENT' | 'OTHER' | 'CLEAR';
