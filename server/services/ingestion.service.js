const { getJurisdictionId } = require('../utils/jurisdictionFinder.js'); 
const openstates = require('./openstates.service.js');
const pluralpolicy = require('./pluralpolicy.service.js');
const googleSearch = require('./googleSearch.service.js');
const { extractEventsFromUrl, summarizeDescriptionIntoAgenda } = require('./gemini.service.js');
const CivicEntry = require('../models/CivicEntry');

const ingestAllSources = async (user) => {
    const { city, state } = user.address;
    const jurisdictionId = await getJurisdictionId(user.address);

    const [osEvents, ppBills, webUrls] = await Promise.all([
        openstates.fetchEvents(jurisdictionId),
        pluralpolicy.fetchBills(state),
        googleSearch.findEventPages(city, state)
    ]);

    let allEntries = [...osEvents, ...ppBills];
    if (webUrls && webUrls.length > 0) {
        const geminiResults = await Promise.all(webUrls.map(url => extractEventsFromUrl(url)));
        geminiResults.flat().forEach(event => {
            event.sourceApi = 'gemini';
            allEntries.push(event);
        });
    }

    let operations = [];
    for (const item of allEntries) {
        // --- NEW: AI Agenda Generation Step ---
        if (item.sourceApi === 'openstates' && item.description && (!item.agenda || item.agenda.length === 0)) {
            console.log(`[Ingestion Service] No agenda for "${item.name}". Generating with AI...`);
            const agendaItem = await summarizeDescriptionIntoAgenda(item.description);
            if (agendaItem) {
                item.agenda = [agendaItem]; // Add the AI-generated agenda
            }
        }

        // The rest of the processing logic...
        let entry;
        if (!item) continue;
        let startDate;

        if (item.sourceApi === 'openstates') {
            if (!item.id || !item.start_date) continue;
            startDate = new Date(item.start_date);
            if (isNaN(startDate.getTime())) continue;
            entry = {
                uniqueId: `os-event-${item.id}`, dataType: 'event', sourceApi: 'openstates',
                sourceUrl: item.links?.find(link => link.note === 'web')?.url || item.sources?.[0]?.url,
                jurisdictionId: item.jurisdiction.id,
                data: { name: item.name, description: item.description, classification: item.classification, startDate: startDate, locationName: item.location?.name },
                rawData: item
            };
        } else if (item.sourceApi === 'gemini') {
            if (!item.eventName || !item.eventDate) continue;
            startDate = new Date(item.eventDate);
            if (isNaN(startDate.getTime())) continue;
            entry = {
                uniqueId: `gem-${item.sourceUrl}-${item.eventName.replace(/\s+/g, '-')}`, dataType: 'event', sourceApi: 'gemini',
                sourceUrl: item.sourceUrl, jurisdictionId: jurisdictionId,
                data: { name: item.eventName, description: item.summary, classification: 'Community', startDate: startDate, locationName: item.location },
                rawData: item
            };
        } else { // Plural Policy Bill
            if (!item.id || !item.introducedDate) continue;
            startDate = new Date(item.introducedDate);
            if (isNaN(startDate.getTime())) continue;
            entry = {
                uniqueId: `pp-bill-${item.id}`, dataType: 'bill', sourceApi: 'pluralpolicy',
                sourceUrl: item.url,
                jurisdictionId: `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`,
                data: { name: item.title, description: item.summary, classification: item.type, startDate: startDate },
                rawData: item
            };
        }
        operations.push({ updateOne: { filter: { uniqueId: entry.uniqueId }, update: { $set: entry }, upsert: true } });
    }

    if (operations.length > 0) {
        const result = await CivicEntry.bulkWrite(operations);
        console.log(`[Ingestion Service] Bulk write complete. Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
        return { ingested: result.upsertedCount, updated: result.modifiedCount };
    }
    return { ingested: 0, updated: 0 };
};
module.exports = { ingestAllSources };