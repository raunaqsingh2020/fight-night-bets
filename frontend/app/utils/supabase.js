import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://grvhcyivfpbedachedey.supabase.co" // process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydmhjeWl2ZnBiZWRhY2hlZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM4NTM4MDQsImV4cCI6MjAyOTQyOTgwNH0.v_BqhRb0RvcVx5NdmvaVyiHeIIP6wEVsRM5MIFjl5_0"; // process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
