import sys
import os

# Ensure we can import from current directory
sys.path.append(os.getcwd())

try:
    from game_engine import MissionEngine, INTERACTIVE_SCENARIOS
    
    print("--- DEBUGGING MISSION ENGINE ---")
    print(f"Scenarios available: {list(INTERACTIVE_SCENARIOS.keys())}")
    
    slug = 'quiz_dps'
    engine = MissionEngine(slug)
    print(f"Engine Scenario Loaded: {bool(engine.scenario)}")
    print(f"Current Step ID: {engine.current_step_id}")
    
    data = engine.get_step_data()
    print(f"Step Data: {data}")
    
    if data is None:
        print("FAIL: get_step_data() returned None")
    else:
        print("SUCCESS: Data retrieved")

except Exception as e:
    print(f"CRASH: {e}")
