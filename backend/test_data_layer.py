import asyncio
from src.agents import run_reliability_check, ask_reliability_question
async def main():
    print("🔄 Running reliability check...")
    
    # Test 1: Full check
    result = await run_reliability_check()
    print(f"\n📊 Report:\n{result.get('final_response', 'No response')}")
    print(f"\n✅ Phase: {result.get('current_phase')}")
    print(f"📋 Tables checked: {list(result.get('table_statuses', {}).keys())}")
    print(f"⚠️ Issues found: {len(result.get('findings', []))}")
    
    # Test 2: Ask a question
    print("\n" + "="*50)
    print("🤔 Asking: 'Is my data reliable today?'")
    answer = await ask_reliability_question("Is my data reliable today?")
    print(f"\n💬 Answer:\n{answer}")
if __name__ == "__main__":
    asyncio.run(main())