"use client";
export default function HomePage() {
    // Middleware now handles protection

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>
            </div>

            <div className="glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Welcome to your Trading Dashboard
                </p>
            </div>
        </div>
    );
}
