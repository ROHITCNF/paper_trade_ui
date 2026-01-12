"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCookie, setCookie } from "../utils/helpers";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Waiting for Input...");
    const [appIdInput, setAppIdInput] = useState("");
    const [secretKeyInput, setSecretKeyInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Auto-check for existing session on mount
        const authCodeCookie = getCookie('fyers_auth_code');
        const accessTokenCookie = getCookie('fyers_access_token');
        const urlAuthCode = searchParams.get('auth_code');

        const handleAuthFlow = async () => {
            // 1. Check if we just came back from Fyers (URL has code)
            if (urlAuthCode) {
                console.log("Algo: Found auth_code in URL");
                setCookie('fyers_auth_code', urlAuthCode);
                setStatus("Generating Access Token...");

                // We need to call API to trade the code for a token
                // NOTE: For this to work with DYNAMIC AppID/Secret, we need to pass them to the API
                // For now, we will rely on the server envs OR we can store them in cookies momentarily?
                // Actually, the server route uses ENV vars. If you want USER INPUT to drive this,
                // we need to change the API to accept appId/secret from the client or store them in cookies before redirect.

                // For this step, let's assume valid session if we get the code back.
                await generateAndSetToken(urlAuthCode);
                return;
            }

            if (authCodeCookie && accessTokenCookie) {
                console.log("Algo: Both cookies present. Redirecting to Dashboard.");
                router.replace('/home');
            }
        };

        handleAuthFlow();
    }, [searchParams, router]);

    const generateAndSetToken = async (code) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Important: If we want to support custom credentials, we need to pass them found in cookies or state
                body: JSON.stringify({ auth_code: code })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                console.log("Token Generated Successfully");
                setCookie('fyers_access_token', data.access_token);
                // Redirect to dashboard
                router.replace('/home');
            } else {
                console.error("Failed to generate token:", data);
                setStatus("Auth Failed: Code Expired or Invalid");
            }
        } catch (error) {
            console.error("API Error:", error);
            setStatus("Server Error");
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus("Redirecting to Fyers...");

        // Store credentials in cookies/localstorage if needed for the callback? 
        // For now, let's focus on the Redirect URL generation.

        try {
            const { fyersModel } = await import("fyers-web-sdk-v3");
            const fyers = new fyersModel();

            // Use User Input
            const appId = appIdInput; // Fallback
            const secretKey = secretKeyInput;

            if (!appId) {
                setStatus("App ID is required");
                setIsSubmitting(false);
                return;
            }

            // Store App ID in cookie for runtime usage across app
            setCookie('fyers_app_id', appId);
            setCookie('fyers_secret_key', secretKey);
            console.log("Runtime App ID set to cookie:", appId);

            fyers.setAppId(appId);

            fyers.setRedirectUrl("https://paper-trade-io.vercel.app/login");

            const authUrl = fyers.generateAuthCode();
            window.location.href = authUrl;

        } catch (err) {
            console.error(err);
            setStatus("Error initializing SDK");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login to PaperTra.IO</h1>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>App ID</label>
                    <input
                        type="text"
                        placeholder="Enter Fyers App ID"
                        value={appIdInput}
                        onChange={(e) => setAppIdInput(e.target.value)}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '8px',
                            border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)'
                        }}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Secret Key</label>
                    <input
                        type="password"
                        placeholder="Enter Secret Key"
                        value={secretKeyInput}
                        onChange={(e) => setSecretKeyInput(e.target.value)}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '8px',
                            border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)'
                        }}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{ marginTop: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting ? 'Connecting...' : 'Login with Fyers'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Status: {status}
                </p>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="container animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '500px' }}>
            <Suspense fallback={<div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading Login...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
