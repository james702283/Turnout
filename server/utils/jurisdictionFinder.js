const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const GOOGLE_GEOCODE_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;
const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;
const OPENSTATES_V3_URL = 'https://v3.openstates.org';

const getJurisdictionId = async (address) => {
    try {
        const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
        const geocodeParams = new URLSearchParams({ address: addressString, key: GOOGLE_GEOCODE_API_KEY });
        const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${geocodeParams.toString()}`);
        if (!geocodeResponse.ok) throw new Error(`Google Geocoding API responded with status ${geocodeResponse.status}`);
        
        const geocodeData = await geocodeResponse.json();
        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('Geocoding failed to find coordinates for the address.');
        }
        const { lat, lng } = geocodeData.results[0].geometry.location;
        console.log(`[Jurisdiction Finder] Geocoded address to lat: ${lat}, lng: ${lng}`);

        const peopleParams = new URLSearchParams({ lat, lng });
        const peopleResponse = await fetch(`${OPENSTATES_V3_URL}/people.geo?${peopleParams.toString()}`, {
            headers: { 'X-API-KEY': OPENSTATES_API_KEY }
        });

        if (!peopleResponse.ok) {
            const errorText = await peopleResponse.text();
            throw new Error(`Open States people.geo API responded with status ${peopleResponse.status}: ${errorText}`);
        }

        const peopleData = await peopleResponse.json();
        if (!peopleData.results || peopleData.results.length === 0) {
            throw new Error('Open States API found no people for the given coordinates.');
        }

        // --- CRITICAL FIX: Accept the first valid jurisdiction ID found. ---
        // The API returns the most relevant representatives first. Trusting this order is more reliable
        // than trying to second-guess the jurisdiction type.
        const jurisdictionId = peopleData.results[0]?.jurisdiction?.id;
        if (!jurisdictionId) {
            throw new Error('Found a representative, but they had no jurisdiction ID.');
        }

        const jurisdictionName = peopleData.results[0].jurisdiction.name;
        console.log(`[Jurisdiction Finder] Successfully found jurisdiction via geo-lookup: ${jurisdictionName} (${jurisdictionId})`);
        return jurisdictionId;

    } catch (error) {
        console.error('--- Error in Jurisdiction Finder utility ---', error);
        const fallbackId = `ocd-jurisdiction/country:us/state:${address.state.toLowerCase()}/government`;
        console.warn(`[Jurisdiction Finder] Falling back to state-level jurisdiction: ${fallbackId}`);
        return fallbackId;
    }
};

module.exports = { getJurisdictionId };