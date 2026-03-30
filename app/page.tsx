import { redirect } from "next/navigation"
import { DEFAULT_HOUSE_SLUG } from "@/lib/houses"

export default function HomePage() {
  redirect(`/house/${DEFAULT_HOUSE_SLUG}`)
}
