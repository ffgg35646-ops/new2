import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/auth/individual")({
  head: () => ({
    meta: [
      { title: "دخول الأفراد | عقار البطين" },
      { name: "description", content: "سجّل دخولك كفرد لتصفح العقارات وحفظ المفضلة وطلب عقار." },
      { property: "og:title", content: "دخول الأفراد | عقار البطين" },
      { property: "og:description", content: "دخول سريع برقم الجوال أو البريد الإلكتروني." },
    ],
  }),
  component: () => <AuthForm role="individual" />,
});
