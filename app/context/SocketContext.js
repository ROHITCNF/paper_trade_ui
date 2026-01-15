"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getCookie } from '../utils/helpers';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastTick, setLastTick] = useState({}); // Throttled state for UI

    const socketRef = useRef(null);
    const priceCache = useRef({}); // Hot storage for 100ms ticks
    const subscriptions = useRef(new Set());

    useEffect(() => {
        // Initialize Socket singleton
        const initSocket = async () => {
            const accessToken = getCookie('fyers_access_token');
            const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;

            if (!accessToken || !appId) return;

            try {
                const { fyersDataSocket } = await import("fyers-web-sdk-v3");

                // Note: fyersDataSocket.getInstance(appId + ":" + accessToken)
                const socketId = `${appId}:${accessToken}`;
                const skt = fyersDataSocket.getInstance(socketId);

                skt.on("connect", () => {
                    console.log("🚀 Socket Connected");
                    setIsConnected(true);

                    // Re-subscribe to existing symbols if any
                    if (subscriptions.current.size > 0) {
                        skt.subscribe(Array.from(subscriptions.current), false, 1);
                        skt.mode(skt.FullMode, 1);
                    }
                });

                skt.on("message", (message) => {
                    console.log("Incoming Tick:", message);
                    if (message.symbol) {
                        priceCache.current[message.symbol] = message;
                    }
                });

                skt.on("error", (err) => console.error("❌ Socket Error:", err));
                skt.on("close", () => {
                    console.log("🔌 Socket Closed");
                    setIsConnected(false);
                });

                skt.connect();
                skt.autoreconnect();
                socketRef.current = skt;

            } catch (err) {
                console.error("Failed to initialize Fyers Socket:", err);
            }
        };

        initSocket();

        // Throttling Logic: Sync priceCache to lastTick every 500ms for UI performance
        const timer = setInterval(() => {
            if (Object.keys(priceCache.current).length > 0) {
                setLastTick({ ...priceCache.current });
            }
        }, 500); // 2 updates per second is plenty for human eyes and saves React re-renders

        return () => {
            if (socketRef.current) {
                // We keep it open as a singleton, unless user logs out.
                // For a proper SPA, we might want to close if the app unmounts.
            }
            clearInterval(timer);
        };
    }, []);

    const subscribe = (symbols) => {
        if (!socketRef.current || !symbols.length) return;

        const newSymbols = symbols.filter(s => !subscriptions.current.has(s));
        if (newSymbols.length === 0) return;

        newSymbols.forEach(s => subscriptions.current.add(s));

        if (isConnected) {
            socketRef.current.subscribe(newSymbols, false, 1);
            socketRef.current.mode(socketRef.current.FullMode, 1);
            console.log(`📡 Subscribed to: ${newSymbols.join(', ')}`);
        }
    };

    const unsubscribe = (symbols) => {
        if (!socketRef.current || !symbols.length) return;

        symbols.forEach(s => subscriptions.current.delete(s));

        if (isConnected) {
            socketRef.current.unsubscribe(symbols, false, 1);
            console.log(`🔕 Unsubscribed from: ${symbols.join(', ')}`);
        }
    };

    return (
        <SocketContext.Provider value={{ isConnected, lastTick, subscribe, unsubscribe }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within a SocketProvider");
    return context;
};
