import Dexie from 'dexie';

export const db = new Dexie('PaperTradeDB');

// Define Schema
db.version(1).stores({
    funds: 'id, amount, realizedPnl, totalTrades', // Single row id='main'
    orders: 'orderId, symbol, type, qty, price, status, timestamp',
    positions: 'symbol, qty, avgPrice, realizedPnl, timestamp',
    trades: 'tradeId, orderId, symbol, qty, price, timestamp'
});

// Seed Initial Funds
export const seedDatabase = async () => {
    try {
        const fundsExist = await db.funds.get('main');
        if (!fundsExist) {
            await db.funds.add({
                id: 'main',
                amount: 100000, // ₹1,00,000
                realizedPnl: 0,
                totalTrades: 0
            });
            console.log("Database Seeded: Funds set to ₹1,00,000");
        }
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
