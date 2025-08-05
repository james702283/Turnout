const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) console.warn('[Gemini Service] GEMINI_API_KEY is not set. AI extraction will be skipped.');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Function 1: Event Extraction (Restored and Complete) ---
const EVENT_PROMPT = `Analyze the text from a webpage. Your task is to identify all upcoming civic meetings, town halls, public hearings, or community board events. Be flexible. The event information might be in a paragraph, a list, or a table row. For each distinct event you find, extract the following information: eventName, eventDate (in ISO 8601 format), location, and a summary. Return the information as a single, clean JSON array of objects. Each object must have the keys "eventName", "eventDate", "location", and "summary". If a piece of information is missing for an event, use a null value. If no events are found, return an empty array []. Do not include any explanatory text or markdown in your response. TEXT TO ANALYZE:`;

const extractEventsFromUrl = async (url) => {
    if (!GEMINI_API_KEY) return [];
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const textContent = await response.text();
        const fullPrompt = EVENT_PROMPT + textContent.substring(0, 30000);
        const result = await model.generateContent(fullPrompt);
        const geminiResponse = await result.response;
        const jsonText = geminiResponse.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(`[Gemini Service] Successfully extracted event data from ${url}`);
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`--- Gemini service failed to extract events from URL ${url} ---`, error);
        return [];
    }
};

// --- Function 2: Agenda Generation (Restored and Complete) ---
const AGENDA_PROMPT = `The following text is the description of a civic event. Summarize this description into a single, concise agenda item. The summary should capture the main purpose of the event. Return the result as a clean JSON object with this exact structure: { "description": "Your summary here.", "classification": ["summary"] }. Do not include any other text or markdown. TEXT TO ANALYZE:`;

const summarizeDescriptionIntoAgenda = async (description) => {
    if (!GEMINI_API_KEY || !description) return null;
    try {
        const fullPrompt = AGENDA_PROMPT + description;
        const result = await model.generateContent(fullPrompt);
        const geminiResponse = await result.response;
        const jsonText = geminiResponse.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`--- Gemini service failed to summarize agenda ---`, error);
        return null;
    }
};

// --- Function 3: The AI Representative Extraction Engine (Restored and Complete) ---
const REP_EXTRACTION_PROMPT = `Analyze the content of this webpage. Your task is to identify any elected officials mentioned. For each official, extract their full name, their specific title or office (e.g., "Mayor," "City Council Member, District 9"), and any available contact information (website, email, phone). Return this as a clean JSON array of objects. Each object must have the keys "name", "role", "email", "phone", and "website". If a piece of information is not found, use a null value. If no officials are found, return an empty array []. Do not include any explanatory text or markdown. WEBPAGE TEXT:`;

const extractRepsFromUrl = async (url) => {
    if (!GEMINI_API_KEY) return [];
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const textContent = await response.text();
        const fullPrompt = REP_EXTRACTION_PROMPT + textContent.substring(0, 40000);
        const result = await model.generateContent(fullPrompt);
        const geminiResponse = await result.response;
        const jsonText = geminiResponse.text().replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(`[Gemini Rep Service] Successfully extracted potential rep data from ${url}`);
        return JSON.parse(jsonText);
    } catch (error) {
        console.error(`--- Gemini service failed to extract reps from URL ${url} ---`, error);
        return [];
    }
};

module.exports = { extractEventsFromUrl, summarizeDescriptionIntoAgenda, extractRepsFromUrl };