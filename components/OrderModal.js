"use client";
import React, { useState, useEffect } from 'react';
import { placeOrder } from '../app/utils/tradingEngine';
import { getCookie } from '../app/utils/helpers';

export default function OrderModal({ symbol, side, onClose, onSuccess }) {
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [orderSide, setOrderSide] = useState(side || 'BUY');
    const [error, setError] = useState(null);

    // Fetch Latest Price on Mount
    useEffect(() => {
        const fetchLTP = async () => {
            try {
                // We need Fyers SDK to get quote. 
                // Note: In real app, we might pass LTP from parent, but fetching here ensures freshness.
                const { fyersModel } = await import("fyers-web-sdk-v3");
                const fyers = new fyersModel();
                const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;
                const token = getCookie('fyers_access_token');
                fyers.setAppId(appId);
                fyers.setAccessToken(token);

                const response = await fyers.getQuotes([symbol]);
                if (response.s === 'ok' && response.d.length > 0) {
                    setPrice(response.d[0].v.lp); // lp = Last Traded Price
                }
            } catch (err) {
                console.error("Failed to fetch LTP:", err);
            }
        };
        if (symbol) fetchLTP();
    }, [symbol]);

    const handleExecute = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await placeOrder(symbol, orderSide, Number(qty), Number(price));
            if (onSuccess) {
                onSuccess(
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{orderSide} Order Placed successfully</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>
                            {symbol} {qty} Qty
                        </span>
                    </div>
                );
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!symbol) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="glass-panel animate-fade-in">
                <div style={styles.header}>
                    <h3>{symbol}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.body}>
                    <div style={styles.toggleGroup}>
                        <button
                            style={{ ...styles.toggleBtn, background: orderSide === 'BUY' ? '#22c55e' : 'transparent', borderColor: '#22c55e' }}
                            onClick={() => setOrderSide('BUY')}
                        >BUY</button>
                        <button
                            style={{ ...styles.toggleBtn, background: orderSide === 'SELL' ? '#ef4444' : 'transparent', borderColor: '#ef4444' }}
                            onClick={() => setOrderSide('SELL')}
                        >SELL</button>
                    </div>

                    <div style={styles.inputGroup}>
                        <label>Quantity</label>
                        <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={styles.input} />
                    </div>

                    <div style={styles.inputGroup}>
                        <label>Price (LTP)</label>
                        <input type="number" value={price} disabled style={{ ...styles.input, opacity: 0.7 }} />
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>}

                    <div style={styles.footer}>
                        <span style={{ fontSize: '0.9rem' }}>Margin: ₹{(qty * price).toFixed(2)}</span>
                        <button onClick={handleExecute} disabled={isLoading} className="btn-primary"
                            style={{ background: orderSide === 'BUY' ? '#22c55e' : '#ef4444', width: '100%' }}>
                            {isLoading ? 'Executing...' : `${orderSide} ORDER`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(5px)'
    },
    modal: {
        width: '350px', padding: '1.5rem', borderRadius: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.2rem' },
    closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
    toggleGroup: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
    toggleBtn: { flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
    inputGroup: { marginBottom: '1rem' },
    input: { width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff' },
    footer: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }
};
