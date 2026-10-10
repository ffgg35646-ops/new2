import { useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ImagePlus, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedGovernorate } from "@/lib/governorate";
import { LegalPolicyModal } from "@/components/LegalPolicyModal";
import { uploadPendingSignupAvatar } from "@/components/MediaUploader";
import { clearPendingSignupAvatar, savePendingSignupAvatar } from "@/lib/pending-signup-avatar";

const PENDING_KEY = "ufuq.pending-signup";
const PENDING_EMAIL_KEY = "ufuq.pending-email";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function authErrorMessage(e: unknown): string {
  const raw =
    e instanceof Error
      ? e.message
      : e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message ?? "")
        : String(e ?? "");
  const m = raw.toLowerCase();
  if (m.includes("office_commercial_register_required"))
    return "رقم السجل التجاري مطلوب لحساب المكتب.";
  if (m.includes("office_license_required")) return "رقم الترخيص مطلوب لحساب المكتب.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "البريد الإلكتروني مسجل مسبقًا";
  if (m.includes("password should be at least"))
    return "كلمة المرور قصيرة جدًا — الحد الأدنى 6 أحرف.";
  if (m.includes("pwned") || m.includes("compromised"))
    return "كلمة المرور ضعيفة ومسرّبة في اختراقات سابقة، اختر كلمة مرور أقوى.";
  if (m.includes("invalid login credentials")) return "البريد أو كلمة المرور غير صحيحة.";
  if (m.includes("email not confirmed"))
    return "لم يتم تأكيد البريد بعد. افتح رسالة التحقق في بريدك أولًا.";
  if (m.includes("email_send_paused"))
    return "هذا الإيميل استنفد 15 محاولة إرسال. سيتم إيقاف الإرسال لمدة 5 دقائق ثم يبدأ العداد من جديد.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("email rate limit"))
    return "تعذر إرسال رسالة التفعيل الآن. حاول مرة أخرى بعد قليل.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "صيغة البريد الإلكتروني غير صحيحة.";
  return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}

