// GET /api/bank-details — returns bank details from Vercel env vars
// Set these in Vercel Dashboard → AxTrader → Settings → Environment Variables:
//   BANK_NAME, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER, BANK_SWIFT_CODE, BANK_BRANCH
// Defaults are provided here so the API works without manual env var configuration.
// Override by setting the env vars in Vercel.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Allow any HTTP method
  const BANK_NAME           = process.env.BANK_NAME           || 'Ecobank Ghana';
  const BANK_ACCOUNT_NAME   = process.env.BANK_ACCOUNT_NAME   || 'Ben Adoma Kwaku';
  const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || '1441005170611';
  const BANK_SWIFT_CODE     = process.env.BANK_SWIFT_CODE     || 'ECOCGHAC';
  const BANK_BRANCH         = process.env.BANK_BRANCH         || 'Accra';

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
