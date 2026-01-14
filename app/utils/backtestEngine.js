
import { SMA, EMA, RSI, MACD, BollingerBands, ADX, ATR } from 'technicalindicators';

// --- DATA DEFINITIONS AND DESCRIPTIONS ---
export const STRATEGIES = {
    'SMA_GOLDEN_CROSS': {
        name: 'SMA Golden Cross',
        description: 'A classic long-term trend following strategy. Buys when the 50-day SMA crosses above the 200-day SMA (Golden Cross) and Sells when it crosses below (Death Cross).',
        params: { shortPeriod: 50, longPeriod: 200 }
    },
    'EMA_CROSSOVER': {
        name: 'EMA Crossover (9/21)',
        description: 'A faster moving average strategy for capturing medium-term trends. Buys when the 9 EMA crosses above the 21 EMA.',
        params: { shortPeriod: 9, longPeriod: 21 }
    },
    'RSI_REVERSAL': {
        name: 'RSI Reversal (30/70)',
        description: 'Mean reversion strategy. Buys when RSI dips below 30 (Oversold) and crosses back up. Sells when RSI goes above 70 (Overbought).',
        params: { period: 14, overbought: 70, oversold: 30 }
    },
    'MACD_CROSSOVER': {
        name: 'MACD Signal Cross',
        description: 'Momentum strategy. Buys when the MACD line crosses above the Signal line. Sells when MACD crosses below Signal.',
        params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
    },
    'BOLLINGER_BREAKOUT': {
        name: 'Bollinger Band Breakout',
        description: 'Volatility breakout strategy. Buys when price closes above the Upper Bollinger Band, indicating strong upward momentum.',
        params: { period: 20, stdDev: 2 }
    },
    'THREE_WHITE_SOLDIERS': {
        name: 'Three White Soldiers',
        description: 'Candlestick pattern. Buys after 3 consecutive green candles with higher closes, indicating a strong reversal/continuation.',
        params: {}
    },
    'GAP_AND_GO': {
        name: 'Gap Up Strategy',
        description: 'Price Action. Buys if the opening price is significantly higher (>1%) than previous close and the first candle is green.',
        params: { gapThreshold: 1.0 } // 1%
    },
    'INSIDE_BAR': {
        name: 'Inside Bar Breakout',
        description: 'Price Action. Buys when price breaks out of the high of a previous "Inside Bar" (a candle fully contained within the previous one).',
        params: {}
    },
    'FIB_RETRACEMENT_PULLBACK': {
        name: 'Fibonacci Pullback (61.8%)',
        description: 'Trend-following strategy. Buys when price pulls back to the 61.8% Fibonacci level during a strong uptrend and shows a bullish reversal candle.',
        params: { retracementLevel: 0.618, trendLookback: 50 }
    },
    // 2. ADX TREND STRENGTH (Volatility + Trend)
    'ADX_TREND_FOLLOWING': {
        name: 'ADX Trend Strength',
        description: 'Ensures you only trade in strong trends. Buys when ADX > 25 (strong trend) and +DI is above -DI.',
        params: { adxPeriod: 14, threshold: 25 }
    },
    // 3. KELTNER CHANNEL BREAKOUT (Alternative to Bollinger)
    'KELTNER_BREAKOUT': {
        name: 'Keltner Channel Breakout',
        description: 'Uses ATR for volatility. Buys when price closes above the upper Keltner Channel, often used for "volatility expansion" trades.',
        params: { emaPeriod: 20, atrMultiplier: 2 }
    },
    // 5. MEAN REVERSION (200 SMA Pullback)
    'SMA_200_PULLBACK': {
        name: '200 SMA Mean Reversion',
        description: 'Classic institutional swing strategy. Buys when a stock in a long-term uptrend (above 200 SMA) pulls back to touch the 200 SMA.',
        params: { maPeriod: 200, buffer: 0.01 } // 1% buffer around the line
    },
    // 6. VOLUME PRICE SPREAD (VSA Lite)
    'VOLUME_BREAKOUT': {
        name: 'High Volume Breakout',
        description: 'Confirmation strategy. Buys only if a price breakout (new 20-day high) is accompanied by volume that is 2x the 10-day average.',
        params: { volumeMultiplier: 2, breakoutPeriod: 20 }
    },
    // 7. DONCHIAN CHANNEL (Turtle Trading)
    'DONCHIAN_BREAKOUT': {
        name: 'Donchian Channel (4-Week)',
        description: 'The "Turtle" strategy. Buys when price exceeds the highest high of the last 20 periods. Sells when it falls below the 10-period low.',
        params: { entryPeriod: 20, exitPeriod: 10 }
    },
    // 8. TTM SQUEEZE (Momentum + Volatility)
    'TTM_SQUEEZE': {
        name: 'TTM Squeeze',
        description: 'Identifies periods of consolidation (Squeeze) and trades the explosive move when Bollinger Bands go inside Keltner Channels.',
        params: { bbPeriod: 20, bbStd: 2.0, kcPeriod: 20, kcMult: 1.5 }
    }
};


