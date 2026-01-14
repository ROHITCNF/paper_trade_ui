"use client";
import React, { useState } from 'react';
import { VictoryChart, VictoryCandlestick, VictoryLine, VictoryAxis, VictoryScatter, VictoryTheme, VictoryTooltip } from "victory";
import { watchlist } from "../utils/constants";
import { getCookie } from "../utils/helpers";
import { runBacktest, STRATEGIES } from "../utils/backtestEngine";

export default function BacktestPage() {
    // --- State ---
    const stocks = watchlist['F&O_Stcoks'];
    const [selectedStock, setSelectedStock] = useState(stocks[0]);
    const [strategy, setStrategy] = useState('SMA_GOLDEN_CROSS');
    // Removed params state since we use hardcoded defaults now

    const [candleData, setCandleData] = useState([]);
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Actions ---
    const handleRunBacktest = async () => {
        setIsLoading(true);
        setResults(null);
        try {
            // 1. Fetch History
            const { fyersModel } = await import("fyers-web-sdk-v3");
            const fyers = new fyersModel();
            const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;
            fyers.setAppId(appId);
            fyers.setAccessToken(getCookie('fyers_access_token'));

            const toDate = Math.floor(Date.now() / 1000);
            const fromDate = toDate - (365 * 24 * 60 * 60); // Last 365 Days 

            const input = {
                symbol: selectedStock,
                resolution: "D",
                date_format: "0",
                range_from: fromDate.toString(),
                range_to: toDate.toString(),
                cont_flag: "1"
            };

            const response = await fyers.getHistory(input);

            if (response.s === "ok" && response.candles) {
                // Format for Engine & Chart
                const data = response.candles.map(c => ({
                    time: c[0],
                    x: new Date(c[0] * 1000),
                    open: c[1],
                    high: c[2],
                    low: c[3],
                    close: c[4],
                    volume: c[5]
                }));
                setCandleData(data);

                // 2. Run Engine (No params passed, uses defaults)
                const backtestResults = runBacktest(strategy, data);
                setResults(backtestResults);
                console.log("Results:", backtestResults);
            } else {
                alert("Failed to fetch historical data for backtest. Check Fyers content permissions.");
            }

        } catch (error) {
            console.error(error);
            alert("Error running backtest: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Main Layout ---
    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', display: 'flex', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>

            {/* LEFT PANEL: CONFIG */}
            <div className="glass-panel" style={{ flex: '3', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={styles.header}>Strategy Config</h2>

                <div style={styles.inputGroup}>
                    <label>Select Stock</label>
                    <select value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)} style={styles.select}>
                        {stocks.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div style={styles.inputGroup}>
                    <label>Strategy</label>
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={styles.select}>
                        {Object.keys(STRATEGIES).map(key => (
                            <option key={key} value={key}>{STRATEGIES[key].name}</option>
                        ))}
                    </select>
                </div>

                {/* Strategy Description Box */}
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>About Strategy</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {STRATEGIES[strategy].description}
                    </p>
                </div>

                <button onClick={handleRunBacktest} className="btn-primary" disabled={isLoading} style={{ marginTop: 'auto' }}>
                    {isLoading ? 'Running Simulation...' : 'Run Backtest'}
                </button>
            </div>


            {/* RIGHT PANEL: RESULTS */}
            <div className="glass-panel" style={{ flex: '7', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {!results ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Select a stock and strategy to begin backtesting
                    </div>
                ) : (
                    <>
                        {/* Metrics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <MetricCard label="Net Profit" value={`₹${results.metrics.totalProfit.toFixed(2)}`} color={results.metrics.totalProfit >= 0 ? '#22c55e' : '#ef4444'} />
                            <MetricCard label="Win Rate" value={`${results.metrics.winRate.toFixed(1)}%`} />
                            <MetricCard label="Max Drawdown" value={`${results.metrics.maxDrawdown.toFixed(2)}%`} color="#ef4444" />
                            <MetricCard label="Total Trades" value={results.metrics.totalTrades} />
                        </div>

                        {/* Chart Area */}
                        <div style={{ height: '400px', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem' }}>
                            <VictoryChart theme={VictoryTheme.material} scale={{ x: "time" }} width={800} height={350}
                                domainPadding={{ x: 10, y: 20 }}>
                                <VictoryAxis style={{ axis: { stroke: "#555" }, tickLabels: { fill: "#888", fontSize: 10 } }} />
                                <VictoryAxis dependentAxis style={{ axis: { stroke: "#555" }, tickLabels: { fill: "#888", fontSize: 10 } }} />

                                {/* Price Candles */}
                                <VictoryCandlestick
                                    data={candleData}
                                    candleColors={{ positive: "#22c55e", negative: "#ef4444" }}
                                    style={{ data: { strokeWidth: 1 } }}
                                />

                                {/* Visualization for SMA/EMA/Bollinger only */}
                                {(strategy.includes('SMA') || strategy.includes('EMA')) && results.indicators.line1 && results.indicators.line2 && (
                                    <>
                                        <VictoryLine data={formatIndicatorData(candleData, results.indicators.line1)} style={{ data: { stroke: '#38bdf8', strokeWidth: 1 } }} />
                                        <VictoryLine data={formatIndicatorData(candleData, results.indicators.line2)} style={{ data: { stroke: '#fbbf24', strokeWidth: 1 } }} />
                                    </>
                                )}
                                {strategy === 'BOLLINGER_BREAKOUT' && results.indicators.bbData && (
                                    <>
                                        <VictoryLine data={formatIndicatorData(candleData, results.indicators.bbData.map(d => d?.upper))} style={{ data: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, strokeDasharray: '4,4' } }} />
                                        <VictoryLine data={formatIndicatorData(candleData, results.indicators.bbData.map(d => d?.lower))} style={{ data: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, strokeDasharray: '4,4' } }} />
                                    </>
                                )}

                                {/* Buy/Sell Signals Scatter */}
                                <VictoryScatter
                                    data={getSignalPoints(results.metrics.trades, candleData)}
                                    size={5}
                                    style={{ data: { fill: ({ datum }) => datum.type === 'BUY' ? '#22c55e' : '#ef4444' } }}
                                />
                            </VictoryChart>
                        </div>

                        {/* Trade Log */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>Trade Log</h3>
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                                            <th style={{ padding: '0.5rem' }}>Entry Date</th>
                                            <th style={{ padding: '0.5rem' }}>Entry Price</th>
                                            <th style={{ padding: '0.5rem' }}>Exit Date</th>
                                            <th style={{ padding: '0.5rem' }}>Exit Price</th>
                                            <th style={{ padding: '0.5rem' }}>P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.metrics.trades.map((trade, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: trade.type.includes('LONG') ? '#22c55e' : '#ef4444' }}>
                                                    {trade.type}
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>{trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : '-'}</td>
                                                <td style={{ padding: '0.5rem' }}>₹{trade.entryPrice.toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem' }}>{trade.entryDate ? new Date(trade.exitDate).toLocaleDateString() : '-'}</td>
                                                <td style={{ padding: '0.5rem' }}>₹{trade.exitPrice.toFixed(2)}</td>
                                                <td style={{ padding: '0.5rem', fontWeight: 'bold', color: trade.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                                                    ₹{trade.pnl.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// --- Sub-components & Styles ---
const MetricCard = ({ label, value, color }) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
);

// Helper to align indicator array with dates for Victory
const formatIndicatorData = (candles, indicatorValues) => {
    if (!indicatorValues) return [];
    return candles.map((c, i) => ({ x: c.x, y: indicatorValues[i] })).filter(p => p.y !== null && p.y !== undefined);
};

// Helper to create scatter points for trades
const getSignalPoints = (trades, candles) => {
    let points = [];
    trades.forEach(t => {
        // Entry Point
        if (candles[t.entryIndex]) {
            points.push({ x: candles[t.entryIndex].x, y: t.entryPrice, type: t.type === 'LONG' ? 'BUY' : 'SELL' });
        }
    });
    return points;
};

const styles = {
    header: { fontSize: '1.25rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' },
    inputGroup: { marginBottom: '1rem' },
    select: { width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.9rem' }
};
