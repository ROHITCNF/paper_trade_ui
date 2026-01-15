"use client";
import { useEffect, useState } from "react";
import { watchlist } from "../utils/constants";
import { getCookie } from "../utils/helpers";
import { VictoryChart, VictoryCandlestick, VictoryAxis, VictoryTooltip, VictoryTheme } from "victory";
import OrderModal from "../../components/OrderModal";

export default function WatchlistPage() {
    const stockSymbols = watchlist['F&O_Stcoks'];
    const [quotes, setQuotes] = useState({});
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loadingChart, setLoadingChart] = useState(false);

    // Order Modal State
    const [orderModalStock, setOrderModalStock] = useState(null);
    const [orderSide, setOrderSide] = useState('BUY');

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const { fyersModel } = await import("fyers-web-sdk-v3");
                const fyers = new fyersModel();
                const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;
                fyers.setAppId(appId);
                fyers.setAccessToken(getCookie('fyers_access_token'));

                const response = await fyers.getQuotes(stockSymbols); // Pass array directly
                if (response?.code === 200) {
                    const quotesMap = {};
                    response.d.forEach(quote => { quotesMap[quote.n] = quote.v; });
                    setQuotes(quotesMap);

                    // Defaults
                    if (!selectedSymbol) {
                        setSelectedSymbol(stockSymbols[0]);
                        handleStockClick(stockSymbols[0]);
                    }
                }
            } catch (err) {
                console.error("Error fetching quotes:", err);
            }
        };
        fetchQuotes();
    }, []);

    const handleStockClick = async (symbol) => {
        setSelectedSymbol(symbol);
        setLoadingChart(true);
        setChartData([]);
        try {
            const { fyersModel } = await import("fyers-web-sdk-v3");
            const fyers = new fyersModel();
            const appId = getCookie('fyers_app_id') || process.env.NEXT_PUBLIC_APP_ID;
            fyers.setAppId(appId);
            fyers.setAccessToken(getCookie('fyers_access_token'));

            const toDate = Math.floor(Date.now() / 1000);
            const fromDate = toDate - (30 * 24 * 60 * 60);

            const input = {
                symbol: symbol,
                resolution: "D",
                date_format: "0",
                range_from: fromDate.toString(),
                range_to: toDate.toString(),
                cont_flag: "1"
            };

            const response = await fyers.getHistory(input);
            if (response.s === "ok" && response.candles) {
                const formattedData = response.candles.map(c => ({
                    x: new Date(c[0] * 1000),
                    open: c[1], high: c[2], low: c[3], close: c[4]
                }));
                setChartData(formattedData);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoadingChart(false);
        }
    };

    const openOrderModal = (e, symbol, side) => {
        e.stopPropagation(); // Prevent triggering row click
        setOrderModalStock(symbol);
        setOrderSide(side);
    };

    const formatPrice = (val) => val?.toFixed(2) || '0.00';

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', display: 'flex', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>

            {/* Modal */}
            {orderModalStock && (
                <OrderModal
                    symbol={orderModalStock}
                    side={orderSide}
                    onClose={() => setOrderModalStock(null)}
                />
            )}

            {/* Left Panel - Watchlist (30%) */}
            <div className="glass-panel" style={{ flex: '3', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>F&O Watchlist</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {stockSymbols.map((symbol, index) => {
                        const data = quotes[symbol];
                        const isPositive = data?.ch >= 0;
                        const changeColor = isPositive ? '#22c55e' : '#ef4444';
                        const isSelected = selectedSymbol === symbol;

                        return (
                            <div key={index}
                                onClick={() => handleStockClick(symbol)}
                                className="watchlist-item"
                                style={{
                                    padding: '0.75rem', borderRadius: '8px',
                                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                                    cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    position: 'relative', // For absolute positioning of buttons
                                    overflow: 'hidden'    // To hide buttons initially? No, we use CSS group hover
                                }}
                            >
                                {/* Left: Symbol & Exchange */}
                                <div>
                                    <div style={{ fontWeight: '600' }}>{symbol.replace('NSE:', '').replace('-EQ', '')}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data?.exchange || 'NSE'}</div>
                                </div>

                                {/* Right: Price Info (Hidden on Hover via CSS or conditional rendering) */}
                                <div className="price-info" style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '600' }}>{data ? `₹${formatPrice(data.lp)}` : '-'}</div>
                                    <div style={{ fontSize: '0.75rem', color: changeColor }}>
                                        {data ? `${formatPrice(data.ch)} (${data?.chp?.toFixed(2)}%)` : '-'}
                                    </div>
                                </div>

                                {/* Order Buttons (Only visible on hover) */}
                                <div className="order-buttons" style={{ position: 'absolute', right: '0.5rem', display: 'none', gap: '0.5rem' }}>
                                    <button
                                        onClick={(e) => openOrderModal(e, symbol, 'BUY')}
                                        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                        B
                                    </button>
                                    <button
                                        onClick={(e) => openOrderModal(e, symbol, 'SELL')}
                                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                        S
                                    </button>
                                </div>

                                {/* Inline Style for Hover Effect (Since we can't keyframe easily here, we use class names and global css or inline style injection) */}
                                <style jsx>{`
                                    .watchlist-item:hover .price-info { display: none; }
                                    .watchlist-item:hover .order-buttons { display: flex !important; }
                                `}</style>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Panel - Chart (70%) */}
            <div className="glass-panel" style={{ flex: '7', display: 'flex', flexDirection: 'column', padding: '2rem', position: 'relative' }}>
                {selectedSymbol ? (
                    <>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{selectedSymbol.replace('NSE:', '').replace('-EQ', '')}</h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Daily Chart (Last 30 Days)</div>
                        </div>

                        {loadingChart ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                Loading Chart Data...
                            </div>
                        ) : chartData.length > 0 ? (
                            <div style={{ width: '100%', height: '100%' }}>
                                <VictoryChart
                                    theme={VictoryTheme.material}
                                    domainPadding={{ x: 20, y: 40 }}
                                    scale={{ x: "time" }}
                                    padding={{ top: 20, bottom: 50, left: 50, right: 50 }}
                                    width={800} height={400}
                                >
                                    <VictoryAxis
                                        tickFormat={(t) => `${t.getDate()}/${t.getMonth() + 1}`}
                                        style={{
                                            axis: { stroke: "rgba(255,255,255,0.1)" },
                                            tickLabels: { fill: "var(--text-secondary)", fontSize: 10 },
                                            grid: { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "4,4" }
                                        }}
                                    />
                                    <VictoryAxis dependentAxis style={{
                                        axis: { stroke: "rgba(255,255,255,0.1)" },
                                        tickLabels: { fill: "var(--text-secondary)", fontSize: 10 },
                                        grid: { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "4,4" }
                                    }}
                                    />
                                    <VictoryCandlestick
                                        data={chartData}
                                        style={{ data: { fill: ({ datum }) => datum.close > datum.open ? "#22c55e" : "#ef4444", stroke: ({ datum }) => datum.close > datum.open ? "#22c55e" : "#ef4444", strokeWidth: 1 } }}
                                        labels={({ datum }) => `Date: ${datum.x.toLocaleDateString()}\nOpen: ${datum.open}\nHigh: ${datum.high}\nLow: ${datum.low}\nClose: ${datum.close}`}
                                        labelComponent={
                                            <VictoryTooltip flyoutStyle={{ fill: "#1e1e1e", stroke: "#333", strokeWidth: 1, filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.5))" }} style={{ fill: "#f0f0f0", fontSize: 11, fontFamily: "Inter, sans-serif", textAnchor: "start" }} pointerLength={10} cornerRadius={5} flyoutPadding={12} />
                                        }
                                    />
                                </VictoryChart >
                            </div >
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                No history data available
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Select a stock from the watchlist</p>
                    </div>
                )}
            </div >
        </div >
    );
}
