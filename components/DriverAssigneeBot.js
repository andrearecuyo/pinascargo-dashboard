"use client";

import { useMemo, useState } from "react";

const CITIES = ["ABU DHABI", "AJMAN", "DUBAI", "FUJAIRAH", "RAS AL KHAIMAH", "WESTERN REGION", "UMM AL QUWAIN", "SHARJAH", "AL AIN"];

// Mirrors lib/matchDriver.js's CITY_TEAM_MAP so the area suggestions match the city chosen.
const CITY_TEAM_MAP = {
    "DUBAI": "DUBAI", "ABU DHABI": "ABU DHABI", "SHARJAH": "SHARJAH", "FUJAIRAH": "FUJAIRAH",
    "RAS AL KHAIMAH": "RAS AL KHAIMAH", "AL AIN": "AL AIN", "AJMAN": "SHARJAH",
    "UMM AL QUWAIN": "SHARJAH", "WESTERN REGION": "ABU DHABI"
};

export default function DriverAssigneeBot({ drivers }) {
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [state, setState] = useState("idle"); // idle | loading | result | error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const areaOptions = useMemo(() => {
        const team = CITY_TEAM_MAP[city];
        if (!team) return [];
        const set = new Set();
        for (const d of drivers) {
            if (d.team !== team) continue;
            for (const a of d.areas) set.add(a.area_name);
        }
        return [...set].sort();
    }, [city, drivers]);

    async function handleSubmit(e) {
        e.preventDefault();
        setState("loading");
        setErrorMsg("");
        try {
            const response = await fetch(`/api/match-driver?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Lookup failed.");
            setResult(data.driver);
            setState("result");
        } catch (err) {
            setErrorMsg(err.message);
            setState("error");
        }
    }

    function handleRetry() {
        setState("idle");
        setResult(null);
        setErrorMsg("");
    }

    return (
        <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)",
            padding: 20, position: "sticky", top: 24
        }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#1B1F5C" }}>🤖 Driver Assignee Bot</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#4B5468" }}>
                Enter an address to find who covers it.
            </p>

            {(state === "idle" || state === "loading") && (
                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>City *</label>
                    <select
                        required
                        value={city}
                        onChange={e => { setCity(e.target.value); setArea(""); }}
                        style={inputStyle}
                        disabled={state === "loading"}
                    >
                        <option value="">Select a city</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <label style={labelStyle}>Area *</label>
                    <input
                        required
                        list="bot-areas"
                        value={area}
                        onChange={e => setArea(e.target.value)}
                        placeholder="Type or select an area"
                        style={inputStyle}
                        disabled={state === "loading" || !city}
                    />
                    <datalist id="bot-areas">
                        {areaOptions.map(a => <option key={a} value={a} />)}
                    </datalist>

                    <button type="submit" disabled={state === "loading"} style={submitBtnStyle}>
                        {state === "loading" ? "Matching..." : "Find Driver"}
                    </button>
                </form>
            )}

            {state === "result" && (
                <div>
                    {result ? (
                        <div style={{ background: "#E8F6FF", border: "1px solid #BEE7FA", borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 13, color: "#4B5468", marginBottom: 6 }}>Matched driver:</div>
                            <div style={{ fontWeight: 700, color: "#1275A8", fontSize: 15 }}>{result.driver_code}</div>
                            <div style={{ fontSize: 14, marginTop: 2 }}>{result.names}</div>
                            <div style={{ fontSize: 13, color: "#4B5468", marginTop: 2 }}>{result.phone}</div>
                            <div style={{ fontSize: 12, color: "#4B5468", marginTop: 8 }}>Matched on area: {result.area_name}</div>
                        </div>
                    ) : (
                        <div style={{ background: "#FDEDEC", border: "1px solid #F5B7B1", borderRadius: 10, padding: 14, color: "#8B1A13", fontSize: 14 }}>
                            No driver found covering &ldquo;{area}&rdquo; in {city}.
                        </div>
                    )}
                    <button onClick={handleRetry} style={retryBtnStyle}>↻ Retry</button>
                </div>
            )}

            {state === "error" && (
                <div>
                    <div style={{ background: "#FDEDEC", border: "1px solid #F5B7B1", borderRadius: 10, padding: 14, color: "#8B1A13", fontSize: 14 }}>
                        {errorMsg}
                    </div>
                    <button onClick={handleRetry} style={retryBtnStyle}>↻ Retry</button>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, marginTop: 12, color: "#1B1F5C" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #E2E4E9", borderRadius: 8, fontSize: 14 };
const submitBtnStyle = { width: "100%", marginTop: 16, background: "#E2231A", color: "#fff", border: "none", borderRadius: 8, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const retryBtnStyle = { width: "100%", marginTop: 12, background: "#1B1F5C", color: "#fff", border: "none", borderRadius: 8, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
