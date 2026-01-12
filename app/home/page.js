"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCookie, setCookie } from "../utils/helpers";

export default function HomePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Checking Auth...");

    useEffect(() => {
        const handleAuthFlow = async () => {
            const { fyersModel } = await import("fyers-web-sdk-v3");
            const fyers = new fyersModel();
            // Helper functions for cookies
            const authCodeCookie = getCookie('fyers_auth_code');
            const accessTokenCookie = getCookie('fyers_access_token');
            const urlAuthCode = searchParams.get('auth_code');

            // --- Function to call API and set Token Cookie ---
            const generateAndSetToken = async (code) => {
                setStatus("Generating Access Token...");
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ auth_code: code })
                    });

                    const data = await response.json();

                    if (response.ok && data.access_token) {
                        console.log("Token Generated Successfully");
                        setCookie('fyers_access_token', data.access_token);
                        setStatus("Dashboard Ready");
                        // Optional: Clean URL
                        if (urlAuthCode) {
                            router.replace('/home');
                        }
                    } else {
                        console.error("Failed to generate token:", data);
                        setStatus("Auth Failed: Code Expired or Invalid");
                        // Assuming code is bad, clear it to force re-login next time?
                        // document.cookie = "fyers_auth_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    }
                } catch (error) {
                    console.error("API Error:", error);
                    setStatus("Server Error");
                }
            };

            // --- Function to Redirect to Fyers ---
            const redirectToFyers = async () => {
                setStatus("Redirecting to Fyers...");
                const appId = process.env.NEXT_PUBLIC_APP_ID;

                if (!appId) {
                    console.error("APP_ID missing");
                    setStatus("Config Error");
                    return;
                }

                fyers.setAppId(appId);
                fyers.setRedirectUrl("http://192.168.1.18:2000/home");
                const authUrl = fyers.generateAuthCode();
                window.location.href = authUrl;
            };


            // ================= LOGIC FLOW =================

            // 1. Check if we just came back from Fyers (URL has code)
            if (urlAuthCode) {
                console.log("Algo: Found auth_code in URL");
                setCookie('fyers_auth_code', urlAuthCode);
                await generateAndSetToken(urlAuthCode);
                return;
            }

            // 2. Check if we already have both cookies
            if (authCodeCookie && accessTokenCookie) {
                console.log("Algo: Both cookies present. Good to go.");
                setStatus("Dashboard Ready");
                fyers.setAppId(process.env.NEXT_PUBLIC_APP_ID);
                fyers.setAccessToken(getCookie('fyers_access_token'));
                fyers.get_profile().then((response) => {
                    console.log(response)
                }).catch((error) => {
                    console.log(error)
                })
                return;
            }

            // 3. Check if we have Auth Code but NO Access Token
            if (authCodeCookie && !accessTokenCookie) {
                console.log("Algo: Auth cookie present, missing token. Generating token...");
                await generateAndSetToken(authCodeCookie);
                return;
            }

            // 4. Missing Auth Code (and likely token) -> Redirect
            if (!authCodeCookie) {
                console.log("Algo: No auth cookie. Initiating login...");
                await redirectToFyers();
            }
        };

        handleAuthFlow();
    }, [searchParams, router]);

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>
                    Status: {status}
                </div>
            </div>

            <div className="glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {status === 'Dashboard Ready' ? 'Welcome to your Trading Dashboard' : 'Please wait...'}
                </p>
            </div>
        </div>
    );
}
