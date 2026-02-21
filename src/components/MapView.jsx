import React, { useEffect, useRef, useState } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
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



function RouteDrawer({ start, end, trigger, onRouteReady, color }) {
  const map = useMap()
  const layerRef = useRef(null)

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
            ]
          })
        }
      )
      console.log("Geocoded start:", s)
       console.log("Geocoded end:", e)
      const data = await res.json()
      if (!data.features?.length) return

      const coords = data.features[0].geometry.coordinates
      const latLngs = coords.map(c => [c[1], c[0]])
      onRouteReady(latLngs)

      
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }

      
      const layer = L.polyline(latLngs, {
        color: color ,
        weight: 6
      }).addTo(map)

      layerRef.current = layer
      map.fitBounds(layer.getBounds(), { padding: [40, 40] })
    }

    loadRoute()
  }, [trigger, start, end, map,color])
  

  return null
}



export default function MapView({ start, end, trigger, }) {

  const [crimes, setCrimes] = useState([])
  const [lights, setLights] = useState([])
  
  const [routePoints, setRoutePoints] = useState([])
  const [safetyScore, setSafetyScore] = useState(null)
  const [dangerPoints, setDangerPoints] = useState([])

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
  console.log("Route stored:", routePoints.length)
}, [routePoints])

    useEffect(() => {
  if (!routePoints.length || !crimes.length) return

  let risk = 0
  let dangers = []

  routePoints.forEach(point => {

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

        
        if (crime.severity === "high") risk += 3
        else if (crime.severity === "medium") risk += 2
        else risk += 1
    })
  })

  
  const score = Math.max(0, 100 - risk)

  setSafetyScore(score)
  console.log("Danger points found:", dangers.length)
  setDangerPoints(dangers)

  console.log("Risk:", risk)
  console.log("Safety Score:", score)

  }, [routePoints, crimes])

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
        
        <RouteDrawer start={start} end={end} trigger={trigger} onRouteReady={setRoutePoints} color={safetyColor}/>

      </MapContainer>

      {safetyScore !== null && (
      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow text-sm">
    <b>Safety Score:</b> {safetyScore}%
    </div>
    )}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow text-sm">
        <div>🔴 Crime</div>
        <div>🟡 Street Light</div>
      </div>

    </div>
  )
}