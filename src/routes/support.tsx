import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";

const getPublicSupportEmail = createServerFn({ method: "GET" }).handler(async () => {
  const configured =
    String(process.env["SUPPORT_EMAIL"] || process.env["MAIL_FROM"] || "");
  const email = configured.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  return { email };
});

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "الدعم والتواصل | عقار البطين" },
      { name: "description", content: "طرق التواصل مع دعم عقار البطين للمساعدة في الحسابات والعقارات والطلبات." },
    ],
  }),
  loader: () => getPublicSupportEmail(),
  component: SupportPage,
});

function SupportPage() {
  const { email } = Route.useLoaderData();
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
          <ArrowRight className="size-4" /> العودة إلى عقار البطين
        </Link>
        <header className="rounded-3xl bg-surface p-5 ring-1 ring-line">
          <span className="grid size-12 place-items-center rounded-2xl bg-forest-soft text-forest">
            <MessageCircle className="size-6" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold">الدعم والتواصل</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            تواصل معنا إذا واجهت مشكلة في تسجيل الدخول، أو نشر العقارات، أو الطلبات والمحادثات،
            أو احتجت مساعدة بخصوص خصوصيتك أو حذف حسابك.
          </p>
        </header>

        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <h2 className="font-display font-bold">البريد الإلكتروني</h2>
          {email ? (
            <a href={"mailto:" + email} className="mt-2 inline-flex items-center gap-2 font-semibold text-forest underline">
              <Mail className="size-4" /> {email}
            </a>
          ) : (
            <p className="mt-2 text-sm leading-6 text-destructive">
              لم يُضبط بريد دعم عام. يجب إعداد SUPPORT_EMAIL أو MAIL_FROM قبل تقديم التطبيق إلى App Store.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <h2 className="font-display font-bold">مركز الدعم داخل التطبيق</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            بعد تسجيل الدخول، افتح «حسابي» أو «ملف المكتب» ثم «تواصل مع الدعم» لإنشاء تذكرة ومتابعة الردود.
          </p>
          <Link to="/account" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-background">
            <MessageCircle className="size-4" /> فتح حسابي ومركز الدعم
          </Link>
        </section>

        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="flex items-center gap-2 font-display font-bold">
            <ShieldCheck className="size-4 text-forest" /> الخصوصية وحذف الحساب
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            تشرح سياسة الخصوصية البيانات التي نعالجها وطريقة حذف الحساب. يمكنك بدء الحذف من إعدادات الحساب داخل التطبيق.
          </p>
          <Link to="/privacy-policy" className="mt-2 inline-block text-sm font-semibold text-forest underline">
            قراءة سياسة الخصوصية
          </Link>
        </section>
      </div>
    </main>
  );
}
