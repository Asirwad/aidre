from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from src.agents import run_reliability_check, ask_reliability_question

router = APIRouter()

class AskRequest(BaseModel):
    question: str
class AskResponse(BaseModel):
    question: str
    answer: str
class ReportResponse(BaseModel):
    status: str
    tables_checked: List[str]
    issues_found: int
    report: str

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """Ask a natural language question about data reliability."""
    try:
        answer = await ask_reliability_question(request.question)
        return AskResponse(question=request.question, answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report", response_model=ReportResponse)
async def get_report(tables: Optional[str] = None):
    """
    Generate a full reliability report.
    
    Query params:
        tables: Comma-separated table names (optional)
    """
    try:
        table_list = tables.split(",") if tables else None
        result = await run_reliability_check(tables=table_list)
        
        return ReportResponse(
            status=result.get("current_phase", "unknown"),
            tables_checked=list(result.get("table_statuses", {}).keys()),
            issues_found=len(result.get("findings", [])),
            report=result.get("final_response", "No report generated"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))