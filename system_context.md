# Wanderchat System Context & Logic

## 1. Objective
To provide a personalized, non-forced tourism experience for Kerala. The system transitions from a "Discovery" phase to an "Itinerary" phase naturally based on user input.

## 2. Tech Stack
- **Frontend**: Next.js (React) - Modern Premium UI
- **Embeddings**: Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Vector Database**: FAISS (Local index)
- **LLM**: Google Gemini 2.0 Flash (via OpenRouter)
- **Search**: Tavily API (Live travel data, festivals, shops)
- **Data Ingestion**: Automatic PDF/DOCX processing from `/dataset`

## 3. Onboarding Flow (User Interaction)
1. **Destination Check**: "Do you have a place in mind?" (Yes/No).
2. **User Profile**: Style, Group, Interests, Dates.
3. **Transition**: Once profile is created, the system enters the Chat interface.

## 4. AI Behavioral Logic
### Discovery Mode (Destination = "Explore Kerala")
- AI acts as a consultant.
- Instead of a full itinerary, it suggests 3-4 diverse regions in Kerala matching the user's interests.
- Goal: Help the user pick a destination.

### Planning Mode (Destination is specified)
- AI follows the **Mandatory Output Structure**:
    1. **Itinerary**: Day-by-day plan with timings.
    2. **Budget Estimate**: Breakdown based on travel style.
    3. **Vocal for Local**: Authentic local shop/restaurant recommendations.
    4. **Hidden Gems**: Offbeat spots from local context or search.
    5. **Next Steps**: Ask for further details.

## 5. Key Features
- **Hidden Gems Mode**: Toggle to force offbeat locations.
- **Budget Estimator**: Contextual cost breakdown in chat.
- **Festival Finder**: Auto-checks travel dates for local events.
- **Transport Guide**: Specific transit suggestions.

## 6. Guardrails
- **Scope**: Strictly Kerala tourism.
- **Tone**: Professional, warm, and stunning.
- **Off-topic**: Politely decline non-Kerala queries.


