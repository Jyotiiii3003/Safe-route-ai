import { useEffect } from 'react'
import './App.css'
import { supabase } from './Services/supabaseClient'
import MapView from './components/MapView'

function App() {

  useEffect(() => {
    const fetchData= async()=>{
      const {data : crimes}= await supabase .from("crime_points") .select("*")
      
      const {data : lights}= await supabase .from("street_lights") .select("*")
        console.log("Crime Data", crimes)
        console.log("Street lights",lights)
      
    }
    fetchData()
   
  }, [])
  
  


  return (
    <MapView/>
  )
}

export default App
