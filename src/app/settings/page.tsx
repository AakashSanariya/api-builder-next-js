"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Plus,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { usePopup } from "../../contexts/PopupContext";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { settingsService } from "../../services/settings.service";
import { ApiKey, CreateApiKeyResponse } from "../../types/settings.types";

type SettingsTab = "profile" | "security" | "api-keys";

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "api-keys", label: "API Keys", icon: Key },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { showPopup } = usePopup();

  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab: SettingsTab = TABS.find((t) => t.key === tabParam) ? tabParam! : "profile";

  const setTab = (tab: SettingsTab) => {
    router.push(`/settings?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-foreground font-display tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, security, and API access.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "profile" && <ProfileTab user={user} updateUser={updateUser} showPopup={showPopup} />}
            {activeTab === "security" && <SecurityTab user={user} showPopup={showPopup} />}
            {activeTab === "api-keys" && <ApiKeysTab showPopup={showPopup} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────

function ProfileTab({
  user,
  updateUser,
  showPopup,
}: {
  user: { firstName: string; lastName: string; email: string } | null;
  updateUser: (data: { firstName?: string; lastName?: string; email?: string }) => void;
  showPopup: (opts: any) => Promise<any>;
}) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await settingsService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
      });
      if (res.success && res.data) {
        updateUser(res.data);
        showPopup({ title: "Profile Updated", message: "Your profile has been saved successfully.", type: "alert" });
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to update profile.", type: "alert" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-foreground font-display">Personal Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Update your name and email address.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            required
          />
          <InputField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            required
          />
        </div>

        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} isLoading={saving} variant="primary">
            <Save size={16} className="mr-2" />
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Security Tab ────────────────────────────────────

function SecurityTab({
  user,
  showPopup,
}: {
  user: { firstName: string; lastName: string; email: string } | null;
  showPopup: (opts: any) => Promise<any>;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const validatePassword = () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = "Current password is required";
    if (!newPassword) errs.newPassword = "New password is required";
    else {
      if (newPassword.length < 8) errs.newPassword = "Must be at least 8 characters";
      else if (!/[A-Z]/.test(newPassword)) errs.newPassword = "Must contain an uppercase letter";
      else if (!/[a-z]/.test(newPassword)) errs.newPassword = "Must contain a lowercase letter";
      else if (!/[0-9]/.test(newPassword)) errs.newPassword = "Must contain a number";
    }
    if (newPassword && newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setSaving(true);
    try {
      const res = await settingsService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showPopup({ title: "Password Changed", message: "Your password has been updated.", type: "alert" });
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to change password.", type: "alert" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email) return;

    const confirmed = await showPopup({
      type: "confirm",
      title: "Delete Account",
      message: "This will permanently delete your account, all forms, submissions, and data. This cannot be undone.",
      confirmText: "Delete Forever",
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await settingsService.deleteAccount(deleteEmail);
      if (res.success) {
        showPopup({ title: "Account Deleted", message: "Your account has been permanently deleted.", type: "alert" });
        window.location.href = "/login";
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to delete account.", type: "alert" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-foreground font-display">Change Password</h2>
          <p className="text-sm text-muted-foreground mt-1">Ensure your account stays secure.</p>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="relative">
            <InputField
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.currentPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <InputField
              label="New Password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <InputField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleChangePassword} isLoading={saving} variant="primary">
            <Shield size={16} className="mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-2xl border-2 border-destructive/30 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-destructive font-display flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Type your email <span className="font-bold text-foreground">{user?.email}</span> to confirm:
          </p>
          <InputField
            label="Confirm Email"
            type="email"
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            placeholder={user?.email}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleDeleteAccount}
            isLoading={deleting}
            variant="danger"
            disabled={deleteEmail !== user?.email}
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── API Keys Tab ────────────────────────────────────

function ApiKeysTab({ showPopup }: { showPopup: (opts: any) => Promise<any> }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await settingsService.listApiKeys();
      if (res.success && res.data) {
        setKeys(res.data);
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to load API keys.", type: "alert" });
    } finally {
      setLoading(false);
    }
  }, [showPopup]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await settingsService.createApiKey({ name: newKeyName.trim() });
      if (res.success && res.data) {
        setCreatedKey(res.data);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to create API key.", type: "alert" });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (createdKey?.key) {
      navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    const confirmed = await showPopup({
      type: "confirm",
      title: "Revoke API Key",
      message: `Are you sure you want to revoke "${name}"? Any applications using this key will stop working.`,
      confirmText: "Revoke",
    });
    if (!confirmed) return;

    try {
      const res = await settingsService.revokeApiKey(id);
      if (res.success) {
        fetchKeys();
      }
    } catch (err: any) {
      showPopup({ title: "Error", message: err.message || "Failed to revoke API key.", type: "alert" });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Created Key Alert */}
      <AnimatePresence>
        {createdKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/10 border border-primary/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Key size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">API Key Created</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Copy your key now. It will not be shown again.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground break-all">
                    {createdKey.key}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-colors shrink-0"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create New Key */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-foreground font-display">Create API Key</h2>
          <p className="text-sm text-muted-foreground mt-1">
            API keys grant full access to your account. Use them for integrations and server-to-server calls.
          </p>
        </div>

        <div className="flex gap-3 max-w-md">
          <div className="flex-1">
            <InputField
              label="Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production, Staging"
            />
          </div>
          <div className="flex items-end pb-1">
            <Button onClick={handleCreate} isLoading={creating} variant="primary" disabled={!newKeyName.trim()}>
              <Plus size={16} className="mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Existing Keys */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-foreground font-display">Existing Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revoke a key to immediately disable it.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12">
            <Key size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No API keys yet. Create one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((apiKey) => (
              <div
                key={apiKey._id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Key size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{apiKey.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-xs font-mono text-muted-foreground">{apiKey.keyPreview}</code>
                      <span className="text-xs text-muted-foreground/50">|</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(apiKey.lastUsedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(apiKey._id, apiKey.name)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all shrink-0"
                  title="Revoke key"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Info */}
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <ExternalLink size={16} className="text-primary" />
          How to Use API Keys
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">X-API-Key</code> header:</p>
          <pre className="bg-foreground/5 border border-border rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto">
{`curl -H "X-API-Key: ak_your_key_here" \\
  ${typeof window !== "undefined" ? window.location.origin : "http://localhost:5000"}/api/your-form`}
          </pre>
          <p>Works with all REST and GraphQL endpoints — same access as your JWT token.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
