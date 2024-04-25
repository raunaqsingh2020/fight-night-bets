import time
import threading
from datetime import datetime, timezone
from client import create_supabase_client
import supabase
import os
import venmo_api
from datetime import datetime, timezone
from dotenv import load_dotenv
import time


def compute_odds():
    client = create_supabase_client()
    event_data, _ = (
        client.table("current_odds").select("event_id, outcome_a, outcome_b").execute()
    )
    event_data = event_data[1]

    timestamp = datetime.now(timezone.utc).isoformat()
    records = []

    try:
        for event in event_data:

            event_id = event["event_id"]
            outcome_a = event["outcome_a"]
            outcome_b = event["outcome_b"]
            odds_a, odds_b = calculate_american_odds(event["event_id"])

            record = {
                "event_id": event_id,
                "timestamp": timestamp,
                "outcome_a": outcome_a,
                "outcome_b": outcome_b,
                "odds_a": odds_a,
                "odds_b": odds_b,
            }

            records += [record]

        print(f"Upserting records for event odds ...")
        _, _ = client.table("current_odds").upsert(records).execute()
        _, _ = client.table("historical_odds").upsert(records).execute()

    except Exception as e:
        print("Error:", e)

def schedule_compute_odds(period=60):
    while True:
        compute_odds()
        time.sleep(period)

def calculate_american_odds(event:int, max_bet:float=10.0)->float:
    """
    Calculate the American odds for a given event and outcome

    Params: 
        event: int - the event to check
        outcome: str - the outcome to check
        amount: float - the amount to bet
    """
    load_dotenv()

    # Connect to the DB
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase_client = supabase.create_client(url, key)

    # get the pool sizes
    outcome_a_bets_sum, outcome_b_bets_sum, outcome_a_bets_unresolved, outcome_b_bets_unresolved = check_amount_in_pools(event, supabase_client)

    # get the odds
    outcome_a_odds = round(outcome_b_bets_sum / (outcome_a_bets_sum +outcome_a_bets_unresolved+max_bet)*100)
    outcome_b_odds = round(outcome_a_bets_sum / (outcome_b_bets_sum + outcome_b_bets_unresolved+max_bet)*100)

    return outcome_a_odds, outcome_b_odds

def check_amount_in_pools(event:int, supabase_client)->tuple[int]:
    """
    Based off the event and outcome, calculate how much is in the pools of each outcome, defined as worst possible outcome

    Params: 
        event: int - the event to check
        outcome: str - the outcome to check
    """
    # get the fight 
    fight_data = supabase_client.table("current_odds").select("*").eq("event_id", event).order('timestamp', desc=True).limit(1).execute().data[0]
    outcome_a = fight_data['outcome_a']
    outcome_b = fight_data['outcome_b']

    # get the fight's resolved bets
    outcome_a_bets_sum = get_sum_of_bets(supabase_client=supabase_client, table='completed_txns', event=event, outcome=outcome_a, outcome_check='eq')
    outcome_b_bets_sum = get_sum_of_bets(supabase_client=supabase_client, table='completed_txns', event=event, outcome=outcome_b, outcome_check='eq')

    # get the unresolved bets that are not yet cancelled 
    outcome_a_bets_unresolved = get_sum_of_bets(supabase_client=supabase_client, table='pending_txns', event=event, outcome=outcome_a, outcome_check='eq')
    outcome_b_bets_unresolved = get_sum_of_bets(supabase_client=supabase_client, table='pending_txns', event=event, outcome=outcome_b, outcome_check='neq')
    
    return (outcome_a_bets_sum, outcome_b_bets_sum, outcome_a_bets_unresolved, outcome_b_bets_unresolved)

def get_sum_of_bets(supabase_client:supabase.Client, table:str, event:int, outcome:str, outcome_check='eq'):
    """
    Get the sum of the bets on a given event and outcome

    Params: 
        supabase_client: supabase.Client - the client for the Supabase DB
        table: str - the table to query
        event: int - the event ID
        outcome: int - the outcome ID
        outcome_check: str - the comparison operator for the outcome
    """
    # Construct the basic query
    query = supabase_client.table(table).select("bet_amount").eq("event", event).eq("cancelled", False)

    # Adjust the query based on outcome condition
    if outcome_check == 'eq':
        query = query.eq("outcome", outcome)
    elif outcome_check == 'neq':
        query = query.neq("outcome", outcome)

    # Execute the query
    result = query.execute()

    # Check for errors or empty data
    if not result.data:
        print("No data found.")
        raise ValueError("No data found.")

    # Calculate the sum of bet_amount
    total_sum = sum(item['bet_amount'] for item in result.data)
    return total_sum

if __name__ == "__main__":
    # Start a new thread for scheduling the API calls
    threading.Thread(target=schedule_compute_odds, daemon=True).start()

    # Keep the main thread alive
    while True:
        time.sleep(1)
