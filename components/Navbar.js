"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCookie } from '../app/utils/helpers';

export default function Navbar() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const isActive = (path) => pathname === path;

    useEffect(() => {
        // Simple check: if access token cookie exists, we are logged in
        const token = getCookie('fyers_access_token');
        setIsLoggedIn(!!token);
    }, [pathname]); // Re-check on route change

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
                {!isLoggedIn && (
                    <Link href="/login" className="btn-primary" style={{
                        fontSize: '0.9rem',
                        padding: '0.6rem 1.25rem',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
                    }}>
                        Login
                    </Link>
                )}
            </div>
        </header>
    );
}
