import { useState } from "react";
import MapView from "./MapView";
import { supabase } from "../Services/supabaseClient";

export default function MainApp() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [trigger, setTrigger] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
        
      <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Route Saathi
        </h1>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/signUp";
          }}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl transition"
        >
          Logout
        </button>
      </div>

      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">

        <div className="bg-white/90 backdrop-blur-xl border border-pink-200 shadow-2xl rounded-3xl p-6 space-y-4">

          <input
            placeholder="Enter Start Location"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Enter Destination"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition p-3 rounded-xl outline-none"
          />

          <div className="flex gap-3">

            <button
              onClick={() => {
                if (!start || !end) {
                  alert("Enter start and destination");
                  return;
                }
                setUseMyLocation(false);
                setTrigger((prev) => !prev);
              }}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-[1.03] active:scale-[0.97] transition transform text-white font-semibold py-2 rounded-xl shadow-lg"
            >
              Find Route
            </button>

            <button
              onClick={() => {
                setUseMyLocation(true);
                setTrigger((prev) => !prev);
              }}
              className="flex-1 bg-white border border-pink-400 text-pink-600 hover:bg-pink-50 transition font-semibold py-2 rounded-xl"
            >
              Use My Location
            </button>

          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-80px)] mt-16">
        <MapView
          start={start}
          end={end}
          trigger={trigger}
          useMyLocation={useMyLocation}
        />
      </div>
    </div>
  );
}