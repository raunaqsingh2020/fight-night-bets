from fastapi import FastAPI, HTTPException, Query
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

# from fastapi.middleware.cors import CORSMiddleware

from typing import List, Dict
from api.supabase import create_supabase_client

from api.routes.wager_routes import *

# import pprint
# pp = pprint.PrettyPrinter(indent=4)

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

app = FastAPI(middleware=middleware)


@app.get(
    "/api/place_wager",
    # response_model=,
)
async def place_wager(
    event_id: int, outcome: str, venmo_username: str, wager_amount: float
):
    return place_wager_helper(event_id, outcome, venmo_username, wager_amount)
