
import Image from "next/image";

export default function Home() {
  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header className="container" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
          PaperTra.<span className="gradient-text">IO</span>
        </div>
        <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          <a href="#">Dashboard</a>
          <a href="#">Markets</a>
          <a href="#">Learn</a>
          <a href="#">Profile</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 20px' }}>

        <div style={{ position: 'relative', maxWidth: '800px' }}>
          {/* Background Glow Effect */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '600px', height: '600px', background: 'var(--primary-glow)', opacity: '0.15',
            filter: 'blur(100px)', borderRadius: '50%', zIndex: -1
          }}></div>

          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Master the Markets <br />
            <span className="gradient-text">Without the Risk.</span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            Experience real-time trading simulations with advanced analytics and zero financial risk. The ultimate playground for future traders.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary">Start Trading Now</button>
            <button style={{
              background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
              padding: '0.75rem 1.5rem', borderRadius: '99px', fontWeight: 600, cursor: 'pointer'
            }}>
              View Demo
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '8rem' }}>
          {[
            { title: "Real-time Data", desc: "Live market data from top global exchanges.", icon: "ShowChart" },
            { title: "Zero Risk", desc: "Practice with virtual currency before going live.", icon: "Security" },
            { title: "Advanced Tools", desc: "Professional charting and technical indicators.", icon: "Speed" },
          ].map((feature, i) => (
            <div key={i} className="glass-panel" style={{ padding: '2rem', textAlign: 'left', transition: 'transform 0.3s ease' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                {/* Simple Emoji placeholders for icons */}
                {feature.icon === 'ShowChart' ? '📈' : feature.icon === 'Security' ? '🛡️' : '⚡'}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </main>

      <footer style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.875rem', borderTop: '1px solid var(--border-color)' }}>
        <p>&copy; 2025 PaperTra.IO. All rights reserved.</p>
      </footer>
    </div>
  );
}
