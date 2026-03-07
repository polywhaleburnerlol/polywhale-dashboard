import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, send to login. If logged in, send to the onboarding form.
  if (!user) {
    redirect("/login");
  } else {
    redirect("/dashboard/clients/new");
  }
}