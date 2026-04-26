import os
import json
import faiss
import pickle
import pdfplumber
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from docx import Document
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv, dotenv_values
from tavily import TavilyClient
from sentence_transformers import SentenceTransformer

# ── Environment ───────────────────────────────────────────────────────────────
ENV_FILE = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=True)

DATASET_DIR = Path(__file__).parent.parent / "dataset"
KB_DIR = Path(__file__).parent.parent / "knowledge_base"
KB_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Wanderchat API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ───────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    style: str
    group: str
    interests: str
    dates: str
    destination: str
    hidden_gems: bool = False

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    profile: UserProfile
    history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

# ── Knowledge Manager ─────────────────────────────────────────────────────────

class KnowledgeManager:
    def __init__(self):
        self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.index_path = KB_DIR / "vector.index"
        self.store_path = KB_DIR / "chunks.pkl"
        self.index = None
        self.store = []
        self.load_or_build()

    def extract_text(self, file_path):
        suffix = file_path.suffix.lower()
        text = ""
        try:
            if suffix == ".pdf":
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        content = page.extract_text()
                        if content: text += content + "\n"
            elif suffix in [".docx", ".doc"]:
                doc = Document(file_path)
                text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
        return text

    def chunk_text(self, text, source_name, chunk_size=600, overlap=100):
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(f"Source: {source_name}\n\n{chunk}")
        return chunks

    def build_index(self):
        all_chunks = []
        files = list(DATASET_DIR.glob("*.*"))
        for f in files:
            text = self.extract_text(f)
            if text:
                chunks = self.chunk_text(text, f.name)
                all_chunks.extend(chunks)
        
        if not all_chunks:
            return None, []

        embeddings = self.embedding_model.encode(all_chunks, show_progress_bar=False)
        embeddings = np.array(embeddings).astype("float32")
        
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)

        faiss.write_index(index, str(self.index_path))
        with open(self.store_path, "wb") as f:
            pickle.dump(all_chunks, f)
        
        return index, all_chunks

    def load_or_build(self):
        if self.index_path.exists() and self.store_path.exists():
            idx_time = self.index_path.stat().st_mtime
            files = list(DATASET_DIR.glob("*.*"))
            latest_file_time = max([f.stat().st_mtime for f in files]) if files else 0
            
            if latest_file_time < idx_time:
                self.index = faiss.read_index(str(self.index_path))
                with open(self.store_path, "rb") as f:
                    self.store = pickle.load(f)
                return

        self.index, self.store = self.build_index()

km = KnowledgeManager()

# ── Pipeline ──────────────────────────────────────────────────────────────────

MAIN_MODEL = "google/gemini-2.0-flash-001"

PROMPT_SYSTEM = """You are 'Wanderchat', the ultimate premium Kerala Tourism AI assistant. 

### SCOPE & ROLE:
- You are an expert on Kerala's geography, culture, history, and tourism.
- **GUARDRAIL**: If the user asks anything outside of Kerala tourism, politely state: "I am your Kerala travel assistant. I'm here to help you explore 'God's Own Country', so I can't assist with off-topic queries."

### USER PROFILE:
- Travel Style: {style}
- Group: {group}
- Interests: {interests}
- Dates: {dates}
- Hidden Gems Mode: {hidden_gems}
- Current Destination Goal: {destination}

### OPERATIONAL LOGIC:
1. **Phase 1: Discovery (If Goal is 'Explore Kerala' and user hasn't picked a place yet)**: 
   - **CRITICAL**: DO NOT PROVIDE AN ITINERARY OR BUDGET YET.
   - Act as a travel consultant.
   - Suggest 3-4 diverse regions in Kerala that match their interests.
   - Describe the vibe of each place briefly.
   - End by asking them which place(s) they want to explore further, or if they want you to build an itinerary for any of them.
   
### FORMATTING RULES FOR READABILITY:
- **ALWAYS use Markdown extensively.**
- **Leave a blank line between every paragraph or list item.**
- Use bold text for key terms and destinations.
- Break up large blocks of text into smaller, digestible lists.

2. **Phase 2: Planning (If Goal is a specific place, or if the user explicitly asks for an itinerary)**:
   - Provide the detailed structured output below.

### MANDATORY OUTPUT STRUCTURE (ONLY FOR PHASE 2 - PLANNING):
If (and ONLY if) you are in Phase 2, format your response exactly like this:
1. **Itinerary**: Detailed day-by-day plan with timings.
2. **Budget Estimate**: Brief breakdown based on '{style}' style.
3. **Vocal for Local**: 2-3 specific local shops/restaurants.
4. **Hidden Gems**: 1-2 offbeat spots.
5. **Next Steps**: Ask if they need adjustments.
"""

def get_clients():
    env_values = dotenv_values(ENV_FILE)
    ok = env_values.get("OPENROUTER_API_KEY") or env_values.get("OPENROUTER_KEY")
    tk = env_values.get("TAVILY_API_KEY") or env_values.get("TAVILY_KEY")
    if not ok or not tk: return None, None
    return OpenAI(base_url="https://openrouter.ai/api/v1", api_key=ok), TavilyClient(api_key=tk)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/status")
def get_status():
    return {
        "status": "ready",
        "knowledge_base": {
            "chunks": len(km.store),
            "files": [f.name for f in DATASET_DIR.glob("*.*")]
        }
    }

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    client, tavily = get_clients()
    if not client:
        raise HTTPException(status_code=500, detail="API Keys not configured.")

    # Retrieve context
    context = ""
    if km.index:
        query_emb = km.embedding_model.encode([request.query]).astype("float32")
        _, indices = km.index.search(query_emb, 6)
        context = "\n\n".join([km.store[i] for i in indices[0] if i < len(km.store)])

    # Search web
    search_query = f"{request.query} Kerala tourism travel information"
    if request.profile.dates:
        search_query += f" events {request.profile.dates}"
    
    try:
        search_raw = tavily.search(search_query, max_results=4)
        web_results = "\n".join([f"- {r['title']}: {r['content']}" for r in search_raw.get("results", [])])
    except Exception as e:
        web_results = f"Search failed: {e}"

    # Final prompt
    sys_prompt = PROMPT_SYSTEM.format(
        style=request.profile.style, group=request.profile.group, 
        interests=request.profile.interests, dates=request.profile.dates,
        hidden_gems="ACTIVE" if request.profile.hidden_gems else "OFF",
        destination=request.profile.destination
    )
    
    final_prompt = f"Context:\n{context}\n\nSearch Results:\n{web_results}\n\nUser Query: {request.query}"
    
    api_messages = [{"role": "system", "content": sys_prompt}]
    for msg in request.history[-10:]:
        api_messages.append({"role": msg.role if msg.role in ["user", "assistant"] else "user", "content": msg.content})
    api_messages.append({"role": "user", "content": final_prompt})
    
    try:
        response = client.chat.completions.create(
            model=MAIN_MODEL,
            messages=api_messages
        )
        return ChatResponse(response=response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
