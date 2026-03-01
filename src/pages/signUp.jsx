import { useState } from "react";
import { supabase } from "../Services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");

    if (!declaration) {
      setError("You must accept the declaration.");
      return;
    }

    if (!image) {
      setError("Please upload a selfie.");
      return;
    }

    setLoading(true);

    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      setError("User creation failed.");
      return;
    }

    
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(image.type)) {
      setError("Only JPG or PNG images allowed.");
      setLoading(false);
      return;
    }

    if (image.size > maxSize) {
      setError("Image must be under 2MB.");
      setLoading(false);
      return;
    }

    
    const filePath = `${user.id}/selfie-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("selfies")
      .upload(filePath, image);

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    
    const aiScore = Math.floor(Math.random() * 20) + 80;

   
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        declaration_accepted: true,
        ai_confidence: aiScore,
        verified: false, 
      })
      .eq("id", user.id);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    setLoading(false);
    navigate("/");
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-white to-purple-100 px-4">
      <div className="bg-white/80 backdrop-blur-xl border border-pink-200 shadow-2xl rounded-3xl p-10 w-full max-w-md transition-all duration-300">
        <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Route Saathi
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
        Secure access for verified women users
        </p>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition p-3 mb-4 rounded-xl outline-none"
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition p-3 mb-4 rounded-xl outline-none"
        />

        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setImage(e.target.files[0])}
          className="mb-4 text-sm"
        />

        <label className="flex gap-2 text-sm mb-6 text-gray-600">
          <input
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            className="accent-pink-500"
          />
          I confirm that I identify as a woman.
        </label>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-[1.02] active:scale-[0.98] transition transform text-white font-semibold p-3 rounded-xl shadow-lg mb-3"
        >
          {loading ? "Processing..." : "Sign Up"}
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-800 hover:bg-gray-900 transition text-white font-semibold p-3 rounded-xl"
        >
          Login
        </button>

        {error && (
          <div className="text-rose-500 text-sm mt-4 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}