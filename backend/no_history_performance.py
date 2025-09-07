from core.chain import chain
from core.graph import graph
import asyncio
import time
from typing import List, Tuple

class PerformanceTest:
    def __init__(self):
        self.test_query = "Can you explain backend development?"
        self.results = []
    
    async def run_graph(self) -> Tuple[float, int, str]:
        """Run graph test and return (duration, token_count, response)"""
        start_time = time.time()
        response = ""
        token_count = 0
        
        input_state = {
            "messages": [],
            "query": self.test_query
        }

        print("🔄 Starting Graph Test...")
        print("=" * 50)
        
        # Use astream_events to get detailed event stream
        async for event in graph.astream_events(input_state, version="v2"):
            if event["event"] == "on_parser_stream":
                chunk = event["data"].get("chunk")
                if isinstance(chunk, str):
                    response += chunk
                    token_count += 1
                    print(chunk, end="", flush=True)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n{'=' * 50}")
        print(f"✅ Graph Test Complete")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"🔢 Tokens: {token_count}")
        print(f"📊 Tokens/sec: {token_count/duration:.2f}")
        
        return duration, token_count, response

    async def run_chain(self) -> Tuple[float, int, str]:
        """Run chain test and return (duration, token_count, response)"""
        start_time = time.time()
        response = ""
        token_count = 0
        
        print("\n🔄 Starting Chain Test...")
        print("=" * 50)
        
        async for chunk in chain.astream(self.test_query):
            response += chunk
            token_count += 1
            print(chunk, end="", flush=True)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n{'=' * 50}")
        print(f"✅ Chain Test Complete")
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"🔢 Tokens: {token_count}")
        print(f"📊 Tokens/sec: {token_count/duration:.2f}")
        
        return duration, token_count, response

    async def run_comparison(self, iterations: int = 3):
        """Run multiple iterations and compare performance"""
        print(f"🚀 Starting Performance Comparison ({iterations} iterations)")
        print("=" * 80)
        
        graph_times = []
        chain_times = []
        graph_tokens = []
        chain_tokens = []
        
        for i in range(iterations):
            print(f"\n📊 ITERATION {i+1}/{iterations}")
            print("-" * 40)
            
            # Test Graph
            graph_duration, graph_token_count, _ = await self.run_graph()
            graph_times.append(graph_duration)
            graph_tokens.append(graph_token_count)
            
            # Wait a moment between tests
            await asyncio.sleep(1)
            
            # Test Chain
            chain_duration, chain_token_count, _ = await self.run_chain()
            chain_times.append(chain_duration)
            chain_tokens.append(chain_token_count)
            
            # Wait before next iteration
            await asyncio.sleep(1)
        
        # Calculate statistics
        self.print_summary(graph_times, chain_times, graph_tokens, chain_tokens, iterations)
    
    def print_summary(self, graph_times: List[float], chain_times: List[float], 
                     graph_tokens: List[int], chain_tokens: List[int], iterations: int):
        """Print performance summary"""
        print("\n" + "=" * 80)
        print("📈 PERFORMANCE SUMMARY")
        print("=" * 80)
        
        # Graph Statistics
        avg_graph_time = sum(graph_times) / len(graph_times)
        avg_graph_tokens = sum(graph_tokens) / len(graph_tokens)
        graph_tps = [tokens/time for tokens, time in zip(graph_tokens, graph_times)]
        avg_graph_tps = sum(graph_tps) / len(graph_tps)
        
        # Chain Statistics
        avg_chain_time = sum(chain_times) / len(chain_times)
        avg_chain_tokens = sum(chain_tokens) / len(chain_tokens)
        chain_tps = [tokens/time for tokens, time in zip(chain_tokens, chain_times)]
        avg_chain_tps = sum(chain_tps) / len(chain_tps)
        
        print(f"🔗 GRAPH PERFORMANCE:")
        print(f"   Average Time: {avg_graph_time:.2f}s")
        print(f"   Average Tokens: {avg_graph_tokens:.0f}")
        print(f"   Average Tokens/sec: {avg_graph_tps:.2f}")
        print(f"   Times: {[f'{t:.2f}s' for t in graph_times]}")
        
        print(f"\n⛓️  CHAIN PERFORMANCE:")
        print(f"   Average Time: {avg_chain_time:.2f}s")
        print(f"   Average Tokens: {avg_chain_tokens:.0f}")
        print(f"   Average Tokens/sec: {avg_chain_tps:.2f}")
        print(f"   Times: {[f'{t:.2f}s' for t in chain_times]}")
        
        # Comparison
        print(f"\n⚖️  COMPARISON:")
        time_diff = avg_graph_time - avg_chain_time
        speed_ratio = avg_chain_time / avg_graph_time if avg_graph_time > 0 else 0
        
        if time_diff > 0:
            print(f"   Chain is {time_diff:.2f}s faster ({speed_ratio:.2f}x speedup)")
        else:
            print(f"   Graph is {abs(time_diff):.2f}s faster ({1/speed_ratio:.2f}x speedup)")
        
        tps_diff = avg_chain_tps - avg_graph_tps
        if tps_diff > 0:
            print(f"   Chain processes {tps_diff:.2f} more tokens/sec")
        else:
            print(f"   Graph processes {abs(tps_diff):.2f} more tokens/sec")

async def main():
    """Main test function"""
    tester = PerformanceTest()
    
    print("🧪 LLM Performance Testing Suite")
    print("=" * 80)
    print(f"Query: '{tester.test_query}'")
    print("=" * 80)
    
    # Run comparison test
    await tester.run_comparison(iterations=3)

if __name__ == "__main__":
    asyncio.run(main())
