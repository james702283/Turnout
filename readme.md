# **Turnout: The Civic Intelligence Engine**

## Vision: A Paradigm Shift in Civic Engagement

In an era of increasing political polarization and information overload, civic engagement has become a complex and often discouraging task. The critical data needed for informed participation is scattered across a labyrinth of government websites, news articles, and community forums, creating a significant barrier—or "information friction"—that fosters apathy and disempowerment.

**Turnout is engineered to dismantle this barrier.**

Our vision is to create a fundamental paradigm shift, moving citizens from being passive observers to empowered, active participants in their governance. We are not just an app; we are a **civic intelligence engine**. Our mission is to ingest the high-entropy chaos of public data and transform it into a personalized, clear, and actionable ecosystem.

By providing a single, trusted source of truth, Turnout empowers users to understand the direct impact of policy on their lives, engage with their representatives on a factual basis, and see the tangible results of their participation. This creates a virtuous cycle of engagement and accountability, strengthening the foundation of democracy from the local level up.

## Core Features

*   **AI-Powered Representative Engine:** A comprehensive, multi-layered directory of a user's elected officials (local, state, federal). Our hybrid, AI-first approach guarantees data is timely, accurate, and complete, solving the "stale data" problem that plagues other civic platforms.
*   **Interactive Representative Profiles:** Dynamic profiles displaying full tenure, term limits, next election dates, legislative history (sponsored bills), and voting records.
*   **The Alignment Engine (Flagship Feature):** This game-changing tool allows users to define their key issues (e.g., environmental policy, public transit, education). The engine then provides a personalized, factual, AI-generated analysis of how their representatives' voting records and sponsored legislation align with those stated priorities, moving beyond party labels to true ideological alignment.
*   **Dynamic Community Events Feed:** A localized, real-time feed of community board meetings, public hearings, and town halls. Data is aggregated from a multi-vector pipeline that searches and extracts information from official government sites, news media, and even unstructured sources like Reddit, ensuring a comprehensive view of local civic life.
*   **Hybrid Proposal System:** A platform for both user-generated and AI-discovered civic proposals. This includes official petitions, ballot initiatives, and community concerns surfaced from sources like Change.org and Nextdoor, creating a centralized hub for grassroots action.

## Architecture & Scalability

Turnout is built on a robust, decoupled, and self-sustaining architecture designed for massive scalability and resilience.

*   **Technology Stack:** MERN (MongoDB, Express, React, Node.js), containerized with Docker.

*   **AI-First, Multi-Source Ingestion Pipeline:** Our system is not dependent on any single, fragile API. It operates on a resilient, hybrid synthesis model:
    1.  **Discover:** A fleet of automated agents uses Google Search and targeted crawlers to identify a wide range of public web sources containing civic data.
    2.  **Extract:** A specialized "Scout" AI persona (powered by Gemini) scans these sources to extract raw, unstructured data—names, dates, locations, and descriptions.
    3.  **Enrich:** The system cross-references the extracted data with structured APIs (like Open States) to enrich it with official identifiers, photos, and formal records.
    4.  **Synthesize & Verify:** A powerful "Analyst" AI persona (Gemini) takes both the raw and enriched data, verifies its timeliness and accuracy against multiple points of reference, de-duplicates entries, and generates concise, unbiased summaries.
    5.  **Cache:** The final, verified data object is stored in our MongoDB database.

*   **Server-Side Caching & Resilience:** The MongoDB database acts as a robust, persistent cache. This ensures the application is exceptionally fast for the end-user and remains fully functional even if a primary data source (like an official API) experiences an outage.

*   **Automated & Self-Sustaining Ecosystem:** The platform is designed to be self-sustaining.
    *   **Automated Cache Refresh:** Background cron jobs run on a schedule to automatically trigger the ingestion pipeline for cached locations, ensuring data remains fresh without manual intervention.
    *   **Self-Configuring Location Awareness:** The system intelligently expands its coverage. When a new user signs up from a previously uncached location (e.g., a new city), it automatically adds that location to the cron job schedule. This allows the platform to scale its data coverage organically based on user growth.

## Data as an Asset & Business Value

Turnout is not only a tool for citizen empowerment but also a powerful data asset. The platform generates high-value, anonymized, and aggregated insights into the civic landscape.

*   **Geospatial Trend Analysis:** Provides a real-time map of the civic issues that matter most to communities, district by district. This is invaluable for journalists, academic researchers, and non-partisan advocacy groups.
*   **Anonymized Alignment Data:** Offers unparalleled, unbiased insight into the alignment between constituent priorities and representative actions. This data is a critical asset for political scientists, campaign strategists, and organizations focused on government accountability.
*   **API-as-a-Service:** Future development includes offering a licensed API for verified organizations to access this rich, structured, and timely civic data for their own research and applications.

## Setup and Installation

1.  Clone the repository.
2.  Install dependencies for both the `client` and `server` directories: `npm install`
3.  Create a `.env` file in the `server` directory and populate it with the necessary API keys and your MongoDB URI.
4.  Run the application: `npm run dev`