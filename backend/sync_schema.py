import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# SUPABASE_URL and SUPABASE_KEY should be in backend/.env
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase = create_client(url, key)

sql = """
create table if not exists quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  course_code text not null,
  topic_id uuid,
  score int default 0,
  total_questions int default 10,
  is_completed boolean default false,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Indexing for performance
create index if not exists idx_quizzes_user_id on quizzes(user_id);
create index if not exists idx_quizzes_course_code on quizzes(course_code);
"""

print("Attempting to execute SQL...")
try:
    # Supabase Python client doesn't have a direct 'rpc' or 'execute_sql' method for raw SQL unless configured.
    # We usually use the SQL editor in the dashboard.
    # However, I'll try to use the 'rpc' method if a generic one exists, or just document it.
    # Actually, many Supabase instances have a 'raw_sql' RPC or similar if set up.
    # If not, I'll just check if the table exists by trying to select from it.
    supabase.table("quizzes").select("id").limit(1).execute()
    print("Table 'quizzes' already exists or is accessible.")
except Exception as e:
    print(f"Table might not exist or error occurred: {e}")
    print("Please run the following SQL in the Supabase Dashboard SQL Editor:")
    print(sql)

print("\n--- SQL END ---")
