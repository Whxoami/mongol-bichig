// All business settings live here. Change a number, push, and the site updates.
export const PLANS = {
  '1m':  { id: '1m',  days: 30,  price: 6999 },
  '3m':  { id: '3m',  days: 90,  price: 17430 },   // about 17% off 3 x 6,999
  '12m': { id: '12m', days: 365, price: 67190 },   // 20% off 12 x 6,999
};
export const FREE_WORDS = 200;            // words allowed in one free conversion
export const PAID_WORDS = 3000;           // words allowed in one paid conversion
export const PAID_DAILY_WORDS = 20000;    // per code per day, stops bulk copying
export const FREE_COOLDOWN_SEC = 35 * 60; // wait between free conversions
export const IP_FREE_PER_WINDOW = 6;      // shared networks: free uses per window per address
export const MAX_DEVICES = 2;             // devices one paid code can be used on
export const FREE_MAX_CHARS = 3000;
export const PAID_MAX_CHARS = 40000;

// Payment details come from Netlify environment variables so they can be changed without code.
export function payInfo() {
  const account = process.env.PAY_ACCOUNT_NO, name = process.env.PAY_ACCOUNT_NAME;
  if (!account || !name) return null;
  return { bank: process.env.PAY_BANK || 'Голомт банк', name, account };
}
