import { BrowserRouter, Routes, Route, Navigate,useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./Services/supabaseClient";

import Signup from "./pages/signUp";
import MainApp from "./components/MainApp";
import Admin from "./pages/Admin";

function PendingPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signUp");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="bg-white shadow-xl border border-pink-200 rounded-3xl p-10 text-center max-w-md">
        
        <h2 className="text-2xl font-bold text-pink-600 mb-4">
          🌸 Verification Under Review
        </h2>

        <p className="text-gray-600 mb-6">
          Our admin team is reviewing your profile. You’ll get access once verified.
        </p>

        <button className="bg-gradient-to-r from-red-500 to-pink-500"
          onClick={handleLogout}
          
        >
          Logout
        </button>

      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
  const fetchProfile = async (currentSession) => {
    if (!currentSession) {
      setSession(null);
      setRole(null);
      setVerified(false);
      setLoading(false);
      return;
    }

    setSession(currentSession);

    const { data: profile } = await supabase
      .from("profiles")
      .select("verified, role")
      .eq("id", currentSession.user.id)
      .maybeSingle();

    setVerified(profile?.verified ?? false);
    setRole(profile?.role ?? "user");
    setLoading(false);
    console.log("JWT app_metadata:", currentSession.user.app_metadata);
  };

  // Initial load
  supabase.auth.getSession().then(({ data }) => {
    fetchProfile(data.session);
  });

  // Listen for login/logout
  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      fetchProfile(session);
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
      role === "admin" ? (
        <Navigate to="/admin" />
      ) : verified ? (
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
    !session || role === "admin"
      ? <Signup />
      : <Navigate to="/" />
  }
/>

        <Route
  path="/pending"
  element={
    session && !verified
      ? <PendingPage />
      : <Navigate to="/" />
  }
/>
        <Route
          path="/admin"
          element={
          session && role === "admin"
          ? <Admin />
          : <Navigate to="/" />
       }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;