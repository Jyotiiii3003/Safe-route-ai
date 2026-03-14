import { useEffect, useState } from "react";
import { supabase } from "../Services/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

 const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  console.log("ALL profiles:", data);
  console.log("Error:", error);

  if (!data) return;

  const pendingUsers = data.filter(
    (user) => user.role === "user" && user.verified !== true
  );

  console.log("Pending users:", pendingUsers);

  setUsers(pendingUsers);
};

  useEffect(() => {
    fetchUsers();
  }, []);

 const approveUser = async (id) => {
  console.log("Approving user:", id);

  const { error } = await supabase.rpc("approve_user", {
    user_id: id
  });

  console.log("Approve error:", error);

  fetchUsers();
};

  const rejectUser = async (id) => {
  console.log("Rejecting user:", id);

  const { error } = await supabase.rpc("reject_user", {
    user_id: id
  });

  console.log("Reject error:", error);

  fetchUsers();
};
  const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate("/signUp");

  
};
console.log("Users state:", users);
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <h2 className="text-xl font-bold mb-4">Pending Verifications</h2>

      {users.length === 0 && <p>No pending users.</p>}

      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white shadow-lg border border-pink-100 rounded-2xl p-6 mb-4 flex justify-between items-center hover:shadow-xl transition"
        >
          <div>
            <p><b>User ID:</b> {user.id}</p>
            <p><b>AI Score:</b> {user.ai_confidence}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => approveUser(user.id)}
              className="bg-emerald-500 hover:bg-emerald-600 transition text-white px-4 py-2 rounded-xl shadow"
            >
              Approve
            </button>

            <button
              onClick={() => rejectUser(user.id)}
              className="bg-rose-500 hover:bg-rose-600 transition text-white px-4 py-2 rounded-xl shadow"
            >
              Reject
            </button>
          </div>
          
        </div>
      ))}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
      >
        Logout
      </button>
    </div>
  );
}