import React, { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../Services/supabaseClient";
import L from "leaflet";
import "leaflet.heat";

const crimeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const lightIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const cctvIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const policeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})


function RouteDrawer({ start, end, trigger, useMyLocation, onRouteReady, setLoadingRoute }) {
  const geocode = async (place) => {
  try {
    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${import.meta.env.VITE_ORS_KEY}&text=${encodeURIComponent(place)}&boundary.country=IN`
    );

    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      console.warn("No geocode results found");
      return null;
    }

    const coords = data.features[0].geometry.coordinates;

    
    return [coords[1], coords[0]];

  } catch (error) {
    console.error("Geocode error:", error);
    return null;
  }
};

  useEffect(() => {
    if (!trigger) return;
    if (!end?.trim()) return
    if (!useMyLocation && !start?.trim()) return

  const loadRoute = async () => {
      try{
      setLoadingRoute(true)
     let s

    if (useMyLocation && navigator.geolocation) {
      const position = await new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
      )

      s = [
    position.coords.latitude,
    position.coords.longitude
    ]
    } else {
        s = await geocode(start)
    }
      const e = await geocode(end);
      if (!s || !e){
        setLoadingRoute(false)
        return;}

      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              import.meta.env.VITE_ORS_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [s[1], s[0]],
              [e[1], e[0]],
            ],
            alternative_routes: {
              target_count: 3,
              share_factor: 0.6,
            },
          }),
        },
      );
      
      
      const data = await res.json();

      if (!data.features?.length) {
        console.warn("No routes returned");
        return;
      }

      

      const routes = data.features.map(feature => ({
      points: feature.geometry.coordinates.map(c => [c[1], c[0]]),
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration}))
      onRouteReady(routes);
      setLoadingRoute(false)
      } catch (error) {
        console.error("Error loading route:", error);
        setLoadingRoute(false);
      }
    };
    loadRoute();
  }, [trigger, start, end, useMyLocation, onRouteReady]);

  return null;
}

  function FollowUser({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

    function CrimeHeatmap({ crimes }) {
  const map = useMap();

  useEffect(() => {
    if (!crimes.length) return;

    const points = crimes.map(c => [
      c.latitude,
      c.longitude,
      c.severity === "high" ? 1 : c.severity === "medium" ? 0.6 : 0.3
    ]);

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: {
        0.2: "blue",
        0.4: "lime",
        0.6: "orange",
        0.8: "red"
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [crimes, map]);

  return null;
}


  function getTimeRiskMultiplier() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 18) return 1;
  if (hour >= 18 && hour < 22) return 1.3;
  if (hour >= 22 || hour < 3) return 1.8;
  if (hour >= 3 && hour < 6) return 1.4;

  return 1;
}

export default function MapView({ start, end, trigger, useMyLocation }) {
  const [crimes, setCrimes] = useState([]);
  const [lights, setLights] = useState([]);
  const [isNight, setIsNight] = useState(false)
  const [routes, setRoutes] = useState([]);
  const [safetyScore, setSafetyScore] = useState(null);
  const [dangerPoints, setDangerPoints] = useState([]);
  const [safestRoute, setSafestRoute] = useState([]);
  const [crimeHits, setCrimeHits] = useState(0)
  const [darkSpotsCount, setDarkSpotsCount] = useState(0)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null)
  const [routeRisks, setRouteRisks] = useState([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [cctvCameras, setCctvCameras] = useState([])
  const [policeStations, setPoliceStations] = useState([])
  const [showCrimes, setShowCrimes] = useState(true);
  const [showLights, setShowLights] = useState(true);
  const [showCCTV, setShowCCTV] = useState(true);
  const [showPolice, setShowPolice] = useState(true);

  useEffect(() => {
    const load = async () => {
  const { data: crimeData } = await supabase
    .from("crime_points")
    .select("*")

  const { data: lightData } = await supabase
    .from("street_lights")
    .select("*")

  const { data: cctvData } = await supabase
    .from("cctv_cameras")
    .select("*")

  const { data: policeData } = await supabase
    .from("police_stations")
    .select("*")

  setCrimes(crimeData || [])
  setLights(lightData || [])
  setCctvCameras(cctvData || [])
  setPoliceStations(policeData || [])
}
    load();
  }, []);

  useEffect(() => {
    if (!routes.length || !crimes.length) return;
    let risks = []
    let bestRoute = null;
    let bestRisk = Infinity;
    let bestDangerPoints = [];
    let bestCrimeHits = 0
    let bestDarkSpots = 0

    routes.forEach(routeObj => {
      const route = routeObj.points
        let risk = 0
        let dangers = []
        let localCrimeHits = 0
        let localDarkSpotsCount = 0

  
    route.forEach(point => {
    crimes.forEach(crime => {

      const d = Math.sqrt(
        (point[0] - crime.latitude) ** 2 +
        (point[1] - crime.longitude) ** 2
      )

      if (d < 0.02) {

        dangers.push([crime.latitude, crime.longitude])
        localCrimeHits++

        let weight = 1;

        if (crime.severity === "high") weight = 3;
        else if (crime.severity === "medium") weight = 2;

        const timeMultiplier = getTimeRiskMultiplier();
        if (crime.crime_type === "robbery") weight *= 1.6;
        if (crime.crime_type === "assault") weight *= 1.8;
        if (crime.crime_type === "theft") weight *= 1.2;
        weight *= timeMultiplier;

        risk += weight
      }
    })

    cctvCameras.forEach(cam => {

    const d = Math.sqrt(
      (point[0] - cam.latitude) ** 2 +
      (point[1] - cam.longitude) ** 2
    )

    if (d < cam.coverage_radius) {
      risk -= 0.5
    }

  })

  cctvCameras.forEach(cam => {

    const d = Math.sqrt(
      (point[0] - cam.latitude) ** 2 +
      (point[1] - cam.longitude) ** 2
    )

    if (d < cam.coverage_radius) {
      risk -= 0.5
    }

  })
 })
  risks.push(risk)
 
  if (isNight) {

    route.forEach(point => {
      lights.forEach(light => {

        const d = Math.sqrt(
          (point[0] - light.latitude) ** 2 +
          (point[1] - light.longitude) ** 2
        )

        if (d < 0.02 && !light.working) {
          localDarkSpotsCount++
        }

      })
    })

    risk += localDarkSpotsCount * 2
  }

  
  if (risk < bestRisk) {
    bestRisk = risk
    bestRoute = routeObj.points
    bestDangerPoints = dangers
    bestCrimeHits = localCrimeHits
    bestDarkSpots = localDarkSpotsCount
    
  }

})

    const score = Math.max(0, 100 - bestRisk);

    
    if (selectedRouteIndex !== null && routes[selectedRouteIndex]) {
        bestRoute = routes[selectedRouteIndex]
    }
    setRouteRisks(risks)
    setSafetyScore(score);
    setDangerPoints(bestDangerPoints);
    setSafestRoute(bestRoute);
    setCrimeHits(bestCrimeHits)
    setDarkSpotsCount(bestDarkSpots)
   

    
  }, [routes, crimes,selectedRouteIndex]);
  
  useEffect(() => {
  const hour = new Date().getHours()

  if (hour >= 19 || hour <= 5) {
    setIsNight(true)
  } else {
    setIsNight(false)
  }

}, [])
 const RISK_RED_THRESHOLD = 80 

    const startNavigation = () => {
  if (!navigator.geolocation) return;

  const id = navigator.geolocation.watchPosition(
    (position) => {
      setCurrentPosition([
        position.coords.latitude,
        position.coords.longitude,
      ]);
    },
    (error) => {
      console.error("Navigation error:", error);
    },
    {
      enableHighAccuracy: true,
    }
  );

  setWatchId(id);
  setIsNavigating(true);
};

const stopNavigation = () => {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
  setIsNavigating(false);
  setCurrentPosition(null);
};

useEffect(() => {
  return () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}, [watchId]);

function getSegmentRisk(point, crimes, lights, cctvCameras, policeStations) {

  let risk = 0

  
  crimes.forEach(crime => {

    const d = Math.sqrt(
      (point[0] - crime.latitude) ** 2 +
      (point[1] - crime.longitude) ** 2
    )

    if (d < 0.01) {

      let weight = crime.severity

      if (crime.crime_type === "robbery") weight *= 1.6
      if (crime.crime_type === "assault") weight *= 1.8
      if (crime.crime_type === "theft") weight *= 1.2

      risk += weight
    }

  })


  
  lights.forEach(light => {

    const d = Math.sqrt(
      (point[0] - light.latitude) ** 2 +
      (point[1] - light.longitude) ** 2
    )

    if (d < 0.01) {

      if (!light.working) risk += 2
      else if (light.intensity === 1) risk += 1

    }

  })


 
  cctvCameras.forEach(cam => {

    const d = Math.sqrt(
      (point[0] - cam.latitude) ** 2 +
      (point[1] - cam.longitude) ** 2
    )

    if (d < cam.coverage_radius) {
      risk -= 0.7
    }

  })


  
  policeStations.forEach(station => {

    const d = Math.sqrt(
      (point[0] - station.latitude) ** 2 +
      (point[1] - station.longitude) ** 2
    )

    if (d < 0.015) {
      risk -= 1
    }

  })

  return Math.max(risk, 0)
}

  

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={13}
        className="h-screen w-full z-0"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CrimeHeatmap crimes={crimes} />

        {showCrimes && crimes.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude, c.longitude]}
            icon={crimeIcon}
          >
            <Popup>
              <b>{c.crime_type}</b>
              <br />
              Severity: {c.severity}
            </Popup>
          </Marker>
        ))}

        {showCCTV && cctvCameras.map((cam) => (
        <Marker
        key={cam.id}
        position={[cam.latitude, cam.longitude]}
        icon={cctvIcon}
        >
        <Popup>
        <b>CCTV Camera</b>
        <br />
        Coverage radius: {cam.coverage_radius}
        </Popup>
        </Marker>
      ))}

        {showPolice && policeStations.map((station) => (
         <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={policeIcon}
        >
        <Popup>
        <b>{station.name}</b>
         <br />
         Police Station
        </Popup>
      </Marker>
      ))}

        {showLights && lights.map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude, l.longitude]}
            icon={lightIcon}
          >
            <Popup>
              <b>Street Light</b>
              <br />
              Intensity: {l.intensity}
              <br />
              Working: {l.working ? "Yes" : "No"}
            </Popup>
          </Marker>
        ))}

        {dangerPoints.map((p, i) => (
          <Marker
            key={`danger-${i}`}
            position={p}
            icon={
              new L.Icon({
                iconUrl: "https://maps.google.com/mapfiles/ms/icons/red.png",
                iconSize: [40, 40],
                iconAnchor: [20, 40],
              })
            }
          >
            <Popup>⚠ Dangerous area on route</Popup>
          </Marker>
        ))}
        
        
  {routes.map((route, i) => {

  const isSafest =
    safestRoute &&
    JSON.stringify(route.points) === JSON.stringify(safestRoute)

  const isSelected = selectedRouteIndex === i

  let baseColor = "#7aa2ff"

  if (i === 0) baseColor = "purple"      
  if (isSafest) baseColor = "green"      

  
  if (!isSelected) {
    return (
      <Polyline
        key={i}
        positions={route.points}
        eventHandlers={{
          click: () => setSelectedRouteIndex(i)
        }}
        pathOptions={{
          color: baseColor,
          weight: isSafest ? 7 : 4,
          opacity: 0.7
        }}
      />
    )
  }

 
  const segments = []

  for (let j = 0; j < route.points.length - 1; j++) {

    const p1 = route.points[j]
    const p2 = route.points[j + 1]

    const risk = getSegmentRisk( p1,crimes,lights,cctvCameras,policeStations)

    let color = "green"

    if (risk > 3) color = "red"
    else if (risk > 1.5) color = "orange"

    segments.push(
      <Polyline
        key={`${i}-${j}`}
        positions={[p1, p2]}
        pathOptions={{
          color,
          weight: 7,
          opacity: 0.9
        }}
      />
    )
  }

  return segments
})}
            {currentPosition && (
            <Marker position={currentPosition}icon={new L.Icon({
              iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            })
            }>
              <Popup>You are here</Popup>
            </Marker>
            )}

              {isNavigating && currentPosition && (
              <FollowUser position={currentPosition} />
              )}

        {routes.map((route, i) => {

            const mid = route.points[Math.floor(route.points.length / 2)]
            if (!mid) return null

            const km = (route.distance / 1000).toFixed(2)
            const mins = Math.round(route.duration / 60)
            const risk = routeRisks[i] ?? 0
            const riskLabel =
            risk < 30 ? "Safe": risk < 80 ? "Moderate": "Risky"
            const riskColor =risk < 30 ? "green": risk < 80 ? "orange": "red"

             return (
              <Marker
                key={"label-"+i}position={mid}icon={L.divIcon({className: "",html: `<div style=" background:white;padding:6px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:12px;text-align:center;min-width:110px;white-space:nowrap;line-height:1.3;">
                  <b>${km} km</b> • ${mins} min<br/><span style="color:${riskColor};font-weight:bold"> ${riskLabel}</span></div> `})}/>
                )
            })
          }
        
        <RouteDrawer
          start={start}
          end={end}
          trigger={trigger}
          useMyLocation={useMyLocation}
          onRouteReady={setRoutes}
          setLoadingRoute={setLoadingRoute}
        />
        {loadingRoute && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[9999]">
          <div className="bg-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">

          <svg className="w-6 h-6 text-blue-600 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" className="opacity-75"/>
          </svg>

          <span className="text-sm font-medium">
              Finding safest route...
          </span>
          </div>
          </div>
        )}
      </MapContainer>

        {routes.length > 0 && !isNavigating && (
        
          <button onClick={startNavigation} className="absolute bottom-6 right-6 z-[9999] bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-xl">
          Start Navigation
          </button>
         
        )}

      {isNavigating && (
        
       <button onClick={stopNavigation}
          className="absolute bottom-6 right-6 z-[9999] bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-xl">
          Stop Navigation
        </button>
       
      )}

      {safetyScore !== null && (
      <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow text-sm w-64">

          <div className="font-bold text-lg mb-2">Route Summary</div>

          <div>🛡 Safety Score: <b>{safetyScore}%</b></div>

          <div>🚨 Crime hits: <b>{crimeHits}</b></div>

          <div>🌑 Dark spots: <b>{darkSpotsCount}</b></div>

          <div>🕒 Time: <b>{isNight ? "Night" : "Day"}</b></div>

          <div>⏱ Time Risk Multiplier: <b>{getTimeRiskMultiplier().toFixed(2)}</b></div>

          <div className="mt-2 text-xs text-gray-500">
              Route chosen by AI safety model
       </div>
      </div>
      )}

      {isNight && (
        <div className="absolute top-32 left-4 bg-indigo-600 text-white p-2 rounded text-xs shadow">
              🌙 Night Safety Mode Active
        </div>
            )   }

        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur p-4 rounded-xl shadow text-sm space-y-2">

  <div className="font-bold">Map Layers</div>

  <label className="flex items-center gap-2">
    <input type="checkbox" checked={showCrimes} onChange={() => setShowCrimes(!showCrimes)} />
    🔴 Crime
  </label>

  <label className="flex items-center gap-2">
    <input type="checkbox" checked={showLights} onChange={() => setShowLights(!showLights)} />
    🟡 Street Lights
  </label>

  <label className="flex items-center gap-2">
    <input type="checkbox" checked={showCCTV} onChange={() => setShowCCTV(!showCCTV)} />
    🟣 CCTV Cameras
  </label>

  <label className="flex items-center gap-2">
    <input type="checkbox" checked={showPolice} onChange={() => setShowPolice(!showPolice)} />
    🔵 Police Stations
  </label>

</div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl shadow text-sm space-y-1">
  <div>🔴 Crime Location</div>
  <div>🟡 Street Light</div>
  <div>🟣 CCTV Camera</div>
  <div>🔵 Police Station</div>
  <div>🟢 Safe Segment</div>
  <div>🟠 Moderate Risk</div>
  <div>🔴 Dangerous Segment</div>
  </div>
      
    </div>
  );
}