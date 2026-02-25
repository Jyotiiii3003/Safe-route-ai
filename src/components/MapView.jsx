import React, { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../Services/supabaseClient";
import L from "leaflet";

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

function RouteDrawer({ start, end, trigger, useMyLocation, onRouteReady, setLoadingRoute }) {
  const geocode = async (place) => {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1&lang=en`,
    );
    const data = await res.json();

    if (!data.features?.length) return null;

    const feature = data.features[0];

    if (feature.properties?.country !== "India") {
      console.warn("Geocode outside India:", feature.properties?.country);
      return null;
    }

    const c = feature.geometry.coordinates;
    return [c[1], c[0]];
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
              "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk4NjhhZTIyMzk2NzQyMDliYzk3OTE0ZDU2MGFmOGJjIiwiaCI6Im11cm11cjY0In0=",
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
      console.log("Geocoded start:", s);
      console.log("Geocoded end:", e);
      
      const data = await res.json();

      if (!data.features?.length) {
        console.warn("No routes returned");
        return;
      }

      console.log("Routes returned:", data.features.length);

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

  useEffect(() => {
    const load = async () => {
      const { data: crimeData } = await supabase
        .from("crime_points")
        .select("*");
      const { data: lightData } = await supabase
        .from("street_lights")
        .select("*");
      setCrimes(crimeData || []);
      setLights(lightData || []);
    };
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

        let weight = 1
        if (crime.severity === "high") weight = 3
        else if (crime.severity === "medium") weight = 2

        if (isNight) weight *= 1.5

        risk += weight
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
    console.log("Best route risk:", bestRisk);
    console.log("Safety Score:", score);

    
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
  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={[28.6139, 77.209]}
        zoom={13}
        className="h-screen w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {crimes.map((c) => (
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

        {lights.map((l) => (
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

            const risk = routeRisks[i] ?? 0
            const isSafest =safestRoute && JSON.stringify(route.points) === JSON.stringify(safestRoute)
            const isSelected = selectedRouteIndex === i

             let color = "#7aa2ff"   

            if (i === 0) color = "purple"
            if (isSafest) color = "green"
            if (isSelected) {
              color = risk > RISK_RED_THRESHOLD ? "red" : "green"
            }

            return (
              <Polyline
              key={i}positions={route.points}eventHandlers={{
                  click: () => setSelectedRouteIndex(i)
                  }}
                  pathOptions={{
                  color,
                  weight: isSelected || isSafest ? 7 : 3,
                  opacity: isSelected || isSafest ? 1 : 0.6
                  }}
                />
              )
            })}

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

        

      {safetyScore !== null && (
      <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow text-sm w-64">

          <div className="font-bold text-lg mb-2">Route Summary</div>

          <div>🛡 Safety Score: <b>{safetyScore}%</b></div>

          <div>🚨 Crime hits: <b>{crimeHits}</b></div>

          <div>🌑 Dark spots: <b>{darkSpotsCount}</b></div>

          <div>🕒 Time: <b>{isNight ? "Night" : "Day"}</b></div>

          <div className="mt-2 text-xs text-gray-500">
              Route chosen by AI safety model
       </div>
      </div>
      )}

      {isNight && (
        <div className="absolute top-32 right-4 bg-indigo-600 text-white p-2 rounded text-xs shadow">
              🌙 Night Safety Mode Active
        </div>
            )   }

      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
        <div>🔴 Crime</div>
        <div>🟡 Street Light</div>
      </div>
      
    </div>
  );
}