import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { supabase } from '../Services/supabaseClient'
import L from "leaflet"

const MapView = () => {
   
    const [crimes, setCrimes] = useState([])
    
    useEffect(() => {
      const loadData= async ()=>{
        const{data}=await supabase .from("crime_points") .select("*")
        setCrimes(data||[])
      }
      loadData() 
    }, [])
    
    const crimeIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})




  return (
     <MapContainer
      center={[28.6139, 77.2090]}
      zoom={13}
      className="h-screen w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

    {
        crimes.map(c =>(
            <Marker key={c.id}position={[c.latitude, c.longitude]} icon={crimeIcon}>
                <Popup>
                    <b>{c.crime_type}</b><br/>Severity: {c.severity}
                </Popup>
            </Marker>
        ))
    }
    </MapContainer>
  )
}

export default MapView