import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircularProgress } from '@mui/material';

// Bounding box for India
const minLat = 6;
const maxLat = 37;
const minLon = 68;
const maxLon = 97;
const gridSize = 2.5; // degrees

// Check if weather code means rain
const isRaining = (weatherCode: number) => {
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
  return rainCodes.includes(weatherCode);
};

// Generate grid points
const generateGridPoints = (
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  gridSize: number
) => {
  const points: { lat: number; lon: number }[] = [];
  for (let lat = minLat; lat <= maxLat; lat += gridSize) {
    for (let lon = minLon; lon <= maxLon; lon += gridSize) {
      points.push({ lat: parseFloat(lat.toFixed(2)), lon: parseFloat(lon.toFixed(2)) });
    }
  }
  return points;
};

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationWeather {
  id: string;
  lat: number;
  lon: number;
  name: string;
  temperature: number;
  windspeed: number;
  weathercode: number;
}

// Simple mapping of weather codes to emojis or descriptions
const weatherCodeToEmoji: Record<number, string> = {
  0: "☀️", // Clear sky
  1: "🌤️", // Mainly clear
  2: "⛅", // Partly cloudy
  3: "☁️", // Overcast
  45: "🌫️", // Fog
  48: "🌫️", // Depositing rime fog
  51: "🌦️", // Light drizzle
  53: "🌧️", // Moderate drizzle
  55: "🌧️", // Dense drizzle
  61: "🌧️", // Slight rain
  63: "🌧️", // Moderate rain
  65: "🌧️", // Heavy rain
  71: "🌨️", // Slight snow
  73: "🌨️", // Moderate snow
  75: "🌨️", // Heavy snow
  80: "🌧️", // Rain showers
  81: "🌧️",
  82: "🌧️",
  95: "⛈️", // Thunderstorm
  96: "⛈️",
  99: "⛈️",
};

interface DisasterMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  width?: string;
  onRainyLocationsChange?: (locations: LocationWeather[]) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lon: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Fetch current weather for a point
const fetchWeatherData = async (
    lat: number,
    lon: number
  ): Promise<{ temperature: number; windspeed: number; weathercode: number } | null> => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.current_weather) {
        return {
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weathercode: data.current_weather.weathercode,
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching weather data for (${lat}, ${lon}):`, error);
      return null;
    }
  };
  
  const getLocationName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `http://localhost:8000/reverse-geocode?lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const location = data.results[0];
        return `${location.name}, ${location.admin1 || ''}`.trim();
      }
      return `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    } catch (error) {
      console.error("Error fetching location name:", error);
      return `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
    }
  };

  const getRainyLocations = async (onLocationFound: (location: LocationWeather) => void) => {
    const gridPoints = generateGridPoints(minLat, maxLat, minLon, maxLon, gridSize);
  
    for (const point of gridPoints) {
      const weather = await fetchWeatherData(point.lat, point.lon);
      if (weather && isRaining(weather.weathercode)) {
        const name = await getLocationName(point.lat, point.lon);
        const location: LocationWeather = {
          id: `${point.lat}-${point.lon}`,
          lat: point.lat,
          lon: point.lon,
          name,
          temperature: weather.temperature,
          windspeed: weather.windspeed,
          weathercode: weather.weathercode,
        };
        onLocationFound(location); // report this location immediately
      }
    }
  };

  const rainEmojiIcon = L.divIcon({
    html: `<div style="font-size: 24px; line-height: 24px;">🌧️☁️</div>`,
    className: "", // Remove default styles
    iconSize: [30, 30],
    iconAnchor: [15, 30], // anchor bottom middle
  });

