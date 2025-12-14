from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
from ..models.metadata import TableMetadata, TableStats
from ..models.signals import ReliabilityFinding, TableReliabilityStatus

class AgentPhase(str, Enum):
    """Explicit state machine phases."""
    INITIALIZED = "initialized"
    SCANNING = "scanning"
    ANALYZING = "analyzing"
    REPORTING = "reporting"
    COMPLETE = "complete"
    ERROR = "error"

class AgentState(BaseModel):
    """
    The canonical state that flows through the LangGraph.
    
    INVARIANT: This state must be serializable and reconstructable.
    INVARIANT: Every phase transition must be explicit.
    """
    # Run metadata
    run_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    current_phase: AgentPhase = AgentPhase.INITIALIZED
    
    # User input (if query mode)
    user_query: Optional[str] = None
    
    # Tables to monitor
    tables_to_check: List[str] = Field(default_factory=list)
    
    # Collected data (populated by Scanner)
    table_metadata: Dict[str, TableMetadata] = Field(default_factory=dict)
    table_stats: Dict[str, TableStats] = Field(default_factory=dict)
    
    # Analysis results (populated by Analyzer)
    findings: List[ReliabilityFinding] = Field(default_factory=list)
    table_statuses: Dict[str, TableReliabilityStatus] = Field(default_factory=dict)
    
    # Final output (populated by Reporter)
    report_summary: Optional[str] = None
    final_response: Optional[str] = None
    
    # Error tracking
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    
    class Config:
        # Allow mutation during graph execution
        arbitrary_types_allowed = True