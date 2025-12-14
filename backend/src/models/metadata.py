from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnInfo(BaseModel):
    """Metadata for a single column."""
    name: str
    data_type: str
    is_nullable: bool
    ordinal_position: int

class TableMetadata(BaseModel):
    """Complete metadata for a monitored table."""
    database: str
    schema_name: str = Field(alias="schema")
    table_name: str
    row_count: int
    columns: List[ColumnInfo]
    last_altered: Optional[datetime] = None

    class Config:
        populate_by_name = True

class TableStats(BaseModel):
    """Statistical snapshot of a table."""
    table_name: str
    row_count: int
    null_counts: Dict[str, int]  # column_name -> null count
    max_timestamp: Optional[datetime] = None  # Latest data point
    freshness_hours: Optional[float] = None
    captured_at: datetime = Field(default_factory=datetime.utcnow)