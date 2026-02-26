import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://clkllamdzngssvmzmtht.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsa2xsYW1kem5nc3N2bXptdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjYyNDgsImV4cCI6MjA4NzI0MjI0OH0.ZtPaPmU5Lp1shp60MbzlUPYLLnUkHDrC1m1SqiKM4QU"
)