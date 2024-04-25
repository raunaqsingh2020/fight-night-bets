import time
import threading
from datetime import datetime, timezone

from client import create_supabase_client


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

            record = {
                "event_id": event_id,
                "timestamp": timestamp,
                "outcome_a": outcome_a,
                "outcome_b": outcome_b,
                "odds_a": -105,
                "odds_b": 105,
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


if __name__ == "__main__":
    # Start a new thread for scheduling the API calls
    threading.Thread(target=schedule_compute_odds, daemon=True).start()

    # Keep the main thread alive
    while True:
        time.sleep(1)
