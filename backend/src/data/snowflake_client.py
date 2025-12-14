import os
from contextlib import contextmanager
from typing import Generator, Any, List, Dict

import snowflake.connector
from snowflake.connector import SnowflakeConnection
from dotenv import load_dotenv

load_dotenv()

class SnowflakeClient:
    """
    Manages Snowflake connections.
    
    Usage:
        client = SnowflakeClient()
        with client.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
    """
    def __init__(self):
        self.account = os.getenv("SNOWFLAKE_ACCOUNT")
        self.user = os.getenv("SNOWFLAKE_USERNAME")
        self.password = os.getenv("SNOWFLAKE_PASSWORD")
        self.warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")
        self.database = os.getenv("SNOWFLAKE_DATABASE")
        self.schema = os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC")
        self.role = os.getenv("SNOWFLAKE_ROLE")

        self._validate_config()

    def _validate_config(self) -> None:
        """Fail fast if config is missing."""
        required = ["account", "user", "password", "warehouse", "database"]
        missing = [k for k in required if not getattr(self, k)]
        if missing:
            raise ValueError(f"Missing Snowflake config: {missing}") 

    @contextmanager
    def get_connection(self) -> Generator[SnowflakeConnection, None, None]:
        """
        Context manager for Snowflake connections.
        
        Ensures connection is always closed, even on exception.
        """
        conn = None
        try:
            conn = snowflake.connector.connect(
                account=self.account,
                user=self.user,
                password=self.password,
                warehouse=self.warehouse,
                database=self.database,
                schema=self.schema,
                role=self.role,
            )
            yield conn
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Execute a query and return results as list of dicts.
        
        This is a convenience method for simple queries.
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(query, params)
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            finally:
                cursor.close()

# Module-level singleton for convenience
_client: SnowflakeClient = None

def get_snowflake_client() -> SnowflakeClient:
    """Get or create the Snowflake client singleton."""
    global _client
    if _client is None:
        _client = SnowflakeClient()
    return _client
