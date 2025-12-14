from src.data.snowflake_client import get_snowflake_client
from src.data.metadata_collector import MetadataCollector
from src.data.cortex_interface import get_cortex_llm
from langchain_core.messages import HumanMessage
# Test 1: Connection
client = get_snowflake_client()
result = client.execute_query("SELECT CURRENT_TIMESTAMP() as ts")
print(f"✅ Connected: {result}")
# Test 2: Metadata
collector = MetadataCollector(schema="BUSINESS_DATA")
tables = collector.get_all_tables()
print(f"✅ Tables found: {tables}")
# Test 3: Cortex LLM
llm = get_cortex_llm()
response = llm.invoke([HumanMessage(content="Say 'Cortex working!' and nothing else.")])
print(f"✅ Cortex: {response.content}")