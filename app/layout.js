export const metadata = {
    title: "Pinas Cargo — Dispatch Dashboard"
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body style={{ margin: 0, fontFamily: "'Inter', sans-serif", background: "#F7F8FA", color: "#1B1F5C" }}>
                {children}
            </body>
        </html>
    );
}
