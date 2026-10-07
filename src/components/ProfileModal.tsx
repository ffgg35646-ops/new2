import { useState } from "react";
import { KeyRound, Loader2, Mail, Pencil, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ProfileRow = {
  label: string;
  value: string;
};

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
  email: string;
  emailVerified: boolean;
  rows: ProfileRow[];
};

export function ProfileModal({
  open,
  onClose,
  email,
  emailVerified,
  rows,
}: ProfileModalProps) {
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (!open) return null;

  async function startEmailChange() {
    const currentEmail = email.trim().toLowerCase();
    if (!currentEmail) {
      toast.error("البريد الإلكتروني الحالي غير متاح.");
      return;
    }

    setEmailBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: currentEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo:
            window.location.origin + "/auth/change-email",
        },
      });

      if (error) throw error;

      toast.success("أرسلنا رابط تأكيد إلى بريدك الحالي. افتح الرابط لإكمال تغيير البريد.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";

      if (/rate limit|too many|429/i.test(message)) {
        toast.error("تعذر إرسال رابط التأكيد الآن. حاول مرة أخرى بعد قليل.");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "تعذر بدء تغيير البريد الإلكتروني.",
        );
      }
    } finally {
      setEmailBusy(false);
    }
  }

  function openPasswordChange() {
    setPasswordOpen(true);
  }

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4">
        <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-background shadow-2xl ring-1 ring-line">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-background px-4 py-4">
            <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-extrabold">
                الملف الشخصي
              </h2>
              <p className="text-xs text-muted-foreground">
                بيانات الحساب
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
            >
              <X className="size-5" />
            </button>
          </header>

          <main className="space-y-3 p-4">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-2xl bg-surface p-3.5 ring-1 ring-line"
              >
                <div className="text-[11px] font-semibold text-muted-foreground">
                  {row.label}
                </div>
                <div className="mt-1 text-sm font-bold">
                  {row.value || "—"}
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
              <div className="text-[11px] font-semibold text-muted-foreground">
                البريد الإلكتروني
              </div>

              <div className="mt-1 flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />

                <span dir="ltr" className="min-w-0 flex-1 truncate text-sm font-bold">
                  {email || "—"}
                </span>

                {emailVerified && (
                  <span className="shrink-0 rounded-full bg-forest-soft px-2 py-1 text-[10px] font-bold text-forest">
                    مفعل
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => void startEmailChange()}
                  disabled={emailBusy}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-sand px-2.5 py-1.5 text-[10px] font-bold text-forest disabled:opacity-50"
                >
                  {emailBusy ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Pencil className="size-3" />
                  )}
                  تغيير
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line">
              <div className="text-[11px] font-semibold text-muted-foreground">
                كلمة المرور
              </div>

              <div className="mt-1 flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-bold tracking-widest">
                  ••••••••
                </span>

                <button
                  type="button"
                  onClick={() => void openPasswordChange()}
                  className="inline-flex items-center gap-1 rounded-xl bg-sand px-2.5 py-1.5 text-[10px] font-bold text-forest"
                >
                  <Pencil className="size-3" />
                  تغيير
                </button>
              </div>
            </div>

            <p className="pt-1 text-center text-[11px] leading-6 text-muted-foreground">
              باقي البيانات للعرض فقط، وتغيير البريد أو كلمة المرور له خطوات أمان منفصلة.
            </p>
          </main>
        </div>
      </div>

      <PasswordChangeModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </>
  );
}

function PasswordChangeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("أكمل جميع حقول كلمة المرور.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setBusy(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const currentEmail = userData.user?.email;
      if (!currentEmail) throw new Error("تعذر معرفة البريد الإلكتروني الحالي.");

      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });

      if (verifyError) {
        throw new Error("كلمة المرور الحالية غير صحيحة.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("تم تغيير كلمة المرور بنجاح.");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر تغيير كلمة المرور.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-2xl ring-1 ring-line">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-forest-soft text-forest">
            <KeyRound className="size-5" />
          </div>

          <div className="flex-1">
            <h2 className="font-display text-lg font-extrabold">
              تغيير كلمة المرور
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              أدخل الحالية ثم الجديدة مرتين.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-line"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <PasswordField
            label="كلمة المرور الحالية"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordField
            label="كلمة المرور الجديدة"
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordField
            label="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-2xl bg-surface py-3.5 text-sm font-bold ring-1 ring-line disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={() => void changePassword()}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 text-sm font-bold text-background disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            تغيير كلمة المرور
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir="ltr"
        className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
      />
    </label>
  );
}
