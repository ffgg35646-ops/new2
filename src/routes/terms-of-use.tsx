import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";

export const Route = createFileRoute("/terms-of-use")({
  head: () => ({
    meta: [
      { title: "شروط الاستخدام | عقار البطين" },
      { name: "description", content: "شروط استخدام منصة عقار البطين للعقارات والمكاتب والطلبات." },
    ],
  }),
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
          <ArrowRight className="size-4" /> العودة إلى عقار البطين
        </Link>
        <header className="rounded-3xl bg-surface p-5 ring-1 ring-line">
          <span className="grid size-12 place-items-center rounded-2xl bg-forest-soft text-forest">
            <FileText className="size-6" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold">شروط الاستخدام</h1>
          <p className="mt-1 text-xs text-muted-foreground">عقار البطين · آخر تحديث: 10 أكتوبر 2026</p>
        </header>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">1. الحسابات</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            يجب تقديم بيانات صحيحة والمحافظة على سرية بيانات الدخول. يتحمل صاحب الحساب مسؤولية الأنشطة التي تتم من خلاله،
            وعليه التواصل مع الدعم عند الاشتباه في استخدام غير مصرح به.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">2. الإعلانات والبيانات العقارية</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            يجب أن تكون بيانات العقار والأسعار والصور والتراخيص دقيقة ومصرحًا بنشرها. لا يجوز نشر إعلان مضلل أو محتوى
            ينتهك حقوق الآخرين أو مشاركة مستندات لا تملك حق نشرها. قد تراجع الإدارة الإعلانات أو توقفها أو تزيلها عند
            الاشتباه في المخالفة.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">3. التواصل والبلاغات</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            استخدم الطلبات والمحادثات وحجوزات المعاينة للتواصل المتعلق بالعقار فقط. يمنع الإساءة أو الاحتيال أو المضايقة.
            يمكنك الإبلاغ عن المحتوى أو المشكلة من أدوات الإبلاغ المتاحة أو عبر مركز الدعم.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">4. الاشتراكات والمدفوعات</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            تظهر مزايا الباقات وأسعارها ومدتها قبل الشراء. تتم معالجة الدفع عبر مزود الدفع المعروض أثناء العملية،
            ولا تتفعّل الباقة المدفوعة إلا بعد تأكيد نتيجة الدفع من الخادم. لا تكرر محاولة الدفع قبل مراجعة حالة
            العملية السابقة إذا كانت لا تزال قيد المعالجة.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">5. حدود الخدمة</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            توفر المنصة وسيلة لعرض العقارات وتبادل الطلبات والتواصل بين المستخدمين؛ ولا تضمن إتمام صفقة عقارية أو صحة
            كل معلومة يقدمها مستخدم آخر. ينبغي التحقق من المستندات والتفاصيل قبل أي التزام أو دفع خارج المنصة.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display font-extrabold">6. إيقاف الحساب أو حذفه</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            قد نقيّد الوصول عند إساءة الاستخدام أو انتهاك الشروط. ويمكن للمستخدم بدء حذف حسابه من إعدادات الحساب داخل
            التطبيق وفق سياسة الخصوصية؛ وقد تحتفظ المنصة بسجلات يلزم الاحتفاظ بها نظاميًا.
          </p>
        </section>
        <footer className="border-t border-line pt-4 text-sm">
          <Link to="/privacy-policy" className="font-semibold text-forest underline">سياسة الخصوصية</Link>
          <span className="mx-3 text-muted-foreground">·</span>
          <Link to="/support" className="font-semibold text-forest underline">الدعم والتواصل</Link>
        </footer>
      </div>
    </main>
  );
}
