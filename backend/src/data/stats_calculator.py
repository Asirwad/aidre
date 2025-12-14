from typing import Dict, Optional, List
from datetime import datetime, timezone
from .snowflake_client import get_snowflake_client
from ..models.metadata import TableStats, ColumnInfo

class StatsCalculator:
    def __init__(self, database: str = None, schema: str = "BUSINESS_DATA"):
        self.client = get_snowflake_client()
        self.database = database or self.client.database
        self.schema = schema
    
    def calculate_stats(
        self, 
        table_name: str, 
        columns: List[ColumnInfo],
        timestamp_column: str = None
    ) -> TableStats:
        row_count = self._get_row_count(table_name)
        null_counts = self._get_null_counts(table_name, columns)
        
        max_timestamp = None
        freshness_hours = None
        if timestamp_column:
            max_timestamp = self._get_max_timestamp(table_name, timestamp_column)
            if max_timestamp:
                freshness_hours = self._calculate_freshness(max_timestamp)
        
        return TableStats(
            table_name=table_name,
            row_count=row_count,
            null_counts=null_counts,
            max_timestamp=max_timestamp,
            freshness_hours=freshness_hours,
        )

    def _get_row_count(self, table_name: str) -> int:
        query = f"SELECT COUNT(*) as cnt FROM {self.database}.{self.schema}.{table_name}"
        results = self.client.execute_query(query)
        return results[0]["CNT"] if results else 0

    def _get_null_counts(self, table_name: str, columns: List[ColumnInfo]) -> Dict[str, int]:
        if not columns:
            return {}
        count_exprs = [
            f"SUM(CASE WHEN {col.name} IS NULL THEN 1 ELSE 0 END) as {col.name}_nulls"
            for col in columns
        ]
        query = f"SELECT {', '.join(count_exprs)} FROM {self.database}.{self.schema}.{table_name}"
        results = self.client.execute_query(query)
        if not results:
            return {}
        row = results[0]
        return {col.name: int(row.get(f"{col.name}_NULLS", 0) or 0) for col in columns}

    def _get_max_timestamp(self, table_name: str, column: str) -> Optional[datetime]:
        query = f"SELECT MAX({column}) as max_ts FROM {self.database}.{self.schema}.{table_name}"
        results = self.client.execute_query(query)
        return results[0].get("MAX_TS") if results else None
        
    def _calculate_freshness(self, max_timestamp: datetime) -> float:
        now = datetime.now(timezone.utc)
        if max_timestamp.tzinfo is None:
            max_timestamp = max_timestamp.replace(tzinfo=timezone.utc)
        delta = now - max_timestamp
        return delta.total_seconds() / 3600