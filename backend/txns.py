import time
import threading
from datetime import datetime, timezone
import venmo_api

from client import create_supabase_client
from config import venmo_token


client = create_supabase_client()


def calculate_payout(wager_amount: float, odds: int):
    payout = wager_amount
    if odds > 0:
        payout += (odds / 100.0) * wager_amount
    else:
        payout += (100.0 / abs(odds)) * wager_amount

    return float("{:.2f}".format(abs(payout)))


def log_txns():
    venmo_client = venmo_api.Client(access_token=venmo_token)

    # pending_txns_db = (
    #     client.table("pending_txns")
    #     .select("*")
    #     .eq("paid", False)
    #     .eq("cancelled", False)
    #     .execute()
    #     .data
    # )

    try:
        timestamp = datetime.now(timezone.utc).isoformat()
        event_data = client.table("current_odds").select("*").execute().data
        m_outcome_to_event_id = {}
        m_outcome_to_odds = {}
        for event in event_data:
            m_outcome_to_event_id[event["outcome_a"]] = event["event_id"]
            m_outcome_to_event_id[event["outcome_b"]] = event["event_id"]
            m_outcome_to_odds[event["outcome_a"]] = event["odds_a"]
            m_outcome_to_odds[event["outcome_b"]] = event["odds_b"]

        cancelled_txn_data = (
            client.table("completed_txns")
            .select("payment_id")
            .eq("cancelled", True)
            .execute()
            .data
        )
        cancelled_txn_payment_ids = set(
            [cancelled_txn["payment_id"] for cancelled_txn in cancelled_txn_data]
        )

        transactions = venmo_client.user.get_user_transactions(
            user_id="2824532226211840202"  # TODO
        )
        while transactions:
            records = []
            for txn in transactions:
                txn_id = txn.id
                txn_comment = txn.note

                if (
                    txn_comment.find("Odds subject to line movement") == -1
                    or txn_comment.find(" (") == -1
                ):
                    # print("Invalid txn: " + txn)
                    continue

                txn_outcome = txn_comment.split(" (", 1)[0].strip()
                if txn_outcome not in m_outcome_to_event_id:
                    # print("Invalid txn: " + txn)
                    continue

                if txn_id in cancelled_txn_payment_ids:
                    continue

                txn_event_id = m_outcome_to_event_id[txn_outcome]
                txn_odds = int(m_outcome_to_odds[txn_outcome])

                txn_wager_amount = 10  # TODO

                record = {
                    "payment_id": 0,
                    "venmo_id": 0,
                    "venmo_username": txn_id,
                    "event": txn_event_id,
                    "paid": False,
                    "cancelled": False,
                    "payout": calculate_payout(txn_wager_amount, txn_odds),
                    "outcome": txn_outcome,
                    "timestamp": timestamp,
                    "wager_amount": txn_wager_amount,
                    "odds": txn_odds,
                }

                records += [record]

            print(f"Upserting txns...")
            client.table("completed_txns").upsert(records).execute()

            transactions = transactions.get_next_page()

        # pending_txns_venmo = venmo_client.payment.get_charge_payments()
        # pending_txns_venmo = {
        #     str(venmo_txn.id): venmo_txn for venmo_txn in pending_txns_venmo
        # }

        # for db_txn in pending_txns_db:
        #     # check if the transaction has been paid
        #     paid = False
        #     cancelled = False
        #     if str(db_txn["payment_id"]) in pending_txns_venmo:
        #         venmo_txn = pending_txns_venmo[str(db_txn["payment_id"])]
        #         paid = venmo_txn.status == venmo_api.PaymentStatus.SETTLED
        #         cancelled = venmo_txn.status == venmo_api.PaymentStatus.CANCELLED

        #     if paid:
        #         # update the DB to reflect that the transaction has been paid
        #         client.table("pending_txns").update({"paid": True}).eq(
        #             "payment_id", db_txn["payment_id"]
        #         ).execute()
        #         db_txn["paid"] = True
        #         client.table("completed_txns").upsert(db_txn).execute()
        #         continue
        #     elif cancelled:
        #         # update the DB to reflect that the transaction has been cancelled
        #         client.table("pending_txns").update({"cancelled": True}).eq(
        #             "payment_id", db_txn["payment_id"]
        #         ).execute()
        #         continue
        #     elif time.time() - db_txn["timestamp"] > 30:
        #         print("Cancelling " + str(db_txn["payment_id"]) + "...")
        #         client.table("pending_txns").update({"cancelled": True}).eq(
        #             "payment_id", db_txn["payment_id"]
        #         ).execute()

        #         try:
        #             venmo_client.payment.cancel_payment(payment_id=db_txn["payment_id"])
        #         except Exception as e:
        #             print("Error:", e)

    except Exception as e:
        print("Error:", e)


def schedule_log_txns(period=5):
    while True:
        log_txns()
        time.sleep(period)


if __name__ == "__main__":
    # Start a new thread for scheduling the API calls
    threading.Thread(target=schedule_log_txns, daemon=True).start()

    # Keep the main thread alive
    while True:
        time.sleep(1)
