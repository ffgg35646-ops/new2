import { useState } from "react";
import { authDeleteAccount } from "@/lib/backend.functions";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AccountDeletionAction() {
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    const confirmed = window.confirm(
      "حذف الحساب نهائي. سيتم حذف بيانات الملف الشخصي والعقارات والطلبات والمحادثات والملفات المرتبطة بالحساب. قد نحتفظ بسجلات مالية محدودة إذا كان القانون يلزمنا بذلك، بعد فصلها عن هوية الحساب. هل تريد المتابعة؟",
    );
    if (!confirmed || deleting) return;

    setDeleting(true);
    try {
      const result = await authDeleteAccount();
      if (!result?.data?.success) throw new Error("لم يتم تأكيد حذف الحساب.");

      toast.success("تم حذف الحساب والبيانات المرتبطة به.");
      window.location.replace("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تعذر حذف الحساب. حاول مرة أخرى أو تواصل مع الدعم.",
      );
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-2 rounded-2xl border border-destructive/30 bg-surface p-4">
      <h2 className="text-sm font-bold text-destructive">حذف الحساب نهائيًا</h2>
      <p className="text-xs leading-6 text-muted-foreground">
        يمكنك طلب حذف الحساب من هنا. سيحذف التطبيق بيانات الحساب والمحتوى المرتبط به،
        بينما قد تُحتفظ بسجلات مالية محدودة عند وجود التزام قانوني.
      </p>
      <button
        type="button"
        onClick={() => void deleteAccount()}
        disabled={deleting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive disabled:opacity-50"
      >
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        {deleting ? "جارٍ حذف الحساب..." : "حذف حسابي وبياناتي"}
      </button>
    </section>
  );
}
