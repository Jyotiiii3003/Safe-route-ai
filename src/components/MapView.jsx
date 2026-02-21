import React from 'react'
import { MapContainer, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"


const MapView = () => {
    
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
    </MapContainer>
  )
}

export default MapView