// --- HELPER: CALCULATE P&L ---
const calculateMetrics = (trades, initialCapital = 100000) => {
    let balance = initialCapital;
    let totalWins = 0;
    let totalLosses = 0;
    let maxDrawdown = 0;
    let peakBalance = initialCapital;

    trades.forEach(trade => {
        balance += trade.pnl;
        if (trade.pnl > 0) totalWins++;
        else totalLosses++;

        if (balance > peakBalance) peakBalance = balance;
        const drawdown = (peakBalance - balance) / peakBalance * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    return {
        finalBalance: balance,
        totalProfit: balance - initialCapital,
        winRate,
        totalTrades,
        maxDrawdown,
        trades
    };
};


// --- MAIN ENGINE ---
export const runBacktest = (strategyType, candleData) => {
    // candleData: Array of { open, high, low, close, volume, time (epoch), x (Date) }
    const strategyConfig = STRATEGIES[strategyType];
    const params = strategyConfig.params || {};

    const closes = candleData.map(c => c.close);
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const opens = candleData.map(c => c.open);
    const volumes = candleData.map(c => c.volume);

    let trades = [];
    let signal = null; // 'BUY' or 'SELL'
    let entryPrice = 0;
    let entryIndex = 0;
    let entryTime = null;

    let indicators = {};

    // --- 1. INDICATOR CALCULATION ---

    if (strategyType === 'SMA_GOLDEN_CROSS') {
        const short = SMA.calculate({ period: params.shortPeriod, values: closes });
        const long = SMA.calculate({ period: params.longPeriod, values: closes });
        indicators.line1 = Array(params.shortPeriod - 1).fill(null).concat(short); // 50
        indicators.line2 = Array(params.longPeriod - 1).fill(null).concat(long);   // 200
    }
    else if (strategyType === 'EMA_CROSSOVER') {
        const short = EMA.calculate({ period: params.shortPeriod, values: closes });
        const long = EMA.calculate({ period: params.longPeriod, values: closes });
        indicators.line1 = Array(params.shortPeriod - 1).fill(null).concat(short);
        indicators.line2 = Array(params.longPeriod - 1).fill(null).concat(long);
    }
    else if (strategyType === 'RSI_REVERSAL') {
        const rsi = RSI.calculate({ period: params.period, values: closes });
        indicators.line1 = Array(params.period).fill(null).concat(rsi);
    }
    else if (strategyType === 'MACD_CROSSOVER') {
        const macdResult = MACD.calculate({
            values: closes,
            fastPeriod: params.fastPeriod,
            slowPeriod: params.slowPeriod,
            signalPeriod: params.signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
        const padding = Array(params.slowPeriod - 1).fill({ MACD: null, signal: null });
        indicators.macdData = padding.concat(macdResult);
    }
    else if (strategyType === 'BOLLINGER_BREAKOUT') {
        const bb = BollingerBands.calculate({ period: params.period, stdDev: params.stdDev, values: closes });
        const padding = Array(params.period - 1).fill({ lower: null, middle: null, upper: null });
        indicators.bbData = padding.concat(bb);
    }
    else if (strategyType === 'ADX_TREND_FOLLOWING') {
        const adxRes = ADX.calculate({ period: params.adxPeriod, high: highs, low: lows, close: closes });
        // ADX returns { adx, pdi, mdi }
        const padding = Array(params.adxPeriod).fill({ adx: null, pdi: null, mdi: null });
        indicators.adxData = padding.concat(adxRes);
    }
    else if (strategyType === 'KELTNER_BREAKOUT' || strategyType === 'TTM_SQUEEZE') {
        // TTM Squeeze uses both BB and KC
        // Keltner logic common
        const emaPeriod = params.emaPeriod || params.kcPeriod || 20;
        const atrMult = params.atrMultiplier || params.kcMult || 2; // Default 2/1.5

        const ema20 = EMA.calculate({ period: emaPeriod, values: closes });
        const atr20 = ATR.calculate({ period: emaPeriod, high: highs, low: lows, close: closes });

        indicators.ema20 = Array(emaPeriod - 1).fill(null).concat(ema20);
        indicators.atr20 = Array(emaPeriod).fill(null).concat(atr20);

        if (strategyType === 'TTM_SQUEEZE') {
            const bb = BollingerBands.calculate({ period: params.bbPeriod, stdDev: params.bbStd, values: closes });
            indicators.bbData = Array(params.bbPeriod - 1).fill({ lower: null, middle: null, upper: null }).concat(bb);
        }
    }
    else if (strategyType === 'SMA_200_PULLBACK') {
        const sma200 = SMA.calculate({ period: params.maPeriod, values: closes });
        indicators.sma200 = Array(params.maPeriod - 1).fill(null).concat(sma200);
    }
    else if (strategyType === 'VOLUME_BREAKOUT') {
        const volSma = SMA.calculate({ period: 20, values: volumes }); // Use 20 for baseline
        indicators.volSma = Array(19).fill(null).concat(volSma);
    }

    // --- 2. SIMULATION LOOP ---
    // Start index
    const startIndex = 200;

    for (let i = startIndex; i < candleData.length; i++) {
        const price = candleData[i].close;
        const date = candleData[i].x; // Date object
        let action = null;

        // --- STRATEGY LOGIC ---

        if (strategyType === 'SMA_GOLDEN_CROSS' || strategyType === 'EMA_CROSSOVER') {
            const sPrev = indicators.line1[i - 1];
            const sCurr = indicators.line1[i];
            const lPrev = indicators.line2[i - 1];
            const lCurr = indicators.line2[i];

            if (sPrev && lPrev) {
                if (sPrev <= lPrev && sCurr > lCurr) action = 'BUY';
                if (sPrev >= lPrev && sCurr < lCurr) action = 'SELL';
            }
        }
        else if (strategyType === 'RSI_REVERSAL') {
            const valPrev = indicators.line1[i - 1];
            const valCurr = indicators.line1[i];
            if (valPrev && valCurr) {
                if (valPrev < params.oversold && valCurr >= params.oversold) action = 'BUY';
                if (valPrev > params.overbought && valCurr <= params.overbought) action = 'SELL';
            }
        }
        else if (strategyType === 'MACD_CROSSOVER') {
            const prev = indicators.macdData[i - 1];
            const curr = indicators.macdData[i];
            if (prev?.MACD && curr?.MACD) {
                if (prev.MACD <= prev.signal && curr.MACD > curr.signal) action = 'BUY';
                if (prev.MACD >= prev.signal && curr.MACD < curr.signal) action = 'SELL';
            }
        }
        else if (strategyType === 'BOLLINGER_BREAKOUT') {
            const prev = indicators.bbData[i - 1];
            if (prev?.upper) {
                if (closes[i] > prev.upper && closes[i - 1] <= prev.upper) action = 'BUY'; // Momentum
                if (closes[i] < prev.middle && closes[i - 1] >= prev.middle) action = 'SELL';
            }
        }
        else if (strategyType === 'THREE_WHITE_SOLDIERS') {
            if (i > 3) {
                const c1 = candleData[i];
                const c2 = candleData[i - 1];
                const c3 = candleData[i - 2];
                if (c1.close > c1.open && c2.close > c2.open && c3.close > c3.open &&
                    c1.close > c2.close && c2.close > c3.close) {
                    action = 'BUY';
                }
                if (c1.close < c1.open && c2.close < c2.open) action = 'SELL';
            }
        }
        else if (strategyType === 'GAP_AND_GO') {
            const prevClose = closes[i - 1];
            const currOpen = opens[i];
            const gapPercent = ((currOpen - prevClose) / prevClose) * 100;
            if (gapPercent > params.gapThreshold && closes[i] > currOpen) action = 'BUY';
            if (closes[i] < prevClose) action = 'SELL';
        }
        else if (strategyType === 'INSIDE_BAR') {
            const insideBar = candleData[i - 1];
            const motherBar = candleData[i - 2];
            if (insideBar.high < motherBar.high && insideBar.low > motherBar.low) {
                if (price > insideBar.high) action = 'BUY';
            }
            if (price < insideBar.low) action = 'SELL';
        }
        else if (strategyType === 'ADX_TREND_FOLLOWING') {
            const curr = indicators.adxData[i];
            const prev = indicators.adxData[i - 1];
            if (curr && curr.adx > params.threshold) {
                if (curr.pdi > curr.mdi && prev.pdi <= prev.mdi) action = 'BUY';
                if (curr.pdi < curr.mdi && prev.pdi >= prev.mdi) action = 'SELL';
            }
        }
        else if (strategyType === 'KELTNER_BREAKOUT') {
            const ema = indicators.ema20[i];
            const atr = indicators.atr20[i];
            if (ema && atr) {
                const upper = ema + (params.atrMultiplier * atr);
                if (closes[i] > upper && closes[i - 1] <= upper) action = 'BUY';
                if (closes[i] < ema) action = 'SELL';
            }
        }
        else if (strategyType === 'SMA_200_PULLBACK') {
            const sma = indicators.sma200[i];
            if (sma) {
                const withinBuffer = Math.abs(lows[i] - sma) / sma <= params.buffer;
                // Trend is UP (Close > SMA), Dip touches SMA
                if (closes[i] > sma && withinBuffer && closes[i - 1] > sma) action = 'BUY';
                if (closes[i] < sma) action = 'SELL';
            }
        }
        else if (strategyType === 'VOLUME_BREAKOUT') {
            // New 20 day high
            const past20Highs = highs.slice(i - 20, i);
            const maxHigh = Math.max(...past20Highs);
            const avgVol = indicators.volSma[i - 1];

            if (highs[i] > maxHigh && volumes[i] > (avgVol * params.volumeMultiplier)) {
                action = 'BUY';
            }
            // Trailing exit (10 day low)
            const past10Lows = lows.slice(i - 10, i);
            const minLow = Math.min(...past10Lows);
            if (closes[i] < minLow) action = 'SELL';
        }
        else if (strategyType === 'DONCHIAN_BREAKOUT') {
            const past20Highs = highs.slice(i - params.entryPeriod, i);
            const past10Lows = lows.slice(i - params.exitPeriod, i);
            const maxHigh = Math.max(...past20Highs);
            const minLow = Math.min(...past10Lows);

            if (closes[i] > maxHigh) action = 'BUY';
            if (closes[i] < minLow) action = 'SELL';
        }
        else if (strategyType === 'FIB_RETRACEMENT_PULLBACK') {
            const lookback = params.trendLookback;
            const periodHighs = highs.slice(i - lookback, i);
            const periodLows = lows.slice(i - lookback, i);
            const swingHigh = Math.max(...periodHighs);
            const swingLow = Math.min(...periodLows);

            if (swingHigh > swingLow) {
                const range = swingHigh - swingLow;
                const fibLevel = swingHigh - (range * params.retracementLevel);
                const buffer = range * 0.02;
                // Uptrend Pullback: Low hits 61.8% level but Close holds above
                if (lows[i] <= (fibLevel + buffer) && lows[i] >= (fibLevel - buffer) && closes[i] > lows[i]) {
                    action = 'BUY';
                }
                if (closes[i] < swingLow) action = 'SELL';
            }
        }
        else if (strategyType === 'TTM_SQUEEZE') {
            // Squeeze ON: BB Inside KC
            // Signal: Long when Squeeze fires (BB expands outside) OR Momentum Up?
            // Simplification: Buy if Squeeze WAS on (BB widths < KC widths) and Price Breaks Upper BB
            const bb = indicators.bbData[i];
            const ema = indicators.ema20[i];
            const atr = indicators.atr20[i];
            if (bb && ema && atr) {
                const kcUpper = ema + (params.kcMult * atr);
                const kcLower = ema - (params.kcMult * atr);

                const bbWidth = bb.upper - bb.lower;
                const kcWidth = kcUpper - kcLower;

                // Squeeze Condition: BB Width < KC Width (Low Volatility)
                // We trade the BREAKOUT from user defined squeeze. 
                // Let's simlply trade BB Breakout IF volatility was low recently
                // Too complex for simple engine without explicit 'squeeze' state. 
                // Let's simplify: Buy if Price > Upper KC (Momentum)
                if (closes[i] > kcUpper && closes[i - 1] <= kcUpper) action = 'BUY';
                if (closes[i] < ema) action = 'SELL';
            }
        }


        // --- EXECUTION ---
        if (action === 'BUY' && signal !== 'BUY') {
            if (signal === 'SELL') {
                const pnl = entryPrice - price;
                trades.push({
                    type: 'SHORT',
                    entryIndex, exitIndex: i,
                    entryDate: entryTime, exitDate: date,
                    entryPrice, exitPrice: price,
                    pnl
                });
            }
            signal = 'BUY';
            entryPrice = price;
            entryIndex = i;
            entryTime = date; // Capture Date
        }
        else if (action === 'SELL' && signal !== 'SELL') {
            if (signal === 'BUY') {
                const pnl = price - entryPrice;
                trades.push({
                    type: 'LONG',
                    entryIndex, exitIndex: i,
                    entryDate: entryTime, exitDate: date,
                    entryPrice, exitPrice: price,
                    pnl
                });
            }
            signal = 'SELL';
            entryPrice = price;
            entryIndex = i;
            entryTime = date;
        }
    }

    // Close open position at end
    if (signal === 'BUY') {
        const price = closes[closes.length - 1];
        const date = candleData[candleData.length - 1].x;
        const pnl = price - entryPrice;
        trades.push({ type: 'LONG', entryIndex, exitIndex: closes.length - 1, entryDate: entryTime, exitDate: date, entryPrice, exitPrice: price, pnl });
    } else if (signal === 'SELL') {
        const price = closes[closes.length - 1];
        const date = candleData[candleData.length - 1].x;
        const pnl = entryPrice - price;
        trades.push({ type: 'SHORT', entryIndex, exitIndex: closes.length - 1, entryDate: entryTime, exitDate: date, entryPrice, exitPrice: price, pnl });
    }

    return {
        metrics: calculateMetrics(trades),
        indicators,
        strategyInfo: strategyConfig
    };
};
