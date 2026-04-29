"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Edit3,
  Save,
  X,
  Star,
  Trophy,
  Calendar,
  Award,
  Download,
  Loader2,
  Flame,
  Lock,
} from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { useLevel } from "@/hooks/use-level";
import { useAppStore } from "@/lib/store";
import { updateUser } from "@/lib/data";

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const store = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const user = useUser();
  const [badges, setBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const { level, mbToNextLevel, progressPct } = useLevel();

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || "",
    website: user?.website || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
    country: user?.country || "",
    title: user?.title || "",
    username: user?.username || "",
    openToWork: user?.openToWork ?? false,
    twitter: user?.twitter || "",
    resume: user?.resume || "",
    avatar: user?.avatar || "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAchievements() {
      const achievements = await store.getUserAchievement();
      if (!achievements?.length) return;
      if (!cancelled) {
        // Show ALL achievements with progress, not just completed ones
        setAchievements(achievements);
      }
    }

    async function loadBadges() {
      const badges = await store.getBadges();
      if (!cancelled) {
        setBadges(badges);
      }
    }

    loadAchievements();
    loadBadges();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    // Exclude email from update (read-only field)
    const { email, ...updateData } = formData;
    const updatedUser = await store.updateUser(updateData);
    if (updatedUser) {
      updateUser(updatedUser!);
      // Force state update to trigger re-render
      setFormData({
        name: updatedUser?.name || "",
        email: updatedUser?.email || "",
        phone: updatedUser?.phone || "",
        address: updatedUser?.address || "",
        bio: updatedUser?.bio || "",
        website: updatedUser?.website || "",
        github: updatedUser?.github || "",
        linkedin: updatedUser?.linkedin || "",
        country: updatedUser?.country || "",
        title: updatedUser?.title || "",
        username: updatedUser?.username || "",
        openToWork: updatedUser?.openToWork ?? false,
        twitter: updatedUser?.twitter || "",
        resume: updatedUser?.resume || "",
        avatar: updatedUser?.avatar || "",
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current user values
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      bio: user?.bio || "",
      website: user?.website || "",
      github: user?.github || "",
      linkedin: user?.linkedin || "",
      country: user?.country || "",
      title: user?.title || "",
      username: user?.username || "",
      openToWork: user?.openToWork ?? false,
      twitter: user?.twitter || "",
      resume: user?.resume || "",
      avatar: user?.avatar || "",
    });
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    //get image url from file here
    const imageUrl = URL.createObjectURL(file);
    // set a temporary preview URL while uploading
    setFormData((prev) => ({ ...prev, avatar: imageUrl }));
    // update localstorage user data immediately for instant UI update
    localStorage.setItem("user", JSON.stringify({ ...user, avatar: imageUrl }));

    setAvatarUploading(true);
    try {
      const { signedUrl, publicUrl } = await store.getUploadUrl("avatar");

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Upload directly to R2 using presigned URL
      const response = await fetch(signedUrl, {
        method: "PUT",
        body: arrayBuffer,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      // Save the public URL to user profile
      const updated = await store.updateUser({
        avatar: publicUrl + "?t=" + Date.now(),
      }); // Cache-busting query param
      if (updated) {
        console.log(updated, publicUrl);
        updateUser(updated);
        // Update formData to show the new avatar immediately
        setFormData((prev) => ({ ...prev, avatar: publicUrl }));
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  // Statistics with real data (not dummy)
  const stats = [
    {
      label: "Courses Completed",
      value: user?.numberOfCoursesCompleted ?? 0,
      icon: Trophy,
    },
    {
      label: "Projects Built",
      value: user?.numberOfProjectsBuilt ?? 0,
      icon: Award,
    },
    {
      label: "Total MB",
      value: user?.points?.toLocaleString() ?? "0",
      icon: Star,
    },
    {
      label: "Current Streak",
      value: `${user?.currentStreak ?? user?.streak ?? 0} days`,
      icon: Calendar,
    },
    {
      label: "Longest Streak",
      value: `${user?.longestStreak ?? 0} days`,
      icon: Flame,
    },
  ];

  return (
    <div className="px-4 py-6 md:py-8 lg:py-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage
                      src={formData.avatar || "/placeholder.svg"}
                      alt={formData.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-lg">
                      {formData?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Edit3 className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-primary" />
                          {formData.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2"
                      >
                        Email
                        {isEditing && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-primary" />
                          {formData.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New fields: Title & Username */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      {isEditing ? (
                        <Input
                          id="title"
                          placeholder="e.g., Senior Backend Engineer"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {formData.title || "Not specified"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      {isEditing ? (
                        <Input
                          id="username"
                          placeholder="username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {formData.username || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-primary" />
                          {formData.phone || "Not specified"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Location</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          {formData?.address || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      {isEditing ? (
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          {formData?.country || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {formData.bio || "Not specified"}
                  </p>
                )}
              </div>

              <Separator />

              {/* Professional Info: Open to Work & Twitter */}
              <div className="space-y-4">
                <Label>Professional Info</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-xs">
                      Twitter/X
                    </Label>
                    {isEditing ? (
                      <Input
                        id="twitter"
                        placeholder="twitter_handle"
                        value={formData.twitter}
                        onChange={(e) =>
                          setFormData({ ...formData, twitter: e.target.value })
                        }
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {formData.twitter
                          ? `@${formData.twitter}`
                          : "Not specified"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="openToWork" className="text-xs">
                        Open to Work
                      </Label>
                      {isEditing ? (
                        <input
                          id="openToWork"
                          type="checkbox"
                          checked={formData.openToWork}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              openToWork: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      ) : (
                        <Badge
                          variant={
                            formData.openToWork ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {formData.openToWork ? "Yes" : "No"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Resume URL */}
              <div className="space-y-2">
                <Label htmlFor="resume">Resume URL</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      id="resume"
                      type="url"
                      placeholder="https://example.com/resume.pdf"
                      value={formData.resume}
                      onChange={(e) =>
                        setFormData({ ...formData, resume: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Link to your resume PDF or document
                    </p>
                  </div>
                ) : formData.resume ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={formData.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      View Resume
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No resume link added
                  </p>
                )}
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-4">
                <Label>Social Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-xs">
                      Website
                    </Label>
                    {isEditing ? (
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-primary" />
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.website
                            ? formData.website.substring(0, 20) + "..."
                            : "Not specified"}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-xs">
                      GitHub
                    </Label>
                    {isEditing ? (
                      <Input
                        id="github"
                        value={formData.github}
                        onChange={(e) =>
                          setFormData({ ...formData, github: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Github className="h-4 w-4 text-primary" />
                        <a
                          href={formData.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.github
                            ? formData.github?.substring(0, 20) + "..."
                            : "Not specified"}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-xs">
                      LinkedIn
                    </Label>
                    {isEditing ? (
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) =>
                          setFormData({ ...formData, linkedin: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="h-4 w-4 text-primary" />
                        <a
                          href={formData.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData?.linkedin
                            ? formData?.linkedin.substring(0, 20) + "..."
                            : "Not specified"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center items-center gap-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={level?.icon} alt={user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {level?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="text-2xl font-bold">Level {user?.level}</div>
                  <div className="text-sm text-muted-foreground">
                    {level?.name}
                  </div>
                </div>
              </div>
              <Progress
                value={progressPct}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{user?.points?.toLocaleString()} MB</span>
                <span>
                  {mbToNextLevel?.toLocaleString()} MB to Level{" "}
                  {user?.level + 1}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Member Since */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Member since
                </div>
                <div className="font-semibold">
                  {user?.createdAt
                    ? new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(user?.createdAt!))
                    : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length < 1 && (
            <div className="text-gray-400">
              No achievements yet. Engage more with the platform.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements?.map((ach: any) => {
              const progress = ach.progress ?? 0;
              const required = ach.required ?? Number(ach.condition?.required ?? 1);
              const completed = ach.completed ?? false;
              const pct = Math.min(100, Math.round((progress / required) * 100));
              const started = progress > 0;
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    completed
                      ? "bg-yellow-500/5 border-yellow-500/40"
                      : started
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl ${!completed && !started ? "grayscale opacity-50" : ""}`}>
                      {ach.icon ?? "🎓"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium text-sm ${!completed && !started ? "text-muted-foreground" : ""}`}>
                          {ach.name}
                        </h4>
                        {completed && (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                            Earned
                          </Badge>
                        )}
                        {ach.mb > 0 && (
                          <span className="text-xs text-muted-foreground">+{ach.mb} MB</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {ach.description}
                      </p>
                      {!completed && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{progress} / {required}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                started ? "bg-primary" : "bg-muted-foreground/30"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {completed && ach.earnedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Earned {new Date(ach.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges?.map((badge: any) => (
              <div
                key={badge.id}
                className={`p-4 rounded-lg border transition-colors ${
                  badge.enrolled ? "bg-primary/5" : "border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{badge?.icon ?? "🔥"}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{badge.name}</h4>

                      {badge?.enrolled && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Earned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
