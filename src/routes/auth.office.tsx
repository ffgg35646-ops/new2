import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/auth/office")({
  head: () => ({
    meta: [
      { title: "دخول المكاتب العقارية | عقار البطين" },
      {
        name: "description",
        content: "سجّل مكتبك العقاري لإدارة العقارات والطلبات وحجوزات المعاينة.",
      },
      { property: "og:title", content: "دخول المكاتب العقارية | عقار البطين" },
      { property: "og:description", content: "حساب مجاني لمكتبك العقاري في عقار البطين." },
    ],
  }),
  component: OfficeAuthPage,
});

function OfficeAuthPage() {
  return <AuthForm role="office" plan="free" startAsRegister />;
}
