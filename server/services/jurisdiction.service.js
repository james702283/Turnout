const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;

const findJurisdictionId = async (address) => {
    // --- FIX: Using the correct enumeration member 'municipality' ---
    const params = new URLSearchParams({
        classification: 'municipality',
        name: address.city
    });
    try {
        const response = await fetch(`https://v3.openstates.org/jurisdictions?${params.toString()}`, {
            headers: { 'X-API-KEY': OPENSTATES_API_KEY }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Open States Jurisdictions API responded with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error(`No 'municipality' jurisdiction found for name: "${address.city}"`);
        }

        // --- CRITICAL FIX: Ensure the jurisdiction is in the correct state ---
        const correctStateAbbr = `/state:${address.state.toLowerCase()}/`;
        const correctJurisdiction = data.results.find(j => j.id.includes(correctStateAbbr));

        if (!correctJurisdiction) {
            throw new Error(`Found jurisdictions for "${address.city}", but none were in state "${address.state.toUpperCase()}"`);
        }
        
        console.log(`[Jurisdiction Service] Successfully found and validated Jurisdiction: ${correctJurisdiction.name} (${correctJurisdiction.id})`);
        return correctJurisdiction.id;

    } catch (error) {
        console.error('--- Error in Jurisdiction Finder service ---', error);
        const fallbackId = `ocd-jurisdiction/country:us/state:${address.state.toLowerCase()}/government`;
        console.warn(`[Jurisdiction Service] Falling back to state: ${fallbackId}`);
        return fallbackId;
    }
};
module.exports = { findJurisdictionId };