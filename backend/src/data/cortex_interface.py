import os
from langchain_community.chat_models import ChatSnowflakeCortex
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()


def get_cortex_llm(
    model: str = "llama3.1-8b",
    temperature: float = 0.1,
    max_tokens: int = 2048
) -> ChatSnowflakeCortex:
    """
    Get a LangChain ChatModel backed by Snowflake Cortex.
    
    This integrates seamlessly with LangGraph agents.
    
    Available models: llama3.1-8b, llama3.1-70b, mistral-large, etc.
    """
    return ChatSnowflakeCortex(
        model=model,
        cortex_function="complete",
        temperature=temperature,
        max_tokens=max_tokens,
    )

def analyze_with_cortex(
    table_name: str,
    metadata: dict,
    stats: dict,
    llm: ChatSnowflakeCortex = None
) -> str:
    """
    Analyze table reliability using Cortex LLM.
    
    Returns structured analysis of potential issues.
    """
    if llm is None:
        llm = get_cortex_llm()

    system_prompt = """You are an expert Data Reliability Engineer.
        Analyze the provided table metadata and statistics to identify reliability issues.
        For each issue found, provide:
        1. Issue Type (freshness, schema_drift, volume_anomaly, null_spike)
        2. Severity (low, medium, high, critical)
        3. Description of the problem
        4. Evidence supporting your finding
        If no issues are found, state that the table appears healthy.
        Be concise and actionable."""
    
    user_prompt = f"""Analyze this table for reliability issues:
        Table: {table_name}
        Metadata: {metadata}
        Statistics: {stats}
        Provide your analysis:"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)
    return response.content