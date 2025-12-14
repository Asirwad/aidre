from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .signals import TableReliabilityStatus, Severity

class ReliabilityReportResponse(BaseModel):
    """Full reliability report for the data platform."""
    report_id: str
    generated_at: datetime
    overall_status: str  # "healthy", "at_risk", "critical"
    summary: str  # Human-readable summary
    tables_checked: int
    issues_found: int
    table_statuses: List[TableReliabilityStatus]

class AskResponse(BaseModel):
    """Response to a natural language query."""
    query: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_tables: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
