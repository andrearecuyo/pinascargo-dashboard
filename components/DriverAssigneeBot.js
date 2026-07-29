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
    const [mode, setMode] = useState("city-area"); // "city-area" | "address"
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [address, setAddress] = useState("");
    const [state, setState] = useState("idle"); // idle | loading | result | error
    const [result, setResult] = useState(null); // single driver (city-area mode)
    const [matches, setMatches] = useState([]); // list of drivers (address mode)
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

    function switchMode(newMode) {
        setMode(newMode);
        setState("idle");
        setResult(null);
        setMatches([]);
        setErrorMsg("");
    }

    async function handleSubmitCityArea(e) {
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

    async function handleSubmitAddress(e) {
        e.preventDefault();
        setState("loading");
        setErrorMsg("");
        try {
            const response = await fetch(`/api/match-driver-by-address?address=${encodeURIComponent(address)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Lookup failed.");
            setMatches(data.matches || []);
            setState("result");
        } catch (err) {
            setErrorMsg(err.message);
            setState("error");
        }
    }

    function handleRetry() {
        setState("idle");
        setResult(null);
        setMatches([]);
        setErrorMsg("");
    }

    return (
        <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)",
            padding: 20, position: "sticky", top: 24
        }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#1B1F5C" }}>🤖 Driver Assignee Bot</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#4B5468" }}>
                Find who covers an address.
            </p>

            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#F7F8FA", borderRadius: 8, padding: 4 }}>
                <button onClick={() => switchMode("city-area")} style={tabStyle(mode === "city-area")}>City + Area</button>
                <button onClick={() => switchMode("address")} style={tabStyle(mode === "address")}>Full Address</button>
            </div>

            {mode === "city-area" && (state === "idle" || state === "loading") && (
                <form onSubmit={handleSubmitCityArea}>
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

            {mode === "address" && (state === "idle" || state === "loading") && (
                <form onSubmit={handleSubmitAddress}>
                    <label style={labelStyle}>Full Address *</label>
                    <textarea
                        required
                        rows={4}
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="e.g. Villa 12, Street 4, Al Barsha, Dubai"
                        style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                        disabled={state === "loading"}
                    />
                    <p style={{ fontSize: 11.5, color: "#9AA0AE", margin: "6px 0 0" }}>
                        Searches all areas since there&apos;s no city to narrow it down — may return more than one possible driver.
                    </p>

                    <button type="submit" disabled={state === "loading"} style={submitBtnStyle}>
                        {state === "loading" ? "Matching..." : "Find Driver"}
                    </button>
                </form>
            )}

            {state === "result" && mode === "city-area" && (
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

            {state === "result" && mode === "address" && (
                <div>
                    {matches.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {matches.length > 1 && (
                                <div style={{ fontSize: 12, color: "#B5690B", background: "#FFF3E0", border: "1px solid #FFCC80", borderRadius: 8, padding: "8px 10px" }}>
                                    {matches.length} possible matches found — pick the most likely one.
                                </div>
                            )}
                            {matches.map(m => (
                                <div key={m.id} style={{ background: "#E8F6FF", border: "1px solid #BEE7FA", borderRadius: 10, padding: 14 }}>
                                    <div style={{ fontWeight: 700, color: "#1275A8", fontSize: 15 }}>{m.driver_code}</div>
                                    <div style={{ fontSize: 14, marginTop: 2 }}>{m.names}</div>
                                    <div style={{ fontSize: 13, color: "#4B5468", marginTop: 2 }}>{m.phone}</div>
                                    <div style={{ fontSize: 12, color: "#4B5468", marginTop: 8 }}>Team: {m.team} · Matched on: {m.area_name}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ background: "#FDEDEC", border: "1px solid #F5B7B1", borderRadius: 10, padding: 14, color: "#8B1A13", fontSize: 14 }}>
                            No known area name found in that address.
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

const tabStyle = active => ({
    flex: 1, padding: "8px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    border: "none", borderRadius: 6, background: active ? "#1B1F5C" : "transparent", color: active ? "#fff" : "#4B5468"
});
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, marginTop: 12, color: "#1B1F5C" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #E2E4E9", borderRadius: 8, fontSize: 14 };
const submitBtnStyle = { width: "100%", marginTop: 16, background: "#E2231A", color: "#fff", border: "none", borderRadius: 8, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const retryBtnStyle = { width: "100%", marginTop: 12, background: "#1B1F5C", color: "#fff", border: "none", borderRadius: 8, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
