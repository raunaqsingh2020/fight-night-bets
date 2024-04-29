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
        .eq("refunded", True)
        .execute()
    )

    data = response.data
    users = list(set([txn["venmo_username"] for txn in data]))
    users = sorted(users, key=lambda x: x[0].lower())

    for user in users:
        print(user)


if __name__ == "__main__":
    payout()
