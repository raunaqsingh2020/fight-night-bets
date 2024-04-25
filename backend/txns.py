import time
import threading
from datetime import datetime, timezone
import venmo_api

from client import create_supabase_client
from config import venmo_token


client = create_supabase_client()


def log_txns():
    venmo_client = venmo_api.Client(access_token=venmo_token)

    pending_txns_db = (
        client.table("pending_txns")
        .select("*")
        .eq("paid", False)
        .eq("cancelled", False)
        .execute()
        .data
    )

    try:
        pending_txns_venmo = venmo_client.payment.get_charge_payments()
        pending_txns_venmo = {
            str(venmo_txn.id): venmo_txn for venmo_txn in pending_txns_venmo
        }

        for db_txn in pending_txns_db:
            # check if the transaction has been paid
            paid = False
            cancelled = False
            if str(db_txn["payment_id"]) in pending_txns_venmo:
                venmo_txn = pending_txns_venmo[str(db_txn["payment_id"])]
                paid = venmo_txn.status == venmo_api.PaymentStatus.SETTLED
                cancelled = venmo_txn.status == venmo_api.PaymentStatus.CANCELLED

            if paid:
                # update the DB to reflect that the transaction has been paid
                client.table("pending_txns").update({"paid": True}).eq(
                    "payment_id", db_txn["payment_id"]
                ).execute()
                db_txn["paid"] = True
                client.table("completed_txns").upsert(db_txn).execute()
                continue
            elif cancelled:
                # update the DB to reflect that the transaction has been cancelled
                client.table("pending_txns").update({"cancelled": True}).eq(
                    "payment_id", db_txn["payment_id"]
                ).execute()
                continue
            elif time.time() - db_txn["timestamp"] > 30:
                print("Cancelling " + str(db_txn["payment_id"]) + "...")
                client.table("pending_txns").update({"cancelled": True}).eq(
                    "payment_id", db_txn["payment_id"]
                ).execute()

                try:
                    venmo_client.payment.cancel_payment(payment_id=db_txn["payment_id"])
                except Exception as e:
                    print("Error:", e)

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
