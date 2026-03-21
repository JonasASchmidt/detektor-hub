import { redirect } from "next/navigation";

// Catch-all for unknown routes — redirect to homepage instead of showing an error
export default function NotFound() {
  redirect("/findings");
}
