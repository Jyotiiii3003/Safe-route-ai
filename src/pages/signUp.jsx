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

    // 1️⃣ Create Auth User
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

    // 2️⃣ Validate Image
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

    // 3️⃣ Upload Selfie
    const filePath = `${user.id}/selfie-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("selfies")
      .upload(filePath, image);

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    // 4️⃣ Mock AI Gender Confidence
    // (Later replace with real AI API call)
    const aiScore = Math.floor(Math.random() * 20) + 80;

    // 5️⃣ Update Profile (trigger already created row)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        declaration_accepted: true,
        ai_confidence: aiScore,
        verified: false, // Always false → Admin must approve
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
    <div className="flex justify-center items-center h-screen bg-pink-50">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Women Safety App
        </h2>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setImage(e.target.files[0])}
          className="mb-3"
        />

        <label className="flex gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
          />
          I confirm that I identify as a woman.
        </label>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-pink-600 text-white p-2 rounded mb-2"
        >
          {loading ? "Processing..." : "Sign Up"}
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-700 text-white p-2 rounded"
        >
          Login
        </button>

        {error && (
          <div className="text-red-500 text-sm mt-3 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}