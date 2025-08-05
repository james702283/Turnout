const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;

const fetchEvents = async (jurisdictionId) => {
    try {
        let allEvents = [];
        let currentPage = 1;
        let maxPage = 1;
        do {
            const params = new URLSearchParams({
                jurisdiction: jurisdictionId,
                sort: 'start_date',
                page: currentPage,
                // --- FIX: Corrected per_page to be within the API's limit of 20 ---
                per_page: 20 
            });
            const response = await fetch(`https://v3.openstates.org/events?${params.toString()}`, { headers: { 'X-API-KEY': OPENSTATES_API_KEY } });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API responded with status ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            if (data.results) allEvents.push(...data.results);
            if (currentPage === 1) maxPage = data.pagination.max_page;
            currentPage++;
        } while (currentPage <= maxPage);
        console.log(`[Open States Connector] Fetched ${allEvents.length} events.`);
        return allEvents;
    } catch (error) {
        console.error('--- Error in Open States Connector ---', error);
        return [];
    }
};
module.exports = { fetchEvents };