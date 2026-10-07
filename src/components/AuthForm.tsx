import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedGovernorate } from "@/lib/governorate";
import { LegalPolicyModal } from "@/components/LegalPolicyModal";

const PENDING_KEY = "ufuq.pending-signup";
const PENDING_EMAIL_KEY = "ufuq.pending-email";
function authErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? "");
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
  const { governorates } = useSelectedGovernorate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [commercialRegister, setCommercialRegister] = useState("");
  const [govId, setGovId] = useState("");
  const [isRegister, setIsRegister] = useState(startAsRegister);
  const [busy, setBusy] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const destination = role === "office" ? "/office" : "/home";
  const selectedGov = govId || governorates[0]?.id || "";

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

        await finishSignup(payload);
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <Link
        to="/"
        className="flex size-9 items-center justify-center rounded-full bg-surface ring-1 ring-line"
      >
        <ArrowRight className="size-4" />
      </Link>

      <h1 className="mt-8 font-display text-2xl font-extrabold">
        {role === "office" ? "حساب مكتب عقاري" : "حساب فرد"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isRegister ? "أنشئ حسابك للبدء" : "سجّل دخولك للمتابعة"}
      </p>

      <div className="mt-5 space-y-3">
        {isRegister && (
          <Field
            label={role === "office" ? "اسم المسؤول" : "الاسم الكامل"}
            value={fullName}
            onChange={setFullName}
            placeholder="مثال: محمد العتيبي"
          />
        )}
        {isRegister && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              المحافظة
            </span>
            <select
              value={selectedGov}
              onChange={(e) => setGovId(e.target.value)}
              className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
            >
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>
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
          <Field
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
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
          <div className="mt-3">
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
            disabled={isRegister && (!privacyAccepted || !termsAccepted)}
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
        className="mt-6 text-center text-sm text-forest underline underline-offset-4"
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
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-forest"
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
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60"
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
