"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <header className="container" style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '2rem'
        }}>
            <Link href="/" style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                PaperTrade.<span className="gradient-text">IO</span>
            </Link>

            <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {[
                    { name: 'Dashboard', path: '/home' },
                    { name: 'Backtest', path: '/backtest' },
                    { name: 'Watchlist', path: '/watchlist' },
                    { name: 'Reports', path: '/reports' },
                ].map((link) => (
                    <Link
                        key={link.path}
                        href={link.path}
                        style={{
                            fontSize: '0.95rem',
                            color: isActive(link.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive(link.path) ? 600 : 400,
                            transition: 'color 0.2s ease'
                        }}
                    >
                        {link.name}
                    </Link>
                ))}
            </nav>

            <div>
                <Link href="/login" className="btn-primary" style={{
                    fontSize: '0.9rem',
                    padding: '0.6rem 1.25rem',
                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
                }}>
                    Login
                </Link>
            </div>
        </header>
    );
}
