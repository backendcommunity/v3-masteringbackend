"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Bell,
  Eye,
  Palette,
  Globe,
  Download,
  Key,
  Smartphone,
  Mail,
  MessageSquare,
  Users,
  Award,
  BookOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import { SoundSettings } from "../sound-settings";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { DeleteAccountSection } from "../delete-account-section";

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const store = useAppStore();
  const user = useUser();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notMatch, setNotMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [notifications, setNotifications] = useState({
    email: user?.settings?.email ?? true,
    push: user?.settings?.push ?? true,
    sms: user?.settings?.sms ?? false,
    courseUpdates: user?.settings?.courseUpdates ?? true,
    achievements: user?.settings?.achievements ?? true,
    community: user?.settings?.community ?? false,
    marketing: user?.settings?.marketing ?? false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: user?.settings?.profileVisible ?? true,
    progressVisible: user?.settings?.progressVisible ?? true,
  });

  const [language, setLangauge] = useState({
    language: user?.settings?.language ?? "en",
    timezone: user?.settings?.timezone ?? "pst",
    dateFormat: user?.settings?.dateFormat ?? "mdy",
  });

  const handleTwoFactorChange = async (value: boolean) => {
    setTwoFactorEnabled(value);
    await store.updateUser({
      settings: {
        ...user?.settings,
        twoFactorEnabled: value,
      },
    });

    toast.success("Settings saved successfully");
  };

  const handleLanguageChange = async (key: string, value: string) => {
    setLangauge((prev) => ({ ...prev, [key]: value }));

    await store.updateUser({
      settings: {
        ...user?.settings,
        [key]: value,
      },
    });

    toast.success("Settings saved successfully");
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));

    await store.updateUser({
      settings: {
        ...user?.settings,
        [key]: value,
      },
    });
    toast.success("Settings saved successfully");
  };

  const handlePrivacyChange = async (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));

    await store.updateUser({
      settings: {
        ...user?.settings,
        [key]: value,
      },
    });

    toast.success("Settings saved successfully");
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);

    // Also check for match if confirmPassword is already filled
    if (confirmPassword !== "") {
      setNotMatch(value !== confirmPassword);
    }

    setPasswordValidations({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const canSubmit =
    isPasswordValid &&
    !notMatch &&
    oldPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setMessage(null);

      if (!canSubmit) return;

      await store.changePassword({
        newPassword,
        oldPassword,
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordValidations({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
      });
      toast.success("Password changed successfully");
    } catch (error: any) {
      const m = error?.response?.message ?? error?.message;
      if (m.includes("422")) {
        setMessage({ type: "error", text: "Password do not match" });
        return;
      }

      setMessage({ type: "error", text: m });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      value={newPassword}
                      onChange={(e) => handleNewPasswordChange(e.target.value)}
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                    />

                    {newPassword && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div
                          className={
                            passwordValidations.length
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          • At least 8 characters
                        </div>
                        <div
                          className={
                            passwordValidations.uppercase
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          • Contains uppercase letter
                        </div>
                        <div
                          className={
                            passwordValidations.lowercase
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          • Contains lowercase letter
                        </div>
                        <div
                          className={
                            passwordValidations.number
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          • Contains number
                        </div>
                        <div
                          className={
                            passwordValidations.specialChar
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          • Contains special character
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      value={confirmPassword}
                      onChange={(e) => {
                        const confirm = e.target.value;
                        setConfirmPassword(confirm);
                        setNotMatch(confirm !== newPassword);
                      }}
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    {notMatch && (
                      <span className="text-red-500">
                        Password does not match
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!canSubmit || loading}
                    className="gap-2"
                  >
                    {loading ? (
                      "Updating..."
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>

                  {message && (
                    <p
                      className={`text-sm ${
                        message.type === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                </div>
              </div>
              <Separator />

              <CardContent className="space-y-6">
                <div>
                  <h2 className="pb-3 text-xl">You registered using</h2>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={user?.signedUpThrough === "GOOGLE"}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1">Google</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={user?.signedUpThrough === "GITHUB"}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1">Github</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={user?.signedUpThrough === "MASTERINGBACKEND"}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1">Masteringbackend</div>
                  </div>
                </div>
              </CardContent>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      Two-Factor Authentication
                    </span>
                    {twoFactorEnabled && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        Enabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(value) => handleTwoFactorChange(value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email Notifications</span>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(value) =>
                        handleNotificationChange("email", value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span>Push Notifications</span>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(value) =>
                        handleNotificationChange("push", value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>SMS Notifications</span>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(value) =>
                        handleNotificationChange("sms", value)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Content Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>Course Updates</span>
                    </div>
                    <Switch
                      checked={notifications.courseUpdates}
                      onCheckedChange={(value) =>
                        handleNotificationChange("courseUpdates", value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Achievements & Progress</span>
                    </div>
                    <Switch
                      checked={notifications.achievements}
                      onCheckedChange={(value) =>
                        handleNotificationChange("achievements", value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Community Activity</span>
                    </div>
                    <Switch
                      checked={notifications.community}
                      onCheckedChange={(value) =>
                        handleNotificationChange("community", value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Marketing & Promotions</span>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(value) =>
                        handleNotificationChange("marketing", value)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-medium">Public Profile</span>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile information
                  </p>
                </div>
                <Switch
                  checked={privacy.profileVisible}
                  onCheckedChange={(value) =>
                    handlePrivacyChange("profileVisible", value)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-medium">Progress Sharing</span>
                  <p className="text-sm text-muted-foreground">
                    Share your learning progress with the community
                  </p>
                </div>
                <Switch
                  checked={privacy.progressVisible}
                  onCheckedChange={(value) =>
                    handlePrivacyChange("progressVisible", value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <SoundSettings />

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  defaultValue={language?.language ?? "en"}
                  onValueChange={(value) =>
                    handleLanguageChange("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  defaultValue={language?.timezone ?? "pst"}
                  onValueChange={(value) =>
                    handleLanguageChange("timezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pst">Pacific Standard Time</SelectItem>
                    <SelectItem value="est">Eastern Standard Time</SelectItem>
                    <SelectItem value="cst">Central Standard Time</SelectItem>
                    <SelectItem value="mst">Mountain Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  defaultValue={language?.dateFormat ?? "mdy"}
                  onValueChange={(value) =>
                    handleLanguageChange("dateFormat", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Epic 4: Account Deletion Section */}
      {/* <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Danger Zone</h2>
        <DeleteAccountSection email={user?.email} />
      </div> */}
    </div>
  );
}

export default SettingsPage;
