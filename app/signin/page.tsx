import type { Metadata } from "next";
import SignInClient from "./SignInClient";

export const metadata: Metadata = { title: "Sign in — Staged" };

export default function SignInPage() {
  return <SignInClient />;
}
