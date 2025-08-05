const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;

const fetchBills = async (state) => {
    if (!OPENSTATES_API_KEY) {
        console.warn('[Bill Connector] OPENSTATES_API_KEY not set. Skipping.');
        return [];
    }
    try {
        const stateJurisdiction = `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`;
        const params = new URLSearchParams({
            jurisdiction: stateJurisdiction,
            sort: 'latest_action_desc',
            page: 1,
            per_page: 20
        });

        const response = await fetch(`https://v3.openstates.org/bills?${params.toString()}`, {
            headers: { 'X-API-KEY': OPENSTATES_API_KEY }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bills API responded with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const bills = data.results || [];
        console.log(`[Bill Connector] Fetched ${bills.length} bills.`);
        return bills;
    } catch (error) {
        console.error('--- Error in Bill Connector ---', error);
        return [];
    }
};

module.exports = { fetchBills };