import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./Services/supabaseClient";

import Signup from "./pages/signUp";
import MainApp from "./components/MainApp";
import Admin from "./pages/Admin";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("verified")
          .eq("id", currentSession.user.id)
          .single();

        setVerified(profile?.verified ?? false);
      }

      setLoading(false);
    };

    getSessionAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            session ? (
              verified ? (
                <MainApp />
              ) : (
                <Navigate to="/pending" />
              )
            ) : (
              <Navigate to="/signUp" />
            )
          }
        />

        <Route
          path="/signUp"
          element={
            session ? <Navigate to="/" /> : <Signup />
          }
        />

        <Route
          path="/pending"
          element={
            session && !verified ? (
              <div className="flex items-center justify-center h-screen">
                <div className="bg-white p-6 rounded shadow text-center">
                  <h2 className="text-xl font-bold mb-2">
                    Verification Under Review
                  </h2>
                  <p>
                    Your account is being reviewed. Access will be granted once verified.
                  </p>
                </div>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
            element={
              session && verified ? (
              <Admin />
               ) : (
                <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;