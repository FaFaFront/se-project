import { redirect } from "next/navigation";

// Editing now happens inline on /profile; this route only exists for old links/bookmarks.
export default function EditProfilePage() {
  redirect("/profile");
}
