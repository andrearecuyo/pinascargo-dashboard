"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() || undefined, password, rememberMe })
            });
            const data = await response.json();

            if (response.ok) {
                router.push(data.role === "marketing" ? "/marketing/qr-codes" : "/dashboard");
                router.refresh();
            } else {
                setError(data.error || "Login failed.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 20px 50px rgba(20,24,80,0.12)",
                    padding: 40,
                    width: "100%",
                    maxWidth: 380
                }}
            >
                <img
                    src="https://app.pinascargo.com/uploads/company/logo.png"
                    alt="Pinas Express Cargo & Clearing LLC"
                    style={{ width: "100%", maxWidth: 220, margin: "0 auto 20px", display: "block" }}
                />
                <h1 style={{ fontSize: 20, marginTop: 0, marginBottom: 6, textAlign: "center" }}>Pinas Cargo Standalone App</h1>
                <p style={{ color: "#9AA0AE", fontSize: 12, marginTop: 0, marginBottom: 20, textAlign: "center" }}>
                    v1.0.0
                </p>
                <p style={{ color: "#4B5468", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
                    Enter your credentials to continue.
                </p>

                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    placeholder=""
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 14px",
                        border: "1px solid #E2E4E9",
                        borderRadius: 8,
                        fontSize: 15,
                        marginBottom: 16
                    }}
                />

                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Password</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 44px 12px 14px",
                            border: "1px solid #E2E4E9",
                            borderRadius: 8,
                            fontSize: 15
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{
                            position: "absolute",
                            right: 4,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "#9AA0AE",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "6px 8px"
                        }}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#4B5468", marginBottom: 16, cursor: "pointer" }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    Remember me
                </label>

                {error && <div style={{ color: "#E2231A", fontSize: 14, marginBottom: 16 }}>{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        background: "#E2231A",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#9AA0AE", lineHeight: 1.6 }}>
                    © 2026 PINAS EXPRESS CARGO &amp; CLEARING LLC · All rights reserved
                    <br />
                    Authorized personnel only · Access is logged and monitored
                </div>
            </form>
        </div>
    );
}
