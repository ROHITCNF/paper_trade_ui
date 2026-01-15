"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCookie, deleteCookie } from '../app/utils/helpers';

export default function Navbar() {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const isActive = (path) => pathname === path;

    useEffect(() => {
        // Simple check: if access token cookie exists, we are logged in
        const token = getCookie('fyers_access_token');
        setIsLoggedIn(!!token);

        if (token && !profileImage) {
            const fetchProfile = async () => {
                try {
                    const { fyersModel } = await import("fyers-web-sdk-v3");
                    const fyers = new fyersModel();
                    const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;
                    fyers.setAppId(appId);
                    fyers.setAccessToken(token);

                    const response = await fyers.get_profile();
                    console.log("Profile Data:", response);
                    if (response.s === 'ok' && response.data?.image) {
                        setProfileImage(response.data.image);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            };
            fetchProfile();
        }
    }, [pathname]);

    const handleLogout = () => {
        deleteCookie('fyers_access_token');
        deleteCookie('fyers_auth_code');
        deleteCookie('fyers_app_id');
        deleteCookie('fyers_secret_key');
        window.location.href = '/login';
    };

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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isLoggedIn ? (
                    <>
                        {profileImage && (
                            <img
                                src={profileImage}
                                alt="Profile"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--accent-color)',
                                    objectFit: 'cover'
                                }}
                            />
                        )}
                        <button
                            onClick={handleLogout}
                            className="btn-primary"
                            style={{
                                fontSize: '0.9rem',
                                padding: '0.6rem 1.25rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                boxShadow: 'none'
                            }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
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
