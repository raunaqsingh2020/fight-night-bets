from datetime import datetime, timezone

from api.supabase import create_supabase_client
import venmo_api

from config import venmo_token

# Create a Supabase client
client = create_supabase_client()


def get_outcome_odds(event_id: int, outcome: str):
    event_current_odds_data = (
        client.table("current_odds").select("*").eq("event_id", event_id).execute()
    )
    event_current_odds_data = event_current_odds_data.data[0]

    if event_current_odds_data["outcome_a"] == outcome:
        return int(event_current_odds_data["odds_a"])
    elif event_current_odds_data["outcome_b"] == outcome:
        return int(event_current_odds_data["odds_b"])

    return None


def calculate_payout(wager_amount: float, odds: int):
    payout = wager_amount
    if odds > 0:
        payout += (odds / 100.0) * wager_amount
    else:
        payout += (100.0 / abs(odds)) * wager_amount

    return float("{:.2f}".format(abs(payout)))


def place_wager_helper(
    event_id: int, outcome: str, venmo_username: str, wager_amount: float
):
    try:
        if wager_amount < 1.00 or wager_amount > 10.00:
            return False

        venmo_client = venmo_api.Client(access_token=venmo_token)

        odds = get_outcome_odds(event_id, outcome)
        payout = calculate_payout(wager_amount, odds)
        timestamp = datetime.now(timezone.utc).isoformat()

        user = venmo_client.user.search_for_users(query=venmo_username, username=True)[
            0
        ]  # assume the first person whose username matches is correct
        venmo_id = user.id
        request = venmo_client.payment.request_money(
            amount=wager_amount,
            target_user_id=venmo_id,
            note=f"{outcome} (${odds}) - Payout: ${payout})",
        )

        # get the pending transaction id
        pending_txs = venmo_client.payment.get_charge_payments()
        for pending in pending_txs:
            if (
                pending.target.id == venmo_id
                and pending.note == f"{outcome} (${odds}) - Payout: ${payout})",
            ):
                payment_id = pending.id
                break

        data = {
            "bet_amount": wager_amount,
            "event": event_id,
            "outcome": outcome,
            "timestamp": timestamp,
            "venmo_id": venmo_id,
            "venmo_username": venmo_username,
            "payment_id": payment_id,
            "payout": payout,
            "paid": False,
            "cancelled": False,
        }

        client.table("pending_txns").insert(data).execute()

        return True

    except Exception as e:
        return False
