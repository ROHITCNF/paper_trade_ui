import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const { auth_code, appId, secretKey } = await request.json();

        if (!auth_code) {
            return NextResponse.json({ error: 'Auth code is required' }, { status: 400 });
        }

        // const appId = process.env.NEXT_PUBLIC_APP_ID;
        // const secretKey = process.env.NEXT_PUBLIC_SECRET_ID;

        // Fyers API requires SHA-256 hash of (appId + secretKey)
        const appIdHash = crypto.createHash('sha256').update(appId + ":" + secretKey).digest('hex');

        console.log("Generating token with:", { appId, auth_code: auth_code.substring(0, 10) + '...' });

        // Call Fyers API directly using fetch
        const response = await fetch('https://api-t1.fyers.in/api/v3/validate-authcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                appIdHash: appIdHash,
                code: auth_code
            })
        });

        const data = await response.json();
        console.log("Fyers API Response:", data);

        if (data.s === 'ok') {
            const accessToken = data.access_token;

            // Create response with HTTP-Only cookie
            const nextResponse = NextResponse.json({ success: true, message: 'Logged in successfully', access_token: accessToken });

            // // Set Secure Cookie
            // nextResponse.cookies.set('fyers_access_token', accessToken, {
            //     httpOnly: true, // Not accessible via JS
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'lax',
            //     path: '/',
            //     maxAge: 86400 // 1 day
            // });

            return nextResponse;
        } else {
            return NextResponse.json({ error: 'Failed to generate token', details: data }, { status: 401 });
        }

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
