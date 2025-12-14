from typing import List, Optional
from datetime import datetime
from .snowflake_client import get_snowflake_client
from ..models.metadata import TableMetadata, ColumnInfo

class MetadataCollector:
    """Collects table metadata from Snowflake."""
    def __init__(self, database: str = None, schema: str = None):
        self.client = get_snowflake_client()
        self.database = database or self.client.database
        self.schema = schema

    def get_table_metadata(self, table_name: str) -> TableMetadata:
        columns = self._get_columns(table_name)
        if not columns:
            raise ValueError(f"Table {table_name} not found")
        row_count = self._get_row_count(table_name)
        last_altered = self._get_last_altered(table_name)

        return TableMetadata(
            database=self.database,
            schema=self.schema,
            table_name=table_name,
            row_count=row_count,
            columns=columns,
            last_altered=last_altered,
        )
    
    def get_all_tables(self) -> List[str]:
        query = """
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE'
        """
        results = self.client.execute_query(query, (self.schema,))
        return [r["TABLE_NAME"] for r in results]
    
    def _get_columns(self, table_name: str) -> List[ColumnInfo]:
        query = """
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
            ORDER BY ORDINAL_POSITION
        """
        results = self.client.execute_query(query, (self.schema, table_name))
        return [
            ColumnInfo(
                name=r["COLUMN_NAME"],
                data_type=r["DATA_TYPE"],
                is_nullable=r["IS_NULLABLE"] == "YES",
                ordinal_position=r["ORDINAL_POSITION"],
            )
            for r in results
        ]
    
    def _get_row_count(self, table_name: str) -> int:
        query = f"SELECT COUNT(*) as cnt FROM {self.database}.{self.schema}.{table_name}"
        results = self.client.execute_query(query)
        return results[0]["CNT"] if results else 0
    
    def _get_last_altered(self, table_name: str) -> Optional[datetime]:
        query = """
            SELECT LAST_ALTERED FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
        """
        results = self.client.execute_query(query, (self.schema, table_name))
        return results[0].get("LAST_ALTERED") if results else None