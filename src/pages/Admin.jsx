import { useEffect, useState } from "react";
import { supabase } from "../Services/supabaseClient";

export default function Admin() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("verified", false);

    setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (id) => {
    await supabase
      .from("profiles")
      .update({ verified: true })
      .eq("id", id);

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
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Pending Verifications</h2>

      {users.length === 0 && <p>No pending users.</p>}

      {users.map((user) => (
        <div
          key={user.id}
          className="border p-4 rounded mb-3 flex justify-between items-center"
        >
          <div>
            <p><b>User ID:</b> {user.id}</p>
            <p><b>AI Score:</b> {user.ai_confidence}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => approveUser(user.id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>

            <button
              onClick={() => rejectUser(user.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}