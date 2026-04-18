// GET /api/bank-details — returns bank details from Vercel env vars
// Set these in Vercel Dashboard → AxTrader → Settings → Environment Variables:
//   BANK_NAME, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER, BANK_SWIFT_CODE, BANK_BRANCH

export const config = { runtime: 'edge' };

const empty = v => !v || v === '';
const hidden = v => empty(v) ? 'Contact support' : v;

export default async function handler(req) {
  // Allow any HTTP method
  const BANK_NAME           = process.env.BANK_NAME || '';
  const BANK_ACCOUNT_NAME   = process.env.BANK_ACCOUNT_NAME || '';
  const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || '';
  const BANK_SWIFT_CODE     = process.env.BANK_SWIFT_CODE || '';
  const BANK_BRANCH         = process.env.BANK_BRANCH || '';

  return new Response(JSON.stringify({
    bank_name:           BANK_NAME,
    account_name:        BANK_ACCOUNT_NAME,
    account_number:      BANK_ACCOUNT_NUMBER,
    swift_code:          BANK_SWIFT_CODE,
    branch:              BANK_BRANCH,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
