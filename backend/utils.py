import supabase
import os
import venmo_api
from dotenv import load_dotenv
import time


def calculate_payoff_from_odds(american_odds: int, bet_amount: float):
    """
    Calculate the total payoff for a bet based on the odds and the amount bet

    Params:
    american_odds (int): The odds of the bet in American format
    bet_amount (float): The amount of money bet on the bet
    """
    if american_odds > 0:
        # Positive odds: Calculate profit based on a $100 bet
        profit = (american_odds / 100) * bet_amount
    else:
        # Negative odds: Calculate profit based on needing to bet $100 to win the odds
        profit = (bet_amount / abs(american_odds)) * 100

    # Total payoff is the initial bet plus the profit
    total_payoff = bet_amount + profit
    return total_payoff


def calculate_payoff_from_fight(
    bet_amount: float, fight: int, fighter: str, fee: float = 0.05
) -> float:
    """ "
    Calculates the payout for a given bet amount, fight, and fighter

    Params:
    bet_amount (float): The amount of money bet
    fight (int): the key of the fight
    fighter (int): the key of the fighter
    fee (float): the spread charged by the book
    """

    load_dotenv()

    # Connect to the DB
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase_client = supabase.create_client(url, key)

    # get the fight
    fight_data = (
        supabase_client.table("current_odds")
        .select("*")
        .eq("event_id", fight)
        .order("timestamp", desc=True)
        .limit(1)
        .execute()
        .data[0]
    )

    # get the odds
    if fight_data["outcome_a"] == fighter:
        odds = fight_data["odds_a"]
    elif fight_data["outcome_b"] == fighter:
        odds = fight_data["odds_b"]

    # calculate the payoff
    return round(calculate_payoff_from_odds(odds, bet_amount) * (1 - fee), 2)


def create_bet_request(
    bet_amount: float,
    fight: int,
    fighter: str,
    venmo_id: str,
    timestamp=int(time.time()),
    paid: bool = False,
    bet_bounds: tuple[float] = (0.1, 10.0),
):
    """
    Create a bet request and record it in Supabase
    Params:
        bet_amount: float - the amount of the bet
        fight: str - the fight that the bet is on
        fighter: str - the fighter that the bet is on
        timestamp: int - the timestamp of the bet
        venmo_id: str - the venmo id of the person who made the bet
        paid: bool - whether or not the bet has been paid
    """
    # check if valid bet size
    if bet_amount < bet_bounds[0] or bet_amount > bet_bounds[1]:
        raise ValueError(
            f"Bet amount must be between {bet_bounds[0]} and {bet_bounds[1]}"
        )

    load_dotenv()

    # Connect to the DB
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase_client = supabase.create_client(url, key)

    # connect to Venmo client
    venmo_token = os.getenv("VENMO_ACCESS_TOKEN")
    print("Venmo token:", venmo_token)
    venmo_client = venmo_api.Client(access_token=venmo_token)

    # calculate the payout
    payout = calculate_payoff_from_fight(bet_amount, fight, fighter)

    # send the bet request
    user = venmo_client.user.search_for_users(query=venmo_id, username=True)[
        0
    ]  # assume the first person whos ID matches is correct
    user_id = user.id
    request = venmo_client.payment.request_money(
        amount=bet_amount,
        target_user_id=user_id,
        note=f"Fight: {fight}; fighter: {fighter}; amount: {bet_amount}; timestamp: {timestamp}; potential_payout: {payout}",
    )

    # get the pending transaction ID
    pending_txs = venmo_client.payment.get_charge_payments()
    for pending in pending_txs:
        if (
            pending.target.id == user_id
            and pending.note
            == f"Fight: {fight}; fighter: {fighter}; amount: {bet_amount}; timestamp: {timestamp}; potential_payout: {payout}"
        ):
            payment_id = pending.id
            break

    data = {
        "bet_amount": bet_amount,
        "event": fight,
        "outcome": fighter,
        "timestamp": timestamp,
        "venmo_id": user_id,
        "venmo_username": venmo_id,
        "payment_id": payment_id,
        "payout": payout,
        "paid": paid,
        "cancelled": False,
    }

    # record the request in supabase
    supabase_client.table("pending_txns").insert(data).execute()


