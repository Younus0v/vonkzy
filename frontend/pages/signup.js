// signup.js
// A real signup page - creates a Supabase Auth account, then a matching
// row in the contractors table, linked via user_id.

import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { error: contractorError } = await supabase.from("contractors").insert({
      company_name: companyName,
      owner_phone: ownerPhone,
      phone_number: `pending-${authData.user.id}`,
      user_id: authData.user.id,
    });

    if (contractorError) {
      setError(contractorError.message);
      setLoading(false);
      return;
    }

    router.push("/login?justSignedUp=true");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Start your free trial</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        No card needed. 14 days free.
      </p>
      <form onSubmit={handleSignup}>
        <label style={{ display: "block", marginBottom: 16 }}>
          Company name
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          Your phone (for urgent alerts)
          <input
            required
            type="tel"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="+1..."
            style={inputStyle}
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "block", marginBottom: 24 }}>
          Password
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>
        {error && <p style={{ color: "#c0392b", marginBottom: 16 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating account..." : "Start free trial"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 15,
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#e8a23d",
  border: "none",
  borderRadius: 4,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};