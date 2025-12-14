from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FindingType(str, Enum):
    FRESHNESS = "freshness"
    SCHEMA_DRIFT = "schema_drift"
    VOLUME_ANOMALY = "volume_anomaly"
    NULL_SPIKE = "null_spike"
    DISTRIBUTION_DRIFT = "distribution_drift"
    ORPHAN_RECORDS = "orphan_records"

class ReliabilityFinding(BaseModel):
    """A single detected reliability issue."""
    finding_id: str
    table_name: str
    finding_type: FindingType
    severity: Severity
    title: str  # Short, human-readable
    description: str  # Detailed explanation
    evidence: Dict[str, Any]  # Supporting data
    detected_at: datetime = Field(default_factory=datetime.utcnow)

class TableReliabilityStatus(BaseModel):
    """Overall reliability status for a table."""
    table_name: str
    is_healthy: bool
    overall_severity: Severity
    findings: List[ReliabilityFinding]
    checked_at: datetime = Field(default_factory=datetime.utcnow)