def check_paid_bet_requests():
    """
    Check if any bet requests have been paid and update the Supabase table
    """
    load_dotenv()

    # Connect to the DB
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase_client = supabase.create_client(url, key)

    # connect to Venmo client
    venmo_token = os.getenv("VENMO_ACCESS_TOKEN")
    venmo_client = venmo_api.Client(access_token=venmo_token)

    # get all pending transactions in DB
    pending_txns_db = (
        supabase_client.table("pending_txns")
        .select("*")
        .eq("paid", False)
        .eq("cancelled", False)
        .execute()
        .data
    )

    # get all pending transactions in venmo
    pending_txns_venmo = venmo_client.payment.get_charge_payments()
    paid = False
    cancelled = False
    for db_txn in pending_txns_db:
        # check if the transaction has been paid
        for venmo_txn in pending_txns_venmo:
            print(venmo_txn)
            if str(db_txn["payment_id"]) == venmo_txn.id:
                print(db_txn)
                print(venmo_txn)
                print(paid)
                paid = (
                    venmo_txn.status == venmo_api.PaymentStatus.SETTLED
                )  # check if the txn has settled
                cancelled = venmo_txn.status == venmo_api.PaymentStatus.CANCELLED
                print(paid)
                print(cancelled)
                break
        if paid:
            # update the DB to reflect that the transaction has been paid
            supabase_client.table("pending_txns").update({"paid": True}).eq(
                "payment_id", db_txn["payment_id"]
            ).execute()
            db_txn["paid"] = True
            supabase_client.table("completed_txns").upsert(db_txn).execute()
            continue
        elif cancelled:
            # update the DB to reflect that the transaction has been cancelled
            supabase_client.table("pending_txns").update({"cancelled": True}).eq(
                "payment_id", db_txn["payment_id"]
            ).execute()
            continue
        elif (
            time.time() - db_txn["timestamp"] > 120
        ):  # if the payment has been outstanding for more than 2 mins
            print("Cancelling")
            # record in the database that the transaction has been cancelled
            supabase_client.table("pending_txns").update({"cancelled": True}).eq(
                "payment_id", db_txn["payment_id"]
            ).execute()

            # if the transaction is older than 2 minutes, cancel it
            try:
                venmo_client.payment.cancel_payment(payment_id=db_txn["payment_id"])
            except Exception as e:
                print(e)
                continue


def pay_bets_out(fight: int, victorious_fighter: int):
    """
    Pay the victorious fighter out in the DB

    Params:
        fight: int - the fight that the bet is on
        victorious_fighter: int - the fighter that won the fight
    """
    load_dotenv()

    # Connect to the DB
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    supabase_client = supabase.create_client(url, key)

    # connect to Venmo client
    venmo_token = os.getenv("VENMO_ACCESS_TOKEN")
    venmo_client = venmo_api.Client(access_token=venmo_token)

    # get all completed transactiosn matching the fight and fighter
    completed_txns = (
        supabase_client.table("completed_txns")
        .select("*")
        .eq("event", fight)
        .eq("outcome", victorious_fighter)
        .eq("paid", True)
        .eq("cancelled", False)
        .execute()
        .data
    )
    print(completed_txns)

    for txn in completed_txns:
        print(completed_txns)
        # turn the transaction into "cancelled"
        supabase_client.table("completed_txns").update({"cancelled": True}).eq(
            "payment_id", txn["payment_id"]
        ).execute()
        # pay out the bet
        venmo_client.payment.send_money(
            amount=txn["payout"],
            target_user_id=txn["venmo_id"],
            note=f"Congratulations! You won on fight {fight} on fighter {victorious_fighter}",
        )
        # update the DB to reflect that the transaction has been paid
        supabase_client.table("completed_txns").update({"paid": True}).eq(
            "payment_id", txn["payment_id"]
        ).execute()
