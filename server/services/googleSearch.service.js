// server/services/googleSearch.service.js

const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// --- FIX: Use the correct, distinct environment variable for Google Custom Search ---
const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_CUSTOM_SEARCH_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX;

const performSearch = async (query) => {
    if (!GOOGLE_CUSTOM_SEARCH_CX || !GOOGLE_CUSTOM_SEARCH_API_KEY) {
        console.error('[Search Service] CRITICAL ERROR: GOOGLE_CUSTOM_SEARCH_CX or GOOGLE_CUSTOM_SEARCH_API_KEY is not configured in .env.');
        return [];
    }
    
    const enhancedQuery = `${query} -obituary -funeral -genealogy -classifieds`;
    const params = new URLSearchParams({ 
        key: GOOGLE_CUSTOM_SEARCH_API_KEY, 
        cx: GOOGLE_CUSTOM_SEARCH_CX, 
        q: enhancedQuery,
        num: 3
    });

    try {
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
        if (!response.ok) {
            console.error(`[Search Service] Google API responded with status ${response.status} for query: "${enhancedQuery}".`);
            return [];
        }
        const data = await response.json();
        if (data.items) {
            console.log(`[Search Service] Found ${data.items.length} results for query: "${enhancedQuery}"`);
            return data.items.map(item => item.link);
        }
        return [];
    } catch (error) {
        console.error(`--- Error in Google Search service for query "${enhancedQuery}" ---`, error);
        return [];
    }
};

const findEventPages = async (city, state) => {
    const queries = [
        `site:.gov "${city}" "community board meeting" agenda`,
        `site:.gov "${city}" "city council" "public hearing schedule"`,
        `"${city} ${state}" "planning commission" agenda`,
        `"${city}" "town hall meeting" local news`,
        `inurl:.org "${city} ${state}" "events"`,
        `site:reddit.com "r/${city}" "town hall"`,
        `site:facebook.com "${city} events" "public meeting"`,
        `site:meetup.com "${city}" "community meeting"`
    ];
    const results = await Promise.all(queries.map(q => performSearch(q)));
    const uniqueLinks = [...new Set(results.flat())];
    console.log(`[Search Service] Found ${uniqueLinks.length} unique potential event pages from ${queries.length} queries.`);
    return uniqueLinks;
};

module.exports = { findEventPages, performSearch };