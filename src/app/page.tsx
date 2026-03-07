import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, go to dashboard. If not, go to login.
  if (!user) {
    redirect("/login");
  } else {
    redirect("/dashboard/clients/new");
  }
}