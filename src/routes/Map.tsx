import { useMap } from "../context/MapContext";

export default function MapPage() {
  const { canteens, nearestCanteen, distanceToNearest, locationLoading, locationError, requestLocation } = useMap();

  return (
    <div className="page map-page">
      <div className="map-header">
        <div className="map-title">NUS Canteens</div>
        <div className="map-sub">Find the canteen nearest to you</div>
      </div>

      <button
        className={`locate-btn${locationLoading ? " loading" : ""}`}
        onClick={requestLocation}
        disabled={locationLoading}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        {locationLoading ? "Detecting location..." : nearestCanteen ? "Re-detect location" : "Detect my location"}
      </button>

      {locationError && (
        <div className="location-error">{locationError}</div>
      )}

      {nearestCanteen && (
        <div className="nearest-banner">
          <span className="nearest-label">Nearest to you</span>
          <span className="nearest-name">{nearestCanteen.name}</span>
          {distanceToNearest !== null && (
            <span className="nearest-dist">
              {distanceToNearest < 1000
                ? `${distanceToNearest}m away`
                : `${(distanceToNearest / 1000).toFixed(1)}km away`}
            </span>
          )}
        </div>
      )}

      <div className="canteen-cards">
        {canteens.map(canteen => {
          const isNearest = nearestCanteen?.name === canteen.name;
          return (
            <div key={canteen.name} className={`canteen-card${isNearest ? " nearest" : ""}`}>
              <div className="canteen-card-top">
                <div>
                  <div className="canteen-card-name">{canteen.name}</div>
                  {canteen.name === "YIH" && (
                    <div className="canteen-card-full">Yusof Ishak House</div>
                  )}
                  {canteen.name === "UTown" && (
                    <div className="canteen-card-full">University Town</div>
                  )}
                  {canteen.name === "TechnoEdge" && (
                    <div className="canteen-card-full">TechnoEdge Canteen</div>
                  )}
                </div>
                {isNearest && <span className="nearest-chip">Nearest</span>}
              </div>

              {isNearest && distanceToNearest !== null && (
                <div className="canteen-card-dist">
                  {distanceToNearest < 1000
                    ? `${distanceToNearest}m away`
                    : `${(distanceToNearest / 1000).toFixed(1)}km away`}
                </div>
              )}

              <a
                className="directions-btn"
                href={canteen.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
                </svg>
                Get Directions
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
