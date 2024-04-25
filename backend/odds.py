import time
import threading
from datetime import datetime, timezone
from client import create_supabase_client
import supabase
import os
from datetime import datetime, timezone
import time

client = create_supabase_client()


def compute_odds():
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
            odds_a, odds_b = calculate_american_odds(event_id)

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


def calculate_american_odds(event: int, max_bet: float = 10.0) -> float:
    """
    Calculate the American odds for a given event and outcome

    Params:
        event: int - the event to check
        outcome: str - the outcome to check
    """
    (
        outcome_a_wagers_resolved_sum,
        outcome_b_wagers_resolved_sum,
        outcome_a_bets_unresolved_sum,
        outcome_b_bets_unresolved_sum,
    ) = check_amount_in_pools(event)

    outcome_a_odds = round(
        outcome_b_wagers_resolved_sum
        / (outcome_a_wagers_resolved_sum + outcome_a_bets_unresolved_sum + max_bet)
        * 100
    )

    outcome_b_odds = round(
        outcome_a_wagers_resolved_sum
        / (outcome_b_wagers_resolved_sum + outcome_b_bets_unresolved_sum + max_bet)
        * 100
    )

    if outcome_a_odds < 100:
        outcome_a_odds = int(-1.0 * (100.0 / outcome_a_odds) * 100.0)

    if outcome_b_odds < 100:
        outcome_b_odds = int(-1.0 * (100.0 / outcome_b_odds) * 100.0)

    return outcome_a_odds, outcome_b_odds


def check_amount_in_pools(event: int) -> tuple[int]:
    """
    Based off the event and outcome, calculate how much is in the pools of each outcome, defined as worst possible outcome

    Params:
        event: int - the event to check
        outcome: str - the outcome to check
    """
    event_data = (
        client.table("current_odds").select("*").eq("event_id", event).execute().data[0]
    )

    outcome_a = event_data["outcome_a"]
    outcome_b = event_data["outcome_b"]

    outcome_a_wagers_resolved_sum = get_sum_of_bets(
        table="completed_txns",
        event=event,
        outcome=outcome_a,
    )

    outcome_b_wagers_resolved_sum = get_sum_of_bets(
        table="completed_txns",
        event=event,
        outcome=outcome_b,
    )

    outcome_a_wagers_unresolved_sum = get_sum_of_bets(
        table="pending_txns",
        event=event,
        outcome=outcome_a,
    )

    outcome_b_wagers_unresolved_sum = get_sum_of_bets(
        table="pending_txns",
        event=event,
        outcome=outcome_b,
    )

    return (
        outcome_a_wagers_resolved_sum,
        outcome_b_wagers_resolved_sum,
        outcome_a_wagers_unresolved_sum,
        outcome_b_wagers_unresolved_sum,
    )


def get_sum_of_bets(table: str, event: int, outcome: str):
    """
    Get the sum of the bets on a given event and outcome

    Params:
        supabase_client: supabase.Client - the client for the Supabase DB
        table: str - the table to query
        event: int - the event ID
        outcome: int - the outcome ID
    """

    query = (
        client.table(table)
        .select("wager_amount")
        .eq("event", event)
        .eq("outcome", outcome)
        .eq("cancelled", False)
    )

    result = query.execute()
    total_sum = sum(item["wager_amount"] for item in result.data)

    return total_sum


def schedule_compute_odds(period=60):
    while True:
        compute_odds()
        time.sleep(period)


if __name__ == "__main__":
    # Start a new thread for scheduling the API calls
    threading.Thread(target=schedule_compute_odds, daemon=True).start()

    # Keep the main thread alive
    while True:
        time.sleep(1)
