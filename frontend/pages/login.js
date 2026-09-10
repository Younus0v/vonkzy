// login.js
// Real login using Supabase Auth. Redirects to /dashboard on success -
// the dashboard itself is built in Phase 8, so this points there already,
// ready for that page to exist.

import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 32 }}>Log in</h1>
      {router.query.justSignedUp && (
        <p style={{ background: "#eef7ee", padding: 12, borderRadius: 4, marginBottom: 24 }}>
          Account created - log in below to continue.
        </p>
      )}
      <form onSubmit={handleLogin}>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>
        {error && <p style={{ color: "#c0392b", marginBottom: 16 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Logging in..." : "Log in"}
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
  background: "#2c5f8a",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};