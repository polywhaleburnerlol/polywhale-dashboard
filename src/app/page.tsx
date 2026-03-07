import { redirect } from "next/navigation";

export default function Home() {
  // No auth checks here. Just attempt to go straight to the dashboard.
  // The middleware.ts will automatically intercept this and physically block you 
  // by redirecting to /login if you aren't authenticated.
  redirect("/dashboard/clients/new");
}