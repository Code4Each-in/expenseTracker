"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setMagicSent(true);
    }
  };

  if (magicSent) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-1">
            We sent a magic link to
          </p>
          <p className="font-semibold text-foreground mb-4">{email}</p>
          <p className="text-sm text-muted-foreground">
            Tap the link in the email to sign in. You can close this tab.
          </p>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => setMagicSent(false)}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <span className="text-5xl">💰</span>
        </div>
        <CardTitle className="text-2xl">Family Expense Tracker</CardTitle>
        <CardDescription className="text-base">
          Track your family expenses together
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="text-base h-14"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Mail className="mr-2 h-5 w-5" />
            )}
            {loading ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          No password needed. We&apos;ll email you a secure link to sign in.
        </p>
      </CardContent>
    </Card>
  );
}
