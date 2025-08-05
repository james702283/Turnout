// server/services/representativeService.js

const fetch = require('node-fetch');
const { performSearch } = require('./googleSearch.service.js');
const { extractRepsFromUrl } = require('./gemini.service.js');
const Representative = require('../models/Representative');

const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY;
const OPENSTATES_GQL_URL = 'https://openstates.org/graphql';
const GOOGLE_API_KEY = process.env.GOOGLE_CIVIC_API_KEY;

// Helper to fetch from OpenStates GraphQL
const queryOpenStates = async (query, variables) => {
    const response = await fetch(OPENSTATES_GQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': OPENSTATES_API_KEY },
        body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    if (data.errors) {
        console.error("OpenStates GQL Error:", data.errors[0].message);
        return [];
    }
    // Updated to handle cases where 'people' might be null
    return data.data?.people?.edges?.map(edge => edge.node) || [];
};

// --- Path A, Part 1: Query Open States by coordinates and OCD-IDs ---
const fetchFromOpenStates = async (locationContext) => {
    try {
        // --- FIX: Corrected GraphQL fragment from "Person" to "PersonNode" ---
        const fragment = `fragment repFragment on PersonNode { id name image currentMemberships { organization { name classification } post { label } } contactDetails { type value note } links { url note } }`;
        
        // Query 1: By precise coordinates
        const byLocationQuery = `query ($lat: Float!, $lng: Float!) { people(latitude: $lat, longitude: $lng, first: 50) { edges { node { ...repFragment } } } } ${fragment}`;
        const byLocationPromise = queryOpenStates(byLocationQuery, { lat: locationContext.coordinates.lat, lng: locationContext.coordinates.lng });
        
        // Query 2: By OCD-ID for broader city/county coverage
        const byOcdIdQuery = `query ($ocdId: String!) { people(memberOf: $ocdId, first: 100) { edges { node { ...repFragment } } } } ${fragment}`;
        const ocdId = `ocd-division/country:us/state:${locationContext.stateShort}/place:${locationContext.searchCity.replace(/\s/g, '_')}`;
        const byOcdIdPromise = queryOpenStates(byOcdIdQuery, { ocdId });

        const [repsByLocation, repsByOcdId] = await Promise.all([byLocationPromise, byOcdIdPromise]);

        const combinedReps = new Map();
        [...repsByLocation, ...repsByOcdId].forEach(rep => rep && combinedReps.set(rep.id, rep));
        
        console.log(`[Open States] Found ${combinedReps.size} unique officials.`);
        return Array.from(combinedReps.values());
    } catch (error) {
        console.error("--- Error in fetchFromOpenStates ---", error);
        return [];
    }
};

// --- Path B: AI-Powered Discovery using the Location Context ---
const fetchFromAI = async (locationContext) => {
    try {
        const { searchCity, borough, county, stateShort } = locationContext;
        // --- FIX: Add state abbreviation to queries for geographic specificity ---
        const stateSuffix = `, ${stateShort.toUpperCase()}`;
        let searchQueries = [
            `"mayor of ${searchCity}${stateSuffix}"`,
            `"${searchCity} city council${stateSuffix}"`
        ];
        if (borough) searchQueries.push(`"${borough} Borough President"`, `"community board ${borough}"`);
        if (county) searchQueries.push(`"${county} executive${stateSuffix}"`, `"${county} board of supervisors${stateSuffix}"`);

        const uniqueUrls = [...new Set((await Promise.all(searchQueries.map(q => performSearch(q)))).flat())];
        if (uniqueUrls.length === 0) return [];

        const extractedData = (await Promise.all(uniqueUrls.slice(0, 5).map(url => extractRepsFromUrl(url)))).flat();
        const validReps = extractedData.filter(rep => rep && rep.name && rep.role);
        console.log(`[AI Discovery] Found ${validReps.length} potential officials.`);
        return validReps;
    } catch (error) {
        console.error("--- Error in fetchFromAI ---", error);
        return [];
    }
};

// --- The Main Synthesis Engine (Logic Unchanged) ---
const fetchAndSynthesizeReps = async (address) => {
    const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(Object.values(address).join(', '))}&key=${GOOGLE_API_KEY}`);
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error("Geocoding failed. Could not find location data for the address.");
    }
    const result = geocodeData.results[0];
    const getComp = (type, nameType = 'long_name') => result.address_components.find(c => c.types.includes(type))?.[nameType]?.toLowerCase() || '';

    const locationContext = {
        coordinates: result.geometry.location,
        searchCity: getComp('locality') || getComp('postal_town'),
        borough: getComp('sublocality_level_1'),
        county: getComp('administrative_area_level_2'),
        stateShort: getComp('administrative_area_level_1', 'short_name'),
        zip: getComp('postal_code'),
    };

    const [officialReps, aiReps] = await Promise.all([
        fetchFromOpenStates(locationContext),
        fetchFromAI(locationContext)
    ]);

    const synthesizedReps = new Map();
    const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

    officialReps.forEach(rep => {
        const key = normalizeName(rep.name);
        const roleMembership = rep.currentMemberships.find(m => m.organization.classification !== 'party');
        const partyMembership = rep.currentMemberships.find(m => m.organization.classification === 'party');
        synthesizedReps.set(key, {
            ocdId: rep.id,
            name: rep.name,
            party: partyMembership?.organization?.name || 'Non-Partisan',
            role: roleMembership?.post?.label || 'Official',
            image: rep.image,
            contactDetails: rep.contactDetails || [],
            links: rep.links || []
        });
    });

    aiReps.forEach(rep => {
        const key = normalizeName(rep.name);
        if (synthesizedReps.has(key)) {
            const existing = synthesizedReps.get(key);
            if (!existing.image && rep.photoUrl) existing.image = rep.photoUrl;
            if (!existing.links.some(l => l.note === 'homepage') && rep.website) existing.links.push({ url: rep.website, note: 'homepage' });
        } else {
            synthesizedReps.set(key, {
                ocdId: `ai-${key}`,
                name: rep.name,
                party: 'Unknown',
                role: rep.role,
                image: rep.photoUrl || null,
                contactDetails: [
                    rep.email && { type: 'email', value: rep.email },
                    rep.phone && { type: 'phone', value: rep.phone }
                ].filter(Boolean),
                links: rep.website ? [{ url: rep.website, note: 'homepage' }] : []
            });
        }
    });

    const finalReps = Array.from(synthesizedReps.values());
    
    if (finalReps.length > 0) {
        const locationKeys = [`zip_${locationContext.zip}`, `city_${locationContext.searchCity}`, `state_${locationContext.stateShort}`];
        const operations = finalReps.map(rep => ({
            updateOne: {
                filter: { ocdId: rep.ocdId },
                update: { $set: { ...rep, locationKeys, lastUpdatedAt: new Date() } },
                upsert: true
            }
        }));
        await Representative.bulkWrite(operations);
        console.log(`[Rep Service] Saved/updated ${finalReps.length} synthesized representatives to cache.`);
    }

    return finalReps;
};

module.exports = { fetchAndSynthesizeReps };