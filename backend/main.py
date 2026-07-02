from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, Optional
import json

from paper_parser import paper_parser
from agent import research_agent, AgentCommand
from config import settings


app = FastAPI(
    title="VoyagerP - Research Paper AI Assistant",
    description="AI-powered research paper analysis tool",
    version="1.0.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class CommandRequest(BaseModel):
    action: Literal["summarize", "explain", "insights", "ask", "section"]
    target: Optional[str] = None
    detail_level: Literal["brief", "detailed", "comprehensive"] = "detailed"
    provider: Optional[Literal["azure", "deepseek"]] = None
    stream: bool = False


class QuestionRequest(BaseModel):
    question: str
    provider: Optional[Literal["azure", "deepseek"]] = None
    stream: bool = False


class ProviderConfig(BaseModel):
    provider: Literal["azure", "deepseek"]


# Endpoints
@app.get("/")
async def root():
    return {
        "name": "VoyagerP",
        "description": "Research Paper AI Assistant",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/config")
async def get_config():
    """Get current configuration."""
    return {
        "default_provider": settings.default_provider,
        "azure_configured": bool(settings.azure_openai_api_key),
        "deepseek_configured": bool(settings.deepseek_api_key),
    }


@app.post("/upload")
async def upload_paper(file: UploadFile = File(...)):
    """Upload and parse a research paper PDF."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        contents = await file.read()
        paper = paper_parser.parse_pdf(contents)
        research_agent.load_paper(paper)
        
        return {
            "success": True,
            "paper": {
                "title": paper.title,
                "authors": paper.authors,
                "abstract": paper.abstract[:500] + "..." if len(paper.abstract) > 500 else paper.abstract,
                "page_count": paper.page_count,
                "sections": [{"title": s.title, "pages": f"{s.page_start}-{s.page_end}"} 
                            for s in paper.sections],
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")


@app.get("/paper")
async def get_paper_overview():
    """Get overview of the currently loaded paper."""
    overview = research_agent.get_paper_overview()
    if not overview:
        raise HTTPException(status_code=404, detail="No paper loaded")
    return overview


@app.post("/command")
async def execute_command(request: CommandRequest):
    """Execute an analysis command on the loaded paper."""
    if not research_agent.current_paper:
        raise HTTPException(status_code=400, detail="No paper loaded. Please upload a paper first.")
    
    command = AgentCommand(
        action=request.action,
        target=request.target,
        detail_level=request.detail_level,
    )
    
    try:
        if request.stream:
            async def generate():
                async for chunk in await research_agent.process_command(
                    command, provider=request.provider, stream=True
                ):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        response = await research_agent.process_command(
            command, provider=request.provider, stream=False
        )
        return {"response": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
async def ask_question(request: QuestionRequest):
    """Ask a free-form question about the loaded paper."""
    if not research_agent.current_paper:
        raise HTTPException(status_code=400, detail="No paper loaded. Please upload a paper first.")
    
    try:
        if request.stream:
            async def generate():
                async for chunk in await research_agent.ask_question(
                    request.question, provider=request.provider, stream=True
                ):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        
        response = await research_agent.ask_question(
            request.question, provider=request.provider, stream=False
        )
        return {"response": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/clear")
async def clear_history():
    """Clear conversation history."""
    research_agent.clear_history()
    return {"success": True, "message": "Conversation history cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
