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

# Table-to-timestamp-column mapping (for freshness calculation)
TIMESTAMP_COLUMNS = {
    "FACT_EVENTS": "EVENT_TIMESTAMP",
    "DIM_USERS": "UPDATED_AT",
    "PIPELINE_RUNS": "STARTED_AT",
}
async def scan_node(state: AgentState) -> Dict:
    """
    SCANNER AGENT
    
    Collects metadata and statistics for all tables.
    
    Preconditions:
        - state.tables_to_check is populated
    
    Postconditions:
        - state.table_metadata populated
        - state.table_stats populated
        - state.current_phase = ANALYZING
    """
    try:
        collector = MetadataCollector(schema="BUSINESS_DATA")
        calculator = StatsCalculator(schema="BUSINESS_DATA")
        
        table_metadata: Dict[str, TableMetadata] = {}
        table_stats: Dict[str, TableStats] = {}
        errors = list(state.errors)  # Copy existing errors
        
        # If no tables specified, get all tables
        tables = state.tables_to_check
        if not tables:
            tables = collector.get_all_tables()
        
        for table_name in tables:
            try:
                # Collect metadata
                metadata = collector.get_table_metadata(table_name)
                table_metadata[table_name] = metadata
                
                # Calculate statistics
                timestamp_col = TIMESTAMP_COLUMNS.get(table_name)
                stats = calculator.calculate_stats(
                    table_name, 
                    metadata.columns,
                    timestamp_column=timestamp_col
                )
                table_stats[table_name] = stats
                
            except Exception as e:
                errors.append({
                    "phase": "scanning",
                    "table": table_name,
                    "error": str(e)
                })
                continue  # Process remaining tables
        
        return {
            "table_metadata": table_metadata,
            "table_stats": table_stats,
            "current_phase": AgentPhase.ANALYZING,
            "errors": errors,
        }
        
    except Exception as e:
        return {
            "current_phase": AgentPhase.ERROR,
            "errors": state.errors + [{"phase": "scanning", "error": str(e)}]
        }