const DisasterMap: React.FC<DisasterMapProps> = ({
  center = [22.9734, 78.6569],
  zoom = 5,
  height = "100%",
  width = "100%",
  onRainyLocationsChange
}) => {
  const [locations, setLocations] = useState<LocationWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [rainLoading, setRainLoading] = useState(true);
  const [radarPath, setRadarPath] = useState<string | null>(null);
  
  const handleLocationSelect = async (lat: number, lon: number) => {
    setLoading(true);
    // Add temporary marker immediately
    const tempId = `temp-${Date.now()}`;
    setLocations(prev => [...prev, {
      id: tempId,
      lat,
      lon,
      name: "Loading...",
      temperature: 0,
      windspeed: 0,
      weathercode: 0
    }]);

    try {
      const [weatherRes, locationName] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
        getLocationName(lat, lon)
      ]);
      
      const weatherData = await weatherRes.json();
      if (weatherData.current_weather) {
        const newLocation: LocationWeather = {
          id: `${lat}-${lon}-${Date.now()}`,
          lat,
          lon,
          name: locationName,
          temperature: weatherData.current_weather.temperature,
          windspeed: weatherData.current_weather.windspeed,
          weathercode: weatherData.current_weather.weathercode,
        };
        setLocations(prev => prev.map(loc => 
          loc.id === tempId ? newLocation : loc
        ));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Remove the temporary marker on error
      setLocations(prev => prev.filter(loc => loc.id !== tempId));
    }
    setLoading(false);
  };

  const fetchRadarPath = async () => {
    try {
      const response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const data = await response.json();
      // Get the latest radar frame path
      const latestFrame = data.radar.nowcast[data.radar.nowcast.length - 1];
      return latestFrame.path;
    } catch (error) {
      console.error("Error fetching radar data:", error);
      return null;
    }
  };

  useEffect(() => {
    const getRadarPath = async () => {
      const path = await fetchRadarPath();
      setRadarPath(path);
    };
    getRadarPath();
  }, []);

  const [rainyLocations, setRainyLocations] = useState<LocationWeather[]>([]);

useEffect(() => {
    setRainLoading(true);
    setRainyLocations([]); // clear old data
  
    getRainyLocations((location) => {
      setRainyLocations((prev) => {
        const newLocations = [...prev, location];
        onRainyLocationsChange?.(newLocations);
        return newLocations;
      });
    }).then(() => setRainLoading(false));
  }, [onRainyLocationsChange]);

  return (
    <div style={{ height, width, position: "relative", overflow: "hidden" }}>
      {(mapLoading || rainLoading) && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <CircularProgress style={{ marginBottom: "1rem" }} />
            {mapLoading && <div>Loading map...</div>}
            {rainLoading && <div>Loading rain data...</div>}
          </div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        {/* <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          eventHandlers={{
            load: () => setMapLoading(false)
          }} */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          eventHandlers={{
            load: () => setMapLoading(false)
          }}
        /> 
        {radarPath && (
          <TileLayer
            url={`https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.5}
            attribution='<a href="https://www.rainviewer.com">RainViewer</a>'
            eventHandlers={{
              load: () => setRainLoading(false)
            }}
          />
        )}
        {rainyLocations.map((location,index) => (
  <Marker
    key={index}
    position={[location.lat, location.lon]}
    icon={rainEmojiIcon}
  >
    <Popup>
      <div>
        <strong>Rain Detected at {location.name}</strong>
        <br />
        Temp: {location.temperature}°C
        <br />
        Wind: {location.windspeed} km/h
      </div>
    </Popup>
  </Marker>
))}
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 1000,
              background: "white",
              padding: "5px 10px",
              borderRadius: 4,
            }}
          >
            Loading weather data...
          </div>
        )}

        {locations.map((location) => (
          <Marker 
            key={location.id}
            position={[location.lat, location.lon]}
            eventHandlers={{
              popupclose: () => {
                setLocations(prev => 
                  prev.filter(loc => loc.id !== location.id)
                );
              }
            }}
          >
            <Popup>
              <div style={{ textAlign: "center", minWidth: "150px" }}>
                {location.id.startsWith('temp-') ? (
                  <div style={{ padding: "1rem" }}>
                    <CircularProgress size={20} style={{ marginBottom: "0.5rem" }} />
                    <div>Loading weather data...</div>
                  </div>
                ) : (
                  <>
                    <strong>{location.name}</strong>
                    <br />
                    <span style={{ fontSize: "2rem" }}>
                      {weatherCodeToEmoji[location.weathercode] || "❓"}
                    </span>
                    <br />
                    Temp: {location.temperature.toFixed(1)}°C
                    <br />
                    Wind: {location.windspeed.toFixed(1)} km/h
                    <br />
                    <small>Click anywhere on the map to add more locations</small>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;
