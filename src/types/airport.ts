export interface Runway {
  length: number;
  width: number;
  has_lights: boolean;
  surface: string;
  surface_category: string;
  closed: boolean;
  le_ident: string;
  he_ident: string;
}

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  country_name: string;
  region: string;
  continent: string;
  latitude: number;
  longitude: number;
  estimated_annual_passengers?: number;
  is_closed?: boolean;
  runways?: Runway[];
  home_link?: string | null;
  wikipedia_link?: string | null;
  type?: string;
  size?: string;
  elevation_m?: number;
  elevation_ft?: number;
}
