create table if not exists public.app_content (
  key text primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_content enable row level security;

drop policy if exists "legal content public read"
on public.app_content;

create policy "legal content public read"
on public.app_content
for select
to anon, authenticated
using (
  key in ('privacy_policy', 'terms_of_use')
);

drop policy if exists "legal content admin insert"
on public.app_content;

create policy "legal content admin insert"
on public.app_content
for insert
to authenticated
with check (
  key in ('privacy_policy', 'terms_of_use')
  and public.has_role('admin', auth.uid())
);

drop policy if exists "legal content admin update"
on public.app_content;

create policy "legal content admin update"
on public.app_content
for update
to authenticated
using (
  key in ('privacy_policy', 'terms_of_use')
  and public.has_role('admin', auth.uid())
)
with check (
  key in ('privacy_policy', 'terms_of_use')
  and public.has_role('admin', auth.uid())
);

insert into public.app_content (key, content)
values
(
  'privacy_policy',
  $$سياسة الخصوصية

نحترم خصوصيتك ونلتزم بحماية البيانات التي تقدمها عند استخدام التطبيق.

1. البيانات التي نجمعها
قد نجمع الاسم ورقم الجوال والبريد الإلكتروني والمحافظة والبيانات اللازمة لإنشاء الحساب واستخدام خدمات التطبيق.

2. استخدام البيانات
نستخدم البيانات لتسجيل الحساب وتشغيل الخدمات وتحسين تجربة الاستخدام والتواصل معك عند الحاجة.

3. المحادثات والبلاغات
قد يتم حفظ الرسائل والصور والبلاغات التي ترسلها داخل التطبيق بهدف تشغيل خدمة المحادثات ومعالجة البلاغات وحماية المستخدمين.

4. حماية البيانات
نتخذ إجراءات مناسبة للمساعدة في حماية بيانات المستخدمين من الوصول أو الاستخدام غير المصرح به.

5. مشاركة البيانات
لا يتم مشاركة بياناتك مع أطراف أخرى إلا عند الحاجة لتقديم الخدمة أو عند وجود التزام قانوني.

6. حقوق المستخدم
يمكنك التواصل مع إدارة التطبيق بخصوص بيانات حسابك أو أي مشكلة تتعلق بالخصوصية.

7. التحديثات
قد يتم تحديث سياسة الخصوصية من وقت لآخر، وسيتم نشر النسخة المحدثة داخل التطبيق.

تاريخ آخر تحديث: 2026/10/05$$
),
(
  'terms_of_use',
  $$شروط الاستخدام

باستخدامك تطبيق عقار البطين وإنشاء حساب فيه، فإنك توافق على الالتزام بالشروط التالية.

1. استخدام الحساب
يجب تقديم بيانات صحيحة وعدم استخدام حساب شخص آخر أو انتحال هوية أي مستخدم.

2. استخدام المنصة
تستخدم المنصة للتواصل وعرض العقارات والطلبات والخدمات المتاحة داخل التطبيق.

3. المحتوى
يتحمل المستخدم مسؤولية المحتوى والرسائل والصور التي يقوم بإرسالها.

4. المحادثات والبلاغات
يمكن للمستخدم حظر الطرف الآخر والإبلاغ عن الرسائل أو السلوك المخالف، ويحق لإدارة التطبيق مراجعة البلاغات واتخاذ الإجراء المناسب.

5. إساءة الاستخدام
يُمنع استخدام التطبيق في أي نشاط مخالف للقانون أو لإرسال محتوى مسيء أو احتيالي أو ضار.

6. إدارة الحساب
تحتفظ إدارة التطبيق بحق تعليق أو إيقاف الحسابات التي تخالف الشروط.

7. التحديثات
قد يتم تعديل شروط الاستخدام من وقت لآخر، ويستمر استخدام التطبيق بعد نشر التحديثات على أنه موافقة عليها.

تاريخ آخر تحديث: 2026/10/05$$
)
on conflict (key) do nothing;
