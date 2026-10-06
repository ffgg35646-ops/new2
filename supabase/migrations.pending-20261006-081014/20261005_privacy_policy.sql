create table if not exists public.app_content (
  key text primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_content enable row level security;

drop policy if exists "privacy policy public read"
on public.app_content;

create policy "privacy policy public read"
on public.app_content
for select
to anon, authenticated
using (key = 'privacy_policy');

drop policy if exists "privacy policy admin insert"
on public.app_content;

create policy "privacy policy admin insert"
on public.app_content
for insert
to authenticated
with check (
  key = 'privacy_policy'
  and public.has_role('admin', auth.uid())
);

drop policy if exists "privacy policy admin update"
on public.app_content;

create policy "privacy policy admin update"
on public.app_content
for update
to authenticated
using (
  key = 'privacy_policy'
  and public.has_role('admin', auth.uid())
)
with check (
  key = 'privacy_policy'
  and public.has_role('admin', auth.uid())
);

insert into public.app_content (key, content)
values (
  'privacy_policy',
  $$سياسة الخصوصية

نحترم خصوصيتك ونلتزم بحماية البيانات التي تقدمها عند استخدام التطبيق.

1. البيانات التي نجمعها
قد نجمع الاسم ورقم الجوال والبريد الإلكتروني والمحافظة والبيانات اللازمة لإنشاء الحساب واستخدام خدمات التطبيق.

2. استخدام البيانات
نستخدم البيانات لتسجيل الحساب، وتشغيل الخدمات، وتحسين تجربة الاستخدام، والتواصل معك عند الحاجة.

3. المحادثات والبلاغات
قد يتم حفظ الرسائل والصور والبلاغات التي ترسلها داخل التطبيق بهدف تشغيل خدمة المحادثات ومعالجة البلاغات وحماية المستخدمين.

4. حماية البيانات
نتخذ إجراءات تقنية وتنظيمية مناسبة للمساعدة في حماية بيانات المستخدمين من الوصول أو الاستخدام غير المصرح به.

5. مشاركة البيانات
لا يتم مشاركة بياناتك مع أطراف أخرى إلا عند الحاجة لتقديم الخدمة أو عند وجود التزام قانوني أو أمني.

6. حقوق المستخدم
يمكنك التواصل مع إدارة التطبيق بخصوص بيانات حسابك أو أي مشكلة تتعلق بالخصوصية.

7. التحديثات
قد يتم تحديث سياسة الخصوصية من وقت لآخر، وسيتم نشر النسخة المحدثة داخل التطبيق.

تاريخ آخر تحديث: 2026/10/05$$
)
on conflict (key) do nothing;
