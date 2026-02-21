import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './Services/supabaseClient'
import MapView from './components/MapView'

function App() {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [trigger, setTrigger] = useState(false)

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
    <div className='h-screen flex flex-col'>
      <div>
        <input className='p-2 rounded w-full' placeholder='Enter Start Location' value={start} onChange={e=>setStart(e.target.value)}/>
        <input className='p-2 rounded w-full' placeholder='Enter destination' value={end} onChange={e=>setEnd(e.target.value)}/>
        <button
  onClick={() => {
    if (!start || !end) {
      alert("Enter start and destination")
      return
    }
    setTrigger(prev => !prev)
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Find Route
</button>
      </div>
       <MapView start={start} end={end} trigger={trigger} />
    </div>
   
  )
}

export default App