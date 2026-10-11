import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";

const getPublicSupportEmail = createServerFn({ method: "GET" }).handler(async () => {
  const configured = String(
    process.env["SUPPORT_EMAIL"] ?? "",
  );
  const email = configured.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  return { email };
});

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | عقار البطين" },
      {
        name: "description",
        content: "كيف يجمع عقار البطين البيانات الشخصية ويستخدمها ويحميها، وكيف يمكن طلب حذف الحساب.",
      },
    ],
  }),
  loader: () => getPublicSupportEmail(),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { email } = Route.useLoaderData();

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
          <ArrowRight className="size-4" /> العودة إلى عقار البطين
        </Link>

        <header className="rounded-3xl bg-surface p-5 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-forest-soft text-forest">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold">سياسة الخصوصية</h1>
              <p className="mt-1 text-xs text-muted-foreground">عقار البطين · آخر تحديث: 10 أكتوبر 2026</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            تشرح هذه السياسة البيانات التي نعالجها لتشغيل منصة عقار البطين العقارية، وأسباب استخدامها،
            وكيفية طلب حذف الحساب والبيانات المرتبطة به.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">1. البيانات التي نجمعها</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            بحسب استخدامك للخدمة، قد نعالج الاسم والبريد الإلكتروني ورقم الجوال وصورة الملف الشخصي
            وبيانات المكتب العقاري وتراخيصه، وبيانات العقارات وصورها وأسعارها ومواقعها المكتوبة،
            والطلبات وحجوزات المعاينة والمحادثات والبلاغات وتذاكر الدعم والمفضلة والمتابعات والإشعارات.
            نعالج كذلك بيانات تسجيل الدخول والجلسة وسجلات الاستخدام اللازمة لتشغيل الخدمة وتأمينها.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">2. كيف نستخدم البيانات</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            نستخدم البيانات لإنشاء الحساب والتحقق من البريد وتسجيل الدخول، وعرض العقارات والمكاتب،
            وتوصيل الطلبات وحجوزات المعاينة والرسائل إلى الأطراف المعنية، وتشغيل الإشعارات والدعم،
            وإدارة باقات المكاتب والمدفوعات، واكتشاف إساءة الاستخدام وحماية المنصة وحل الأعطال.
            لا نستخدم بيانات البطاقة لأغراض إعلانية.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">3. المحتوى الذي تشاركه</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            قد يظهر للعامة ما تختار نشره، مثل إعلان العقار وبيانات المكتب وصوره ووسائل التواصل المعروضة.
            وتصل الرسائل والطلبات وبيانات الحجز إلى الطرف الذي ترسلها إليه وإلى مسؤولي المنصة عند الحاجة
            لتقديم الدعم أو مراجعة البلاغات. لا تضع في إعلان عام مستندات أو بيانات شخصية لا تريد نشرها.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">4. مقدمو الخدمات والمدفوعات</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            نعتمد على مزودي خدمات لاستضافة التطبيق وقاعدة البيانات والملفات وإرسال رسائل البريد ومعالجة
            المدفوعات، ومنها مزود الدفع HyperPay عند استخدامه. تُعالج بيانات البطاقة ضمن نموذج مزود الدفع؛
            ويحتفظ التطبيق بسجلات العملية اللازمة مثل المبلغ والعملة والحالة ومعرّفات المعاملة، ولا يقصد
            تخزين رقم البطاقة الكامل أو رمز الأمان. وقد تُشارك البيانات مع مزود الخدمة بالقدر اللازم لتنفيذ
            الوظيفة المطلوبة أو امتثالًا لالتزام نظامي.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">5. الاحتفاظ والحماية</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            نستخدم وسائل حماية تقنية وصلاحيات وصول للحد من الوصول غير المصرح به. لا توجد وسيلة نقل أو
            تخزين إلكتروني خالية تمامًا من المخاطر. نحتفظ بالبيانات ما دام الحساب نشطًا أو كانت لازمة
            لتقديم الخدمة، ثم نحذفها أو نزيل ما يربطها بهويتك عند حذف الحساب، باستثناء السجلات التي يلزم
            الاحتفاظ بها لأسباب محاسبية أو نظامية أو لحل النزاعات. وقد تحتفظ الأنظمة الاحتياطية بنسخ لفترة
            محدودة قبل استبدالها وفق دورة النسخ الاحتياطي.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">6. حذف الحساب وحقوقك</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            يمكنك بدء حذف الحساب من صفحة الحساب أو الملف الشخصي داخل التطبيق عبر خيار «حذف حسابي وبياناتي».
            سيؤدي ذلك إلى حذف بيانات الحساب والمحتوى المرتبط به، مع فصل سجلات الدفع الضرورية عن معرّف الحساب
            عند وجود سبب للاحتفاظ بها. إذا تعذر الحذف بسبب مشكلة تقنية، تواصل مع الدعم لإعادة المحاولة.
          </p>
          <Link to="/support" className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-bold text-background">
            <Mail className="size-4" /> التواصل بشأن الخصوصية
          </Link>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-extrabold">7. تحديث السياسة</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            قد نحدّث هذه السياسة عند تغير الخدمة أو المتطلبات النظامية. سننشر النسخة الجديدة هنا مع تعديل
            تاريخ التحديث، ويُرجى مراجعتها دوريًا.
          </p>
        </section>

        <footer className="border-t border-line pt-4 text-sm text-muted-foreground">
          <p>للتواصل بخصوص الخصوصية أو البيانات:</p>
          {email ? (
            <a className="mt-2 inline-block font-semibold text-forest underline" href={"mailto:" + email}>{email}</a>
          ) : (
            <p className="mt-2 leading-6">
              لم يُضبط بريد تواصل عام بعد. يجب إعداد بريد SUPPORT_EMAIL أو MAIL_FROM قبل الإرسال النهائي إلى App Store.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4">
            <Link to="/support" className="underline underline-offset-4">الدعم</Link>
            <Link to="/terms-of-use" className="underline underline-offset-4">شروط الاستخدام</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
