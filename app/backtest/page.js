export default function BacktestPage() {
    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Backtest Strategies</h1>
            <div className="glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Backtesting Engine UI</p>
            </div>
        </div>
    );
}



// "use client";
// import React from 'react';
// import { VictoryBar, VictoryChart, VictoryTheme } from "victory";

// const data = [
//     { quarter: 1, earnings: 13000 },
//     { quarter: 2, earnings: 16500 },
//     { quarter: 3, earnings: 14250 },
//     { quarter: 4, earnings: 19000 }
// ];

// const BacktestPage = () => {
//     return (
//         <div style={styles.container}>
//             <VictoryChart width={350} theme={VictoryTheme.clean}>
//                 <VictoryBar data={data} x="quarter" y="earnings" />
//             </VictoryChart>
//         </div>
//     );
// }

// export default BacktestPage;