import React, { useEffect, useState } from "react"
import { MapContainer, Marker, Popup, TileLayer, Polyline } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { supabase } from "../Services/supabaseClient"
import L from "leaflet"



const crimeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

const lightIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})



function RouteDrawer({ start, end, trigger, onRouteReady }) {
 

  const geocode = async (place) => {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1&lang=en`
  )
  const data = await res.json()

  if (!data.features?.length) return null

  const feature = data.features[0]

  
  if (feature.properties?.country !== "India") {
    console.warn("Geocode outside India:", feature.properties?.country)
    return null
  }

  const c = feature.geometry.coordinates
  return [c[1], c[0]]
 
}

  useEffect(() => {
    if (!trigger) return
    if (!start?.trim() || !end?.trim()) return

    const loadRoute = async () => {
      const s = await geocode(start)
      const e = await geocode(end)
      if (!s || !e) return

      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk4NjhhZTIyMzk2NzQyMDliYzk3OTE0ZDU2MGFmOGJjIiwiaCI6Im11cm11cjY0In0="
          },
          body: JSON.stringify({
          coordinates: [
              [s[1], s[0]],
              [e[1], e[0]]
                        ],
                alternative_routes: {
                target_count: 3,
                share_factor: 0.6
                  }
      })
      }
      )
      console.log("Geocoded start:", s)
       console.log("Geocoded end:", e)
     const data = await res.json()

if (!data.features?.length) {
  console.warn("No routes returned")
  return
}

console.log("Routes returned:", data.features.length)

      const routes = data.features.map(feature =>
      feature.geometry.coordinates.map(c => [c[1], c[0]]))
      onRouteReady(routes)
      }
    loadRoute()
  }, [trigger, start, end])
  

  return null
}



export default function MapView({ start, end, trigger, }) {

  const [crimes, setCrimes] = useState([])
  const [lights, setLights] = useState([])
  
  
  const [routes, setRoutes] = useState([])
  const [safetyScore, setSafetyScore] = useState(null)
  const [dangerPoints, setDangerPoints] = useState([])
  const [safestRoute, setSafestRoute] = useState([])
  const safetyColor =safetyScore === null? "red": safetyScore > 70? "green": safetyScore > 40? "orange": "red"

  useEffect(() => {
    const load = async () => {
      const { data: crimeData } = await supabase.from("crime_points").select("*")
      const { data: lightData } = await supabase.from("street_lights").select("*")
      setCrimes(crimeData || [])
      setLights(lightData || [])
    }
    load()
  }, [])

  

    useEffect(() => {
  if (!routes.length || !crimes.length) return

  let bestRoute = null
  let bestRisk = Infinity
  let bestDangerPoints = []

  routes.forEach(route => {

    let risk = 0
    let dangers = []

    route.forEach(point => {

      crimes.forEach(crime => {

        const d =
          Math.sqrt(
            (point[0] - crime.latitude) ** 2 +
            (point[1] - crime.longitude) ** 2
          )

        if (d < 0.02) {

          dangers.push([crime.latitude, crime.longitude])

          if (crime.severity === "high") risk += 3
          else if (crime.severity === "medium") risk += 2
          else risk += 1
        }
      })
    })

    if (risk < bestRisk) {
      bestRisk = risk
      bestRoute = route
      bestDangerPoints = dangers
    }

  })

  const score = Math.max(0, 100 - bestRisk)

  setSafetyScore(score)
  setDangerPoints(bestDangerPoints)
  setSafestRoute(bestRoute)
  console.log("Best route risk:", bestRisk)
  console.log("Safety Score:", score)

  if (bestRoute) {
  console.log("Chosen safest route length:", bestRoute.length)
}
  console.log("First route length:", routes[0].length)

}, [routes, crimes])
  useEffect(() => {
  console.log("Routes stored:", routes.length)
}, [routes])

  return (
    <div className="relative h-screen w-full">

      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={13}
        className="h-screen w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {crimes.map(c => (
          <Marker key={c.id} position={[c.latitude, c.longitude]} icon={crimeIcon}>
            <Popup>
              <b>{c.crime_type}</b><br/>
              Severity: {c.severity}
            </Popup>
          </Marker>
        ))}

        {lights.map(l => (
          <Marker key={l.id} position={[l.latitude, l.longitude]} icon={lightIcon}>
            <Popup>
              <b>Street Light</b><br/>
              Intensity: {l.intensity}<br/>
              Working: {l.working ? "Yes" : "No"}
            </Popup>
          </Marker>
        ))}


        {dangerPoints.map((p, i) => (
  <Marker
    key={`danger-${i}`}
    position={p}
    icon={new L.Icon({
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/red.png",
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    })}
  >
    <Popup>⚠ Dangerous area on route</Popup>
  </Marker>
))}
        {routes.map((route, i) => {

  // fastest route
  if (i === 0) {
    return (
      <Polyline
        key={i}
        positions={route}
        pathOptions={{ color: "yellow", weight: 4, dashArray: "6,6" ,opacity: 0.7}}
      />
    )
  }

  // other routes
  return (
    <Polyline
      key={i}
      positions={route}
      pathOptions={{ color: "#eb2ee5", weight: 5, opacity: 0.6 }}
    />
  )
})}

{safestRoute.length > 0 && (
  <Polyline
    positions={safestRoute}
    pathOptions={{ color: safetyColor, weight: 8,opacity:4 }}
  />
)}
        <RouteDrawer start={start} end={end} trigger={trigger} onRouteReady={setRoutes} />

      </MapContainer>

      {safetyScore !== null && (
  <div className="absolute top-4 left-4 bg-white p-4 rounded shadow text-sm w-60">

    <div className="font-semibold text-base">
      🛡 Safe Route Analysis
    </div>

    <div className="mt-2">
      <b>Safety Score:</b> {safetyScore}%
    </div>

    <div className="text-xs text-gray-600 mt-1">
      {dangerPoints.length} danger zones detected
    </div>

    <div className="mt-2 text-xs text-gray-700">
      AI selected the safest available route
    </div>

  </div>
)}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
        <div>🔴 Crime</div>
        <div>🟡 Street Light</div>
      </div>

    </div>
  )
}