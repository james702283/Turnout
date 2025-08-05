const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;
const OPENSTATES_V3_URL = 'https://v3.openstates.org';

const fetchBills = async (state) => {
    if (!OPENSTATES_API_KEY) {
        console.warn('[Bill Service] OPENSTATES_API_KEY not set. This data source will be skipped.');
        return [];
    }

    try {
        const stateJurisdiction = `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`;
        
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        const afterDate = oneYearAgo.toISOString().split('T')[0];

        const params = new URLSearchParams({
            jurisdiction: stateJurisdiction,
            sort: 'latest_action_desc',
            after: afterDate,
            page: 1,
            // --- FIX: Corrected per_page to be within the API's limit of 20 ---
            per_page: 20
        });

        const response = await fetch(`${OPENSTATES_V3_URL}/bills?${params.toString()}`, {
            headers: { 'X-API-KEY': OPENSTATES_API_KEY }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Open States Bills API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const bills = data.results || [];
        console.log(`[Bill Service] Fetched ${bills.length} bills from Open States API for ${state.toUpperCase()}.`);

        return bills.map(bill => ({ ...bill, sourceApi: 'pluralpolicy' }));

    } catch (error) {
        console.error('--- Error in Bill Service (formerly Plural Policy) ---', error);
        return [];
    }
};

module.exports = { fetchBills };