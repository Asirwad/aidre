import json
from typing import Dict, List
from uuid import uuid4
from datetime import datetime

from src.data import get_cortex_llm
from src.models.signals import (
    ReliabilityFinding,
    TableReliabilityStatus,
    Severity,
    FindingType,
)

from src.agents.state import AgentState, AgentPhase
from langchain_core.messages import HumanMessage, SystemMessage

ANALYSIS_SYSTEM_PROMPT = """You are an expert Data Reliability Engineer analyzing table health.
For each table, analyze the metadata and statistics to detect issues.
RESPOND IN VALID JSON ONLY with this structure, DO NOT ADD ANY ADDITIONAL TEXT, NO MARKDOWN:
{
  "findings": [
    {
      "finding_type": "freshness|schema_drift|volume_anomaly|null_spike|distribution_drift",
      "severity": "low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed explanation",
      "evidence": {"key": "value"}
    }
  ],
  "is_healthy": true|false,
  "overall_severity": "low|medium|high|critical"
}
Detection rules:
- freshness_hours > 24: HIGH freshness issue
- freshness_hours > 6: MEDIUM freshness issue
- row_count = 0: CRITICAL volume anomaly
- null rate > 50% on non-nullable-looking columns: HIGH null spike
If no issues, return: {"findings": [], "is_healthy": true, "overall_severity": "low"}
"""

async def analyze_node(state: AgentState) -> Dict:
    """
    ANALYZER AGENT
    
    Detects reliability issues using Cortex LLM.
    
    Preconditions:
        - state.table_metadata is populated
        - state.table_stats is populated
    
    Postconditions:
        - state.findings populated
        - state.table_statuses populated
        - state.current_phase = REPORTING
    """
    try:
        llm = get_cortex_llm(temperature=0.0)

        all_findings = List[ReliabilityFinding] = []
        table_statuses = Dict[str, TableReliabilityStatus] = {}
        errors = list(state.errors)

        for table_name in state.table_metadata.keys():
            try:
                metadata = state.table_metadata[table_name]
                stats = state.table_stats[table_name]
                
                # Prepare data for Cortex LLM
                metadata_dict = metadata.model_dump() if hasattr(metadata, "model_dump") else metadata.dict()
                stats_dict = stats.model_dump() if hasattr(stats, "model_dump") else (stats.dict() if stats else {})

                # Convert datetime objects to strings for JSON
                for key, value in stats_dict.items():
                    if isinstance(value, datetime):
                        stats_dict[key] = value.isoformat()

                prompt = f"""Analyse this table:
                Table: {table_name}
                Metadata: {json.dumps(metadata_dict, default=str)}
                Stats: {json.dumps(stats_dict, default=str)}
                """

                messages = [
                    SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
                    HumanMessage(content=prompt)
                ]

                response = llm.invoke(messages)

                # Parse LLM Response
                analysis = _parse_analysis_response(response.content, table_name)

                # Create findings
                table_findings = []
                for f in analysis.get("findings", []):
                    finding = ReliabilityFinding(
                        finding_id=str(uuid4()),
                        table_name=table_name,
                        finding_type=FindingType(f.get("finding_type", "volume_anomaly")),
                        severity=Severity(f.get("severity", "low")),
                        title=f.get("title", "Unknown Issue"),
                        description=f.get("description", ""),
                        evidence=f.get("evidence", {}),
                    )
                    table_findings.append(finding)
                    all_findings.append(finding)
                
                # Create table status
                table_statuses[table_name] = TableReliabilityStatus(
                    table_name=table_name,
                    is_healthy=analysis.get("is_healthy", True),
                    overall_severity=Severity(analysis.get("overall_severity", "low")),
                    findings=table_findings,
                )
            except Exception as e:
                errors.append({
                    "phase": "analyzing",
                    "table": table_name,
                    "error": str(e)
                })
                # Create a default healthy status on error
                table_statuses[table_name] = TableReliabilityStatus(
                    table_name=table_name,
                    is_healthy=True,
                    overall_severity=Severity.LOW,
                    findings=[],
                )
        return {
            "findings": all_findings,
            "table_statuses": table_statuses,
            "current_phase": AgentPhase.REPORTING,
            "errors": errors,
        }

    except Exception as e:
        return {
            "current_phase": AgentPhase.ERROR,
            "errors": state.errors + [{"phase": "analyzing", "error": str(e)}]
        }

def _parse_analysis_response(content: str, table_name: str) -> dict:
    """Parse LLM JSON response, with fallback for malformed responses."""
    try:
        # Try to extract JSON from response
        content = content.strip()
        if content.startswith("```"):
            # Remove markdown code blocks
            lines = content.split("\n")
            content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        return json.loads(content)
    except json.JSONDecodeError:
        # Fallback: assume healthy if parsing fails
        return {"findings": [], "is_healthy": True, "overall_severity": "low"}