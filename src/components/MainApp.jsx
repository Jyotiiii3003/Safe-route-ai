import { useState } from "react";
import MapView from "./MapView";
import { supabase } from "../Services/supabaseClient";

export default function MainApp() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [trigger, setTrigger] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);

  return (
    <div className="h-screen flex flex-col">
        
      <div>
        <input
          className="p-2 rounded w-full"
          placeholder="Enter Start Location"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <input
          className="p-2 rounded w-full"
          placeholder="Enter destination"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <button
          onClick={() => {
            if (!start || !end) {
              alert("Enter start and destination");
              return;
            }
            setTrigger((prev) => !prev);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Find Route
        </button>

        <button
          onClick={() => {
            setUseMyLocation(true);
            setTrigger((prev) => !prev);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Use My Location
        </button>

        <button onClick={async () => {
                 await supabase.auth.signOut();
                 window.location.href = "/signUp";
                }}
                className="bg-red-600 text-white px-4 py-2 rounded w-30" >Logout
        </button>
      </div>

      <MapView
        start={start}
        end={end}
        trigger={trigger}
        useMyLocation={useMyLocation}
      />
    </div>
  );
}