"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <p>Session: {session ? JSON.stringify(session, null, 2) : "No session"}</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => {
            console.log("Clicking Google sign in...");
            signIn("google", { callbackUrl: "/" })
              .then(() => console.log("Sign in initiated"))
              .catch((err) => console.error("Sign in error:", err));
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </button>

        <button
          onClick={() => {
            console.log("Clicking credentials sign in...");
            signIn("credentials", {
              email: "test@example.com",
              password: "password",
              redirect: false,
            })
              .then((res) => console.log("Credentials result:", res))
              .catch((err) => console.error("Credentials error:", err));
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Sign in with Credentials
        </button>

        {session && (
          <button
            onClick={() => signOut()}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign out
          </button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Direct Link Test:</h2>
        <button
          onClick={() => window.location.href = "/api/auth/signin/google"}
          className="text-blue-600 underline cursor-pointer bg-transparent border-none p-0"
        >
          Direct Google Sign In Link
        </button>
      </div>
    </div>
  );
}