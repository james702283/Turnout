const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;
const OPENSTATES_V3_URL = 'https://v3.openstates.org';

const fetchEvents = async (jurisdictionId) => {
    try {
        let allEvents = [];
        let currentPage = 1;
        let maxPage = 1;

        const includes = ['sources', 'links', 'participants'];

        do {
            const params = new URLSearchParams({
                jurisdiction: jurisdictionId,
                sort: 'start_date',
                page: currentPage,
                per_page: 20,
            });

            includes.forEach(include => params.append('include', include));

            const response = await fetch(`${OPENSTATES_V3_URL}/events?${params.toString()}`, {
                headers: { 'X-API-KEY': OPENSTATES_API_KEY }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API responded with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                allEvents.push(...data.results);
            }

            if (currentPage === 1) {
                maxPage = data.pagination.max_page;
            }

            currentPage++;

        } while (currentPage <= maxPage);

        console.log(`[Open States Service] Fetched ${allEvents.length} total events for jurisdiction ${jurisdictionId}.`);
        return allEvents.map(event => ({ ...event, sourceApi: 'openstates' }));

    } catch (error) {
        console.error('--- Error in Open States service ---', error);
        return [];
    }
};

module.exports = { fetchEvents };