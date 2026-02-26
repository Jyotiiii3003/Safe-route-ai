import { useState } from "react";
import { supabase } from "../Services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
         data: {},
      },
    });
    

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setStep(2);
    }
  };

  

  const verifyOTP = async () => {
    setError("");

    if (!declaration) {
      setError("You must accept the declaration.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    console.log("Verify OTP result:", data);
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    
    const user = data.user;

   
    const aiScore = Math.floor(Math.random() * 20) + 80;

    
    if (image) {
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

      await supabase.storage
        .from("selfies")
        .upload(`${user.id}/selfie-${Date.now()}.jpg`, image);
    }
    console.log("User ID:", user.id);
    
    const { error: profileError } = await supabase
  .from("profiles")
  .insert([
    {
      id: user.id,
      phone: null,
      declaration_accepted: true,
      ai_confidence: aiScore,
      verified: aiScore > 85,
    },
  ]);

    console.log("Profile insert error:", profileError);

    setLoading(false);
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-pink-50">
      <div className="bg-white p-8 rounded-xl shadow w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Women Safety App
        </h2>

        {step === 1 && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              Enter your email to receive OTP
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            />

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-pink-600 text-white p-2 rounded hover:bg-pink-700"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              Enter OTP and complete verification
            </p>

            <input
              type="text"
              placeholder="Enter 8-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-pink-600 text-white p-2 rounded hover:bg-pink-700"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-3 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}