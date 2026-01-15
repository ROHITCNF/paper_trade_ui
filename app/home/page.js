"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { db, seedDatabase } from '../utils/db';
import { getCookie } from '../utils/helpers';
import { useLiveQuery } from "dexie-react-hooks";
import { useSocket } from "../context/SocketContext";

export default function HomePage() {
    // 1. Data Fetching via Dexie Hooks
    const fundsParam = useLiveQuery(() => db.funds.get('main'));
    const orders = useLiveQuery(() => db.orders.orderBy('timestamp').reverse().toArray());
    const positions = useLiveQuery(() => db.positions.orderBy('timestamp').reverse().toArray());
    const trades = useLiveQuery(() => db.trades.orderBy('timestamp').reverse().toArray());

    const [activeTab, setActiveTab] = useState('POSITIONS');
    const { lastTick, subscribe } = useSocket();

    // 2. Manage Live Prices and Subscriptions
    useEffect(() => {
        seedDatabase();
        if (positions?.length > 0) {
            const symbols = positions.map(p => p.symbol);
            subscribe(symbols);
        }
    }, [positions?.length]);

    // 3. Dynamic P&L Calculation based on Socket Ticks
    const { livePrices, unrealizedPnL } = useMemo(() => {
        const priceMap = {};
        let totalUnrealized = 0;

        if (positions) {
            positions.forEach(pos => {
                // Get latest LTP from socket tick, fallback to 0 (or we could fetch initial)
                const ltp = lastTick[pos.symbol]?.ltp || 0;
                priceMap[pos.symbol] = ltp;
                if (ltp !== 0) {
                    totalUnrealized += (ltp - pos.avgPrice) * pos.qty;
                }
            });
        }
        return { livePrices: priceMap, unrealizedPnL: totalUnrealized };
    }, [positions, lastTick]);

    // Calc Totals
    const availableFunds = fundsParam?.amount || 0;
    const realizedPnL = fundsParam?.realizedPnl || 0;
    const totalPortfolioValue = availableFunds + unrealizedPnL;

    const formatRupee = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <div style={styles.header}>
                <h1 style={{ fontSize: '2rem' }}>Dashboard</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Welcome to your Trading Desk</div>
            </div>

            {/* Metrics Header */}
            <div style={styles.metricsGrid}>
                <MetricCard label="Available Funds" value={formatRupee(availableFunds)} />
                <MetricCard
                    label="Realized P&L"
                    value={formatRupee(realizedPnL)}
                    color={realizedPnL >= 0 ? '#22c55e' : '#ef4444'}
                />
                <MetricCard
                    label="Unrealized P&L"
                    value={formatRupee(unrealizedPnL)}
                    color={unrealizedPnL >= 0 ? '#22c55e' : '#ef4444'}
                />
                <MetricCard label="Net Value" value={formatRupee(totalPortfolioValue)} />
            </div>

            {/* Tabs & Table */}
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '0', overflow: 'hidden' }}>
                <div style={styles.tabsHeader}>
                    {['POSITIONS', 'ORDERS', 'TRADEBOOK'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                ...styles.tab,
                                borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === tab ? '#fff' : 'var(--text-secondary)'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={styles.tableContainer}>
                    {activeTab === 'POSITIONS' && (
                        <PositionsTable positions={positions} livePrices={livePrices} formatRupee={formatRupee} />
                    )}
                    {activeTab === 'ORDERS' && (
                        <OrdersTable orders={orders} />
                    )}
                    {activeTab === 'TRADEBOOK' && (
                        <TradebookTable trades={trades} />
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

const MetricCard = ({ label, value, color }) => (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
);

const PositionsTable = ({ positions, livePrices, formatRupee }) => {
    if (!positions?.length) return <EmptyState msg="No open positions" />;

    return (
        <table style={styles.table}>
            <thead>
                <tr style={styles.thRow}>
                    <th style={styles.th}>Symbol</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Avg Price</th>
                    <th style={styles.th}>LTP</th>
                    <th style={styles.th}>P&L</th>
                    <th style={styles.th}>Time</th>
                </tr>
            </thead>
            <tbody>
                {positions.map((pos) => {
                    const ltp = livePrices[pos.symbol] || 0;
                    const pnl = ltp !== 0 ? (ltp - pos.avgPrice) * pos.qty : 0;
                    const type = pos.qty > 0 ? 'BUY' : 'SELL';
                    return (
                        <tr key={pos.symbol} style={styles.tr}>
                            <td style={styles.td}>{pos.symbol}</td>
                            <td style={{ ...styles.td, fontWeight: 'bold', color: type === 'BUY' ? '#22c55e' : '#ef4444' }}>{type}</td>
                            <td style={{ ...styles.td, color: pos.qty > 0 ? '#22c55e' : '#ef4444' }}>{pos.qty}</td>
                            <td style={styles.td}>{pos.avgPrice.toFixed(2)}</td>
                            <td style={styles.td}>{ltp ? ltp.toFixed(2) : 'Waiting...'}</td>
                            <td style={{ ...styles.td, fontWeight: 'bold', color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                                {pnl.toFixed(2)}
                            </td>
                            <td style={styles.td}>{pos.timestamp ? new Date(pos.timestamp).toLocaleTimeString() : '-'}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

const OrdersTable = ({ orders }) => {
    if (!orders?.length) return <EmptyState msg="No orders found" />;
    return (
        <table style={styles.table}>
            <thead>
                <tr style={styles.thRow}>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Symbol</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Status</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                    <tr key={order.orderId} style={styles.tr}>
                        <td style={styles.td}>{new Date(order.timestamp).toLocaleTimeString()}</td>
                        <td style={styles.td}>{order.symbol}</td>
                        <td style={{ ...styles.td, fontWeight: 'bold', color: order.type === 'BUY' ? '#22c55e' : '#ef4444' }}>{order.type}</td>
                        <td style={styles.td}>{order.qty}</td>
                        <td style={styles.td}>{order.price.toFixed(2)}</td>
                        <td style={styles.td}><span style={styles.badge}>{order.status}</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const TradebookTable = ({ trades }) => {
    if (!trades?.length) return <EmptyState msg="No trades executed" />;
    return (
        <table style={styles.table}>
            <thead>
                <tr style={styles.thRow}>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Symbol</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Order ID</th>
                </tr>
            </thead>
            <tbody>
                {trades.map((trade) => (
                    <tr key={trade.tradeId} style={styles.tr}>
                        <td style={styles.td}>{new Date(trade.timestamp).toLocaleTimeString()}</td>
                        <td style={styles.td}>{trade.symbol}</td>
                        <td style={{ ...styles.td, fontWeight: 'bold', color: trade.type === 'BUY' ? '#22c55e' : '#ef4444' }}>{trade.type}</td>
                        <td style={styles.td}>{trade.qty}</td>
                        <td style={styles.td}>{trade.price.toFixed(2)}</td>
                        <td style={{ ...styles.td, fontSize: '0.8rem', opacity: 0.7 }}>{trade.orderId.substring(0, 8)}...</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const EmptyState = ({ msg }) => (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        {msg}
    </div>
);

const styles = {
    header: { marginBottom: '2rem' },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
    tabsHeader: { display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' },
    tab: { flex: 1, padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
    tableContainer: { overflowX: 'auto', minHeight: '300px' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
    thRow: { borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)' },
    th: { padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 },
    tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
    td: { padding: '1rem' },
    badge: { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }
};
