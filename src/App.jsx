import { useEffect } from 'react'
import './App.css'
import { supabase } from './Services/supabaseClient'

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
    <>
    <div className='flex items-center justify-center h-screen bg-black text-white'>
      <h3 className='font-bold text-4xl'>
          SupaBase connected!
      </h3>
    </div>
    </>
  )
}

export default App
