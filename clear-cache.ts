import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache() {
  const { error } = await supabase
    .from("categorized_cache")
    .delete()
    .neq("material_id", "dummy");

  if (error) {
    console.error("Error clearing cache:", error);
  } else {
    console.log("CACHE CLEARED SUCCESSFULLY");
  }
}

clearCache();
