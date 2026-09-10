// dashboard.js
// PLACEHOLDER - confirms login actually worked and shows who's logged in.
// The real dashboard (leads, bookings, ROI numbers) is built in Phase 8.

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContractor() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("contractors")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setContractor(data);
      setLoading(false);
    }
    loadContractor();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return <p style={{ padding: 40, fontFamily: "sans-serif" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1>Welcome, {contractor?.company_name || "there"}.</h1>
      <p style={{ color: "#666" }}>
        Login confirmed working. The real dashboard - leads, bookings, dollars
        recovered - is built in Phase 8.
      </p>
      <button onClick={handleLogout} style={{ marginTop: 24, padding: "10px 20px", cursor: "pointer" }}>
        Log out
      </button>
    </div>
  );
}