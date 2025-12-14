import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, AsyncGenerator
from src.data import MetadataCollector

from src.agents import run_reliability_check, ask_reliability_question
from src.agents.graph import reliability_graph
from src.agents.graph import AgentPhase

router = APIRouter()

@router.get("/tables", response_model=List[str])
async def get_tables():
    """Get a list of all available tables in the monitored schema."""
    try:
        # Use schema "BUSINESS_DATA" as seen in scanner_agent.py
        collector = MetadataCollector(schema="BUSINESS_DATA")
        return collector.get_all_tables()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

async def stream_reliability_events(
    tables: Optional[List[str]] = None,
    user_query: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Generator that yields SSE events for each step of the reliability check.
    
    Event types:
    - phase_change: Current agent phase changed
    - tables_discovered: List of tables to analyze
    - table_scanned: Metadata collected for a table
    - table_analyzed: Analysis complete for a table
    - finding_detected: New issue found
    - report_ready: Final report available
    - error: Error occurred
    - complete: All processing done
    """

    from uuid import uuid4
    from datetime import datetime

    initial_state = {
        "run_id": str(uuid4()),
        "started_at": datetime.utcnow(),
        "current_phase": AgentPhase.INITIALIZED,
        "user_query": user_query,
        "tables_to_check": tables or [],
        "table_metadata": {},
        "table_stats": {},
        "findings": [],
        "table_statuses": {},
        "report_summary": None,
        "final_response": None,
        "errors": [],
    }

    try:
        # Yield initial event
        yield _sse_event("started", {"run_id": initial_state["run_id"]})

        # Stream through graph execution
        async for event in reliability_graph.astream_events(
            initial_state,
            version="v2"
        ):
            event_type = event.get("event")

            # Node start events
            if event_type == "on_chain_start":
                node_name = event.get("name", "")
                if node_name in ["scan", "analyze", "report"]:
                    yield _sse_event("phase_change", {
                        "phase": node_name,
                        "status": "started"
                    })
            
            # Node end events (with output)
            elif event_type == "on_chain_end":
                node_name = event.get("name", "")
                output = event.get("data", {}).get("output", {})
                
                if node_name == "scan":
                    # Scanner completed
                    tables_found = list(output.get("table_metadata", {}).keys())
                    yield _sse_event("tables_discovered", {"tables": tables_found})
                    
                    for table_name in tables_found:
                        yield _sse_event("table_scanned", {
                            "table": table_name,
                            "row_count": output.get("table_stats", {}).get(table_name, {}).get("row_count", 0) if isinstance(output.get("table_stats", {}).get(table_name), dict) else getattr(output.get("table_stats", {}).get(table_name), "row_count", 0)
                        })
            
            elif node_name == "analyze":
                    # Analyzer completed
                    for table_name, status in output.get("table_statuses", {}).items():
                        is_healthy = status.is_healthy if hasattr(status, 'is_healthy') else status.get("is_healthy", True)
                        finding_count = len(status.findings) if hasattr(status, 'findings') else len(status.get("findings", []))
                        
                        yield _sse_event("table_analyzed", {
                            "table": table_name,
                            "is_healthy": is_healthy,
                            "finding_count": finding_count
                        })
                    
                    # Stream each finding
                    for finding in output.get("findings", []):
                        finding_data = finding.model_dump() if hasattr(finding, 'model_dump') else finding
                        # Convert enums to strings
                        if "severity" in finding_data and hasattr(finding_data["severity"], "value"):
                            finding_data["severity"] = finding_data["severity"].value
                        if "finding_type" in finding_data and hasattr(finding_data["finding_type"], "value"):
                            finding_data["finding_type"] = finding_data["finding_type"].value
                        yield _sse_event("finding_detected", finding_data)
            
            elif node_name == "report":
                    # Reporter completed
                    yield _sse_event("report_ready", {
                        "summary": output.get("report_summary", ""),
                        "response": output.get("final_response", "")
                    })
            
            yield _sse_event("complete", {"status": "success"})
    except Exception as e:
        yield _sse_event("error", {"error": str(e)})

def _sse_event(event_type: str, data: dict) -> str:
    """Format as Server-Sent Event."""
    return f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"

@router.get("/stream-report")
async def stream_report(tables: Optional[str] = None):
    """
    Stream reliability check events via SSE.
    
    Events:
    - started: Run initiated
    - phase_change: Agent phase changed (scan/analyze/report)
    - tables_discovered: List of tables found
    - table_scanned: Single table metadata collected
    - table_analyzed: Single table analysis complete
    - finding_detected: Issue found
    - report_ready: Final report generated
    - complete: All done
    - error: Something failed
    """
    table_list = tables.split(",") if tables else None
    return StreamingResponse(
        stream_reliability_events(tables=table_list),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.post("/stream-report/ask")
async def stream_ask(request: AskRequest):
    """Stream reliability analysis with a question."""
    return StreamingResponse(
        stream_reliability_events(user_query=request.question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
        