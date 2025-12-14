
from typing import Dict, Any
from uuid import uuid4
from datetime import datetime

from langgraph.graph import StateGraph, END
from pydantic import BaseModel

from .state import AgentState, AgentPhase
from .scanner_agent import scan_node
from .analyzer_agent import analyze_node
from .reporter_agent import report_node

def create_reliability_graph():
    """
    Creates the AIDRE agent orchestration graph.
    
    Flow: scan_node → analyze_node → report_node → END
    
    Returns a compiled graph ready for execution.
    """
    # Create graph with AgentState schema
    # LangGraph needs a dict-based state, so we convert
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("scan", scan_node)
    graph.add_node("analyze", analyze_node)
    graph.add_node("report", report_node)

    # Define edges (linear flow for MVP)
    graph.set_entry_point("scan")
    graph.add_edge("scan", "analyze")
    graph.add_edge("analyze", "report")
    graph.add_edge("report", END)

    # Compile and return
    return graph.compile()

# Pre-compiled graph instance
reliability_graph = create_reliability_graph()

async def run_reliability_check(
    tables: list[str] = None,
    user_query: str = None
) -> Dict[str, Any]:
    """
    Execute a full reliability check.
    
    Args:
        tables: Optional list of tables to check. If None, checks all.
        user_query: Optional natural language question.
    
    Returns:
        Final state with report and findings.
    """
    # Create initial state
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

    # Execute graph
    result = await reliability_graph.ainvoke(initial_state)
    return result

async def check_all_tables() -> Dict[str, Any]:
    """Check all tables and generate a report."""
    return await run_reliability_check()

async def ask_reliability_question(question: str) -> str:
    """Ask a natural language question about data reliability."""
    result = await run_reliability_check(user_query=question)
    return result.get("final_response", "Unable to generate response")