from collections import defaultdict
import time

import venmo_api

from client import create_supabase_client
from config import venmo_token

client = create_supabase_client()
venmo_client = venmo_api.Client(access_token=venmo_token)

# def test():
#     unique_users = set(
#         [
#             data["venmo_username"]
#             for data in client.table("completed_txns")
#             .select("venmo_username")
#             .execute()
#             .data
#         ]
#     )
#     print(len(unique_users))

# Initialize api client using an access-token


def payout():
    supabase = create_supabase_client()

    response = (
        supabase.table("completed_txns")
        .select("venmo_id, venmo_username, wager_amount")
        .eq("cancelled", False)
        .eq("refunded", False)
        .execute()
    )

    data = response.data

    venmo_id_to_user = {}
    for item in data:
        venmo_id_to_user[item["venmo_id"]] = item["venmo_username"]

    totals = defaultdict(float)
    for item in data:
        totals[item["venmo_id"]] += item["wager_amount"]

    total_refunds_left = 0
    out = []
    for venmo_id, total in totals.items():
        output = (venmo_id_to_user[venmo_id], venmo_id, total)
        out += [output]
        total_refunds_left += float(total)

    i = 0
    refunding = 0
    refunded_users = []
    out = sorted(out, key=lambda x: x[0].lower())
    for refund in out:
        if i < 10:
            print(refund)
            venmo_user, venmo_id, total = refund
            venmo_client.payment.send_money(
                amount=total,
                target_user_id=venmo_id,
                note="Refund from fitenitebets. An additional award for testing will be coming soon! Check the Penn Boxing ig soon for more info.",
            )
            refunding += total
            refunded_users += [venmo_user]
            time.sleep(30)
            i += 1

    print("TOTAL REFUNDS: $" + str(total_refunds_left))
    print("TOTAL REFUNDED: $" + str(refunding))
    print("TOTAL REFUNDS LEFT: $" + str(total_refunds_left - refunding))

    print("REFUNDED USERS: ")
    print(refunded_users)

    for user in refunded_users:
        user_txns = (
            supabase.table("completed_txns")
            .select("*")
            .eq("venmo_username", user)
            .execute()
        )
        user_txns = user_txns.data

        for txn in user_txns:
            txn["refunded"] = True
            supabase.table("completed_txns").upsert(txn).execute()

    # print(records)
    # supabase.table("completed_txns").upsert(records)


if __name__ == "__main__":
    payout()
