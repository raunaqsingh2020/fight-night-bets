from supabase import Client, create_client
from config import url, key

url: str = url
key: str = key


def create_supabase_client():
    supabase: Client = create_client(url, key)
    return supabase
