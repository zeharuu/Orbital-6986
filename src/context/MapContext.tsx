import { createContext, useContext, useState, useCallback } from "react";

type Canteen = {
  name: string;
  lat: number;
  lng: number;
  hasFood: boolean;
  mapsUrl: string;
};

export const CANTEENS: Canteen[] = [
  {
    name: "TechnoEdge",
    lat: 1.2979,
    lng: 103.7808,
    hasFood: true,
    mapsUrl: "https://maps.google.com/?q=TechnoEdge+Canteen+NUS+Singapore",
  },
  {
    name: "UTown",
    lat: 1.3038,
    lng: 103.7744,
    hasFood: true,
    mapsUrl: "https://maps.google.com/?q=University+Town+Canteen+NUS+Singapore",
  },
  {
    name: "YIH",
    lat: 1.2962,
    lng: 103.7827,
    hasFood: true,
    mapsUrl: "https://maps.google.com/?q=Yusof+Ishak+House+NUS+Singapore",
  },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type MapContextType = {
  canteens: Canteen[];
  nearestCanteen: Canteen | null;
  distanceToNearest: number | null;
  locationLoading: boolean;
  locationError: string;
  requestLocation: () => void;
};

const MapContext = createContext<MapContextType | null>(null);

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be inside MapProvider");
  return ctx;
}

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [nearestCanteen, setNearestCanteen] = useState<Canteen | null>(null);
  const [distanceToNearest, setDistanceToNearest] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported on this device.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = CANTEENS[0];
        let minDist = haversineDistance(latitude, longitude, CANTEENS[0].lat, CANTEENS[0].lng);
        for (const canteen of CANTEENS.slice(1)) {
          const d = haversineDistance(latitude, longitude, canteen.lat, canteen.lng);
          if (d < minDist) {
            minDist = d;
            nearest = canteen;
          }
        }
        setNearestCanteen(nearest);
        setDistanceToNearest(Math.round(minDist));
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? "Location access denied." : "Could not get your location.");
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  return (
    <MapContext.Provider value={{
      canteens: CANTEENS,
      nearestCanteen,
      distanceToNearest,
      locationLoading,
      locationError,
      requestLocation,
    }}>
      {children}
    </MapContext.Provider>
  );
}
