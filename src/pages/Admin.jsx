import { useEffect, useState } from "react";
import { supabase } from "../Services/supabaseClient";

export default function Admin() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("verified", false);

console.log("Pending users:", data);
console.log("Error:", error);   

    setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (id) => {
  const { data, error } = await supabase
    .from("profiles")
    .update({ verified: true })
    .eq("id", id)
    .select();

  console.log("Approve result:", data);
  console.log("Approve error:", error);

  fetchUsers();
};

  const rejectUser = async (id) => {
    await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    fetchUsers();
  };

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
              className="bbg-rose-500 hover:bg-rose-600 transition text-white px-4 py-2 rounded-xl shadow"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}