export function AuthForm({
  role,
  plan = "free",
  startAsRegister = false,
}: {
  role: "individual" | "office";
  plan?: "free" | "pro";
  startAsRegister?: boolean;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    governorates,
    governoratesError,
    governoratesLoading,
  } = useSelectedGovernorate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarSelected, setAvatarSelected] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [govId, setGovId] = useState("");
  const [isRegister, setIsRegister] = useState(startAsRegister);
  const [busy, setBusy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const destination = role === "office" ? "/office" : "/home";
  const selectedGov = govId || governorates[0]?.id || "";

  async function handleAvatarFile(file: File | null) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("صورة البروفايل لازم تكون JPG أو PNG أو WEBP.");
      return;
    }
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      toast.error("حجم صورة البروفايل يجب ألا يتجاوز 8 ميجابايت.");
      return;
    }
    setAvatarBusy(true);
    try {
      await savePendingSignupAvatar(file);
      if (avatarUrl.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarSelected(true);
      toast.success("تم اختيار صورة البروفايل، وسيتم رفعها بعد تأكيد البريد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر تجهيز صورة البروفايل");
    } finally {
      setAvatarBusy(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function removeAvatar() {
    if (avatarUrl.startsWith("blob:")) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl("");
    setAvatarSelected(false);
    try {
      await clearPendingSignupAvatar();
    } catch {
      // Clearing the local flag prevents a stale file from being attached.
    }
  }

  function validateRegisterFields() {
    if (!fullName.trim()) throw new Error("الرجاء إدخال الاسم الكامل.");
    if (!selectedGov) throw new Error("الرجاء اختيار المحافظة.");
    if (role === "office") {
      if (!officeName.trim()) throw new Error("الرجاء إدخال اسم المكتب.");
      if (!commercialRegister.trim()) throw new Error("الرجاء إدخال رقم السجل التجاري.");
      if (!licenseNumber.trim()) throw new Error("الرجاء إدخال رقم الترخيص.");
    }
  }

  function signupPayload() {
    return {
      _role: role,
      _full_name: fullName.trim(),
      _avatar_url: avatarUrl && !avatarUrl.startsWith("blob:") ? avatarUrl.trim() || null : null,
      _avatar_pending: avatarSelected,
      _governorate_id: selectedGov,
      _office:
        role === "office"
          ? {
              name: officeName.trim() || fullName.trim(),
              manager_name: fullName.trim(),
              address: officeAddress.trim() || null,
              license_number: licenseNumber.trim() || null,
              commercial_register: commercialRegister.trim() || null,
              plan,
            }
          : null,
    };
  }

  async function finishSignup(payload?: Record<string, unknown>) {
    const { error } = await supabase.rpc("complete_signup", (payload ?? signupPayload()) as never);
    if (error) throw error;
  }

  async function applyPendingSignup(userId: string) {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (roles && roles.length > 0) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      await finishSignup(JSON.parse(raw) as Record<string, unknown>);
    } finally {
      localStorage.removeItem(PENDING_KEY);
    }
  }

  async function afterAuth(register: boolean) {
    if (register) {
      await finishSignup();
      localStorage.removeItem(PENDING_KEY);
    } else {
      const { data } = await supabase.auth.getUser();
      if (data.user) await applyPendingSignup(data.user.id);
    }
    void qc.invalidateQueries({ queryKey: ["session"] });
    toast.success(register ? "تم إنشاء الحساب" : "تم تسجيل الدخول");
    navigate({ to: destination });
  }

  async function emailSubmit() {
    setBusy(true);
    try {
      if (isRegister && (!privacyAccepted || !termsAccepted)) {
        throw new Error("يجب الموافقة على سياسة الخصوصية وشروط الاستخدام أولًا.");
      }

      if (!email.trim() || !password) throw new Error("الرجاء إدخال البريد وكلمة المرور.");
      if (!email.includes("@")) {
        throw new Error("البريد الإلكتروني يجب أن يحتوي على @.");
      }
      if (isRegister) {
        if (password.length < 8) throw new Error("كلمة المرور يجب ألا تقل عن 8 أحرف.");
        validateRegisterFields();
        const signupEmail = normalizeEmail(email);
        const payload = signupPayload();

        const { data, error } = await supabase.auth.signUp({
          email: signupEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
              avatar_url: avatarUrl && !avatarUrl.startsWith("blob:") ? avatarUrl.trim() || null : null,
            },
          },
        });

        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error("البريد الإلكتروني مسجل مسبقًا");
        }

        localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
        localStorage.setItem(
          PENDING_EMAIL_KEY,
          JSON.stringify({ email: signupEmail, role, sentAt: Date.now() }),
        );

        if (!data.session) {
          toast.success("أرسلنا رمز تأكيد مكوّنًا من 6 أرقام إلى بريدك الإلكتروني.");
          navigate({ to: "/auth/verify-email" });
          return;
        }

        let completedPayload = payload;
        if (payload._avatar_pending === true && data.user?.id) {
          try {
            const uploadedAvatar = await uploadPendingSignupAvatar(data.user.id);
            completedPayload = {
              ...payload,
              _avatar_url: uploadedAvatar,
              _avatar_pending: false,
            };
          } catch {
            completedPayload = { ...payload, _avatar_url: null, _avatar_pending: false };
            toast.error("تعذّر رفع الصورة؛ يمكنك إضافتها لاحقًا من الملف الشخصي.");
          }
        }

        await finishSignup(completedPayload);
        try {
          await clearPendingSignupAvatar();
        } catch {
          // The account must not fail because local cleanup failed.
        }
        localStorage.removeItem(PENDING_KEY);
        localStorage.removeItem(PENDING_EMAIL_KEY);

        void qc.invalidateQueries({ queryKey: ["session"] });
        toast.success(
          role === "office"
            ? "تم إنشاء الحساب، وحساب المكتب قيد مراجعة الإدارة."
            : "تم إنشاء الحساب وتسجيل الدخول بنجاح.",
        );
        navigate({ to: destination });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      await afterAuth(false);
    } catch (e) {
      toast.error(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6 sm:px-5 sm:py-8">
      <Link
        to="/"
        className="flex size-10 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-line transition-colors hover:bg-sand"
      >
        <ArrowRight className="size-4" />
      </Link>

      <div className="mt-7 space-y-2">
        <span className="inline-flex rounded-full bg-forest-soft px-3 py-1 text-xs font-bold text-forest">
          {isRegister ? "حساب جديد" : "مرحبًا بعودتك"}
        </span>
        <h1 className="font-display text-2xl font-extrabold leading-tight">
          {role === "office" ? "حساب مكتب عقاري" : "حساب فرد"}
        </h1>
        <p className="app-page-subtitle">
          {isRegister ? "أنشئ حسابك للبدء" : "سجّل دخولك للمتابعة"}
        </p>
      </div>

      <div className="app-form-card mt-5 space-y-4 sm:p-5">
        {isRegister && (
          <div className="text-sm font-extrabold">بيانات الحساب</div>
        )}
        {isRegister && (
          <Field
            label={role === "office" ? "اسم المسؤول" : "الاسم الكامل"}
            value={fullName}
            onChange={setFullName}
            placeholder="مثال: محمد العتيبي"
          />
        )}
        {isRegister && (
          <div className="rounded-2xl bg-background p-4 ring-1 ring-line">
            <div className="text-xs font-semibold text-muted-foreground">
              {role === "office" ? "صورة البروفايل / شعار المكتب (اختياري)" : "صورة البروفايل (اختياري)"}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-forest-soft text-forest ring-1 ring-line shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="معاينة صورة البروفايل" className="size-full object-cover" />
                ) : (
                  <User className="size-7" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarBusy}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-bold text-background shadow-sm transition hover:bg-forest/95 disabled:opacity-60"
                  >
                    {avatarBusy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    {avatarBusy ? "جارٍ تجهيز الصورة..." : avatarUrl ? "تغيير الصورة" : "اختيار صورة"}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => void removeAvatar()}
                      disabled={avatarBusy}
                      className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-background px-3 py-2 text-xs font-bold text-terracotta ring-1 ring-line transition hover:bg-terracotta-soft disabled:opacity-60"
                    >
                      <X className="size-3.5" /> إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => void handleAvatarFile(event.target.files?.[0] ?? null)}
            />
            
          </div>
        )}
        {isRegister && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              المحافظة
            </span>
            <select
              value={selectedGov}
              onChange={(e) => setGovId(e.target.value)}
              disabled={governoratesLoading || !!governoratesError || governorates.length === 0}
              className="app-field-control"
            >
              {governorates.length === 0 && (
                <option value="">
                  {governoratesLoading
                    ? "جارٍ تحميل المحافظات..."
                    : governoratesError
                      ? "تعذر تحميل المحافظات"
                      : "لا توجد محافظات"}
                </option>
              )}

              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>

            {governoratesError && (
              <p className="mt-1.5 text-xs text-destructive">
                تعذر تحميل المحافظات:{" "}
                {governoratesError instanceof Error
                  ? governoratesError.message
                  : String(governoratesError)}
              </p>
            )}
          </label>
        )}
        {isRegister && role === "office" && (
          <>
            <Field
              label="اسم المكتب"
              value={officeName}
              onChange={setOfficeName}
              placeholder="مثال: مكتب عقار البطين"
            />
            <Field
              label="عنوان المكتب (اختياري)"
              value={officeAddress}
              onChange={setOfficeAddress}
              placeholder="الحي، الشارع"
            />
            <Field
              label="رقم الترخيص (فال) *"
              value={licenseNumber}
              onChange={setLicenseNumber}
              placeholder="رقم فال"
              dir="ltr"
            />
            <Field
              label="السجل التجاري *"
              value={commercialRegister}
              onChange={setCommercialRegister}
              placeholder="10xxxxxxxx"
              dir="ltr"
            />
          </>
        )}

        <>
          <div className="border-t border-line pt-4">
            <div className="text-sm font-extrabold">بيانات تسجيل الدخول</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">تأكد من صحة البريد الإلكتروني قبل المتابعة.</p>
          </div>
          <Field
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="text"
            dir="ltr"
          />
          <Field
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            type="password"
            dir="ltr"
          />
          {isRegister && (
          <div className="rounded-2xl bg-background p-3 ring-1 ring-line">
            <div className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
              <input
                type="checkbox"
                checked={privacyAccepted && termsAccepted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPrivacyAccepted(checked);
                  setTermsAccepted(checked);
                }}
                className="mt-1 size-4 shrink-0 accent-forest"
              />

              <span>
                أوافق على{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="font-bold text-forest underline underline-offset-4"
                >
                  شروط الاستخدام
                </button>
                {" "}
                و
                {" "}
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="font-bold text-forest underline underline-offset-4"
                >
                  سياسة الخصوصية
                </button>
              </span>
            </div>
          </div>
          )}
          <Primary
            busy={busy}
            disabled={avatarBusy || (isRegister && (!privacyAccepted || !termsAccepted))}
            onClick={emailSubmit}
          >
            {isRegister ? "إنشاء الحساب" : "تسجيل الدخول"}
          </Primary>
          {!isRegister && (
            <Link
              to="/auth/forgot-password"
              className="block w-full py-2 text-center text-xs font-semibold text-forest"
            >
              نسيت كلمة المرور؟
            </Link>
          )}
        </>
      </div>

      <button
        onClick={() =>
          setIsRegister((v) => {
            const next = !v;

            if (next) {
              setPrivacyAccepted(false);
              setTermsAccepted(false);
            }

            setPrivacyOpen(false);
            setTermsOpen(false);

            return next;
          })
        }
        className="mt-5 rounded-2xl px-3 py-3 text-center text-sm font-bold text-forest transition-colors hover:bg-forest-soft underline underline-offset-4"
      >
        {isRegister ? "لدي حساب بالفعل" : "ليس لدي حساب — تسجيل جديد"}
      </button>

      <LegalPolicyModal
        open={privacyOpen}
        policyKey="privacy_policy"
        title="سياسة الخصوصية"
        onClose={() => setPrivacyOpen(false)}
        onAccept={() => {
          setPrivacyAccepted(true);
          setPrivacyOpen(false);
        }}
      />

      <LegalPolicyModal
        open={termsOpen}
        policyKey="terms_of_use"
        title="شروط الاستخدام"
        onClose={() => setTermsOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setTermsOpen(false);
        }}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="app-field-label">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="app-field-control"
      />
    </label>
  );
}

function Primary({
  busy,
  disabled = false,
  onClick,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => void onClick()}
      disabled={busy || disabled}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest px-4 py-3.5 font-display font-bold text-background shadow-sm transition hover:bg-forest/95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
