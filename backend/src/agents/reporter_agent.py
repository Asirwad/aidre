import json
from typing import Dict
from datetime import datetime

from src.data import get_cortex_llm
from src.agents.state import AgentState, AgentPhase
from langchain_core.messages import HumanMessage, SystemMessage

REPORT_SYSTEM_PROMPT = """You are a Data Reliability Engineer writing a status report.
Generate a clear, concise reliability report based on the findings.
Format:
1. Overall Status (🟢 Healthy / 🟡 At Risk / 🔴 Critical)
2. Summary (1-2 sentences)
3. Issues Found (if any, bullet points)
4. Recommendations (if issues exist)
Keep it under 200 words. Be direct and actionable.
"""

QUERY_SYSTEM_PROMPT = """You are a Data Reliability Engineer answering questions.
Based on the reliability analysis results, answer the user's question.
Be concise, direct, and cite specific evidence from the findings.
If the data shows issues, explain what's wrong and the severity.
If the data is healthy, confirm that clearly.
"""

async def report_node(state: AgentState) -> Dict:
    """
    REPORTER AGENT
    
    Generates human-readable reports or query answers.
    
    Preconditions:
        - state.table_statuses is populated
    
    Postconditions:
        - state.report_summary populated
        - state.final_response populated
        - state.current_phase = COMPLETE
    """
    try:
        llm = get_cortex_llm(temperature=0.2)

        # Prepare findings summary
        findings_summary = _prepare_findings_summary(state)

        if state.user_query:
            # Query mode: answer the specific question
            final_response = await _generate_query_response(
                llm, state.user_query, findings_summary
            )
            report_summary = final_response
        else:
            # Report mode: generate full report
            report_summary = await _generate_report(llm, findings_summary)
            final_response = report_summary

        return {
            "report_summary": report_summary,
            "final_response": final_response,
            "current_phase": AgentPhase.COMPLETE,
        }

    except Exception as e:
        return {
            "report_summary": f"Error generating report: {str(e)}",
            "final_response": f"Error: {str(e)}",
            "current_phase": AgentPhase.ERROR,
            "errors": state.errors + [{"phase": "reporting", "error": str(e)}]
        }

def _prepare_findings_summary(state: AgentState) -> str:
    """Prepare a text summary of all findings for the LLM."""
    lines = [f"Analysis Time: {datetime.utcnow().isoformat()}"]
    lines.append(f"Tables Checked: {len(state.table_statuses)}")
    lines.append(f"Total Issues: {len(state.findings)}")
    lines.append("")
    
    for table_name, status in state.table_statuses.items():
        health = "🟢 Healthy" if status.is_healthy else f"🔴 {status.overall_severity.value.upper()}"
        lines.append(f"## {table_name}: {health}")
        
        if status.findings:
            for f in status.findings:
                lines.append(f"  - [{f.severity.value.upper()}] {f.title}")
                lines.append(f"    {f.description}")
        else:
            lines.append("  No issues detected")
        lines.append("")
    
    return "\n".join(lines)

async def _generate_report(llm, findings_summary: str) -> str:
    """Generate a full reliability report."""
    messages = [
        SystemMessage(content=REPORT_SYSTEM_PROMPT),
        HumanMessage(content=f"Generate a reliability report:\n\n{findings_summary}")
    ]
    response = llm.invoke(messages)
    return response.content

async def _generate_query_response(llm, query: str, findings_summary: str) -> str:
    """Answer a specific user question about reliability."""
    messages = [
        SystemMessage(content=QUERY_SYSTEM_PROMPT),
        HumanMessage(content=f"User Question: {query}\n\nReliability Data:\n{findings_summary}")
    ]
    response = llm.invoke(messages)
    return response.content
        