"use client";

import { useEffect, useState } from "react";

export default function MobileCallback() {
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) {
      setStatus("No auth data received.");
      return;
    }

    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");
    
    if (!idToken) {
      setStatus("No token found.");
      return;
    }

    // Pass the raw token without re-encoding — JWT only has URL-safe chars (alphanumeric, -, _, .)
    const returnUrl = `exp://192.168.2.163:8081/--/auth?id_token=${idToken}`;
    window.location.href = returnUrl;
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      background: "#09090b",
      color: "#f4f4f5",
      fontFamily: "system-ui",
    }}>
      <p>{status}</p>
    </div>
  );
}
