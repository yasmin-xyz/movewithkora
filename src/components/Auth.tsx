import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MagicLinkFormProps {
  /** Optional heading + subheading shown above the input. */
  title?: string;
  subtitle?: string;
  onSent?: () => void;
}

export const MagicLinkForm = ({ title, subtitle, onSent }: MagicLinkFormProps) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/planner`,
      },
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "Could not send the magic link.");
    } else {
      setSent(true);
      onSent?.();
    }
  };

  if (sent) {
    return (
      <div className="space-y-2 text-center">
        <p className="font-heading text-xl tracking-tight text-foreground">Check your inbox</p>
        <p className="font-body text-sm text-muted-foreground">
          We sent a magic link to <span className="font-medium text-foreground">{email.trim()}</span>.
          Click it to sign in — you can close this once you're done.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <h3 className="font-heading text-xl tracking-tight text-foreground">{title}</h3>
          )}
          {subtitle && (
            <p className="font-body text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        className="h-11 font-body"
      />
      <Button
        onClick={handleSend}
        disabled={sending}
        className="w-full h-11 font-body text-sm font-medium tracking-wide uppercase"
      >
        {sending ? "Sending…" : "Send magic link"}
      </Button>
    </div>
  );
};

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md p-6 rounded-xl">
      <MagicLinkForm
        title="Sign in to save"
        subtitle="Enter your email and we'll send you a magic link — no password needed. New here? The same link creates your account."
      />
    </DialogContent>
  </Dialog>
);
