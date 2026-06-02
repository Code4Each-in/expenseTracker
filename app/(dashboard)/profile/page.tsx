"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { LogOut, Loader2, Save, Settings } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();

  // Initialise form when profile loads
  if (profile && !fullName) {
    setFullName(profile.full_name);
  }

  const handleSave = async () => {
    if (!profile || !fullName.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <>
        <Header title="Profile" />
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </>
    );
  }

  if (!profile) return null;

  return (
    <>
      <Header title="Profile" />
      <div className="px-4 py-4 space-y-4">
        {/* Avatar + info */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(profile.full_name)}
              </div>
              <div>
                <p className="font-bold text-lg">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge
                  variant={profile.role === "admin" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {profile.role === "admin" ? "Admin" : "Member"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Edit Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !fullName.trim() ||
                fullName.trim() === profile.full_name
              }
              className="w-full"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Sign out */}
        <Button
          variant="destructive"
          className="w-full h-12"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Sign Out
        </Button>
      </div>
    </>
  );
}
