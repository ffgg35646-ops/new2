import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [{ title: "تأكيد البريد | عقار البطين" }],
  }),
  component: ConfirmRedirectPage,
});

function ConfirmRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: "/auth/verify-email",
      replace: true,
    });
  }, [navigate]);

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center px-5">
      <div className="text-center">
        <MailCheck className="mx-auto size-14 text-forest" />
        <h1 className="mt-5 font-display text-xl font-extrabold">
          تأكيد البريد الإلكتروني
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يتم تحويلك إلى صفحة إدخال رمز التأكيد...
        </p>
      </div>
    </div>
  );
}
