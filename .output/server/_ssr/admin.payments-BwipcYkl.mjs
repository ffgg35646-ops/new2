import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { L as LoaderCircle, _ as Save, et as CreditCard } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as AdminShell } from "./AdminShell-DTm36zvD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.payments-BwipcYkl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function statusLabel(status) {
	if (status === "success") return "ناجحة";
	if (status === "pending") return "قيد المعالجة";
	if (status === "cancelled") return "ملغاة";
	return "فاشلة";
}
function statusClass(status) {
	if (status === "success") return "bg-forest-soft text-forest";
	if (status === "pending") return "bg-amber-500/10 text-amber-700";
	if (status === "cancelled") return "bg-sand text-muted-foreground";
	return "bg-destructive/10 text-destructive";
}
function PaymentsPage() {
	const qc = useQueryClient();
	const settingsQuery = useQuery({
		queryKey: ["admin-payment-settings"],
		queryFn: async () => {
			const { data, error } = await supabase.from("payment_gateway_settings").select("*").eq("id", 1).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const paymentsQuery = useQuery({
		queryKey: ["admin-payment-transactions"],
		queryFn: async () => {
			const { data, error } = await supabase.from("payment_transactions").select(`
          id,
          amount,
          currency,
          status,
          payment_brand,
          result_code,
          result_description,
          merchant_transaction_id,
          gateway_transaction_id,
          created_at,
          paid_at,
          offices(name),
          package_catalog(name)
        `).order("created_at", { ascending: false }).limit(100);
			if (error) throw error;
			return data ?? [];
		},
		refetchInterval: 6e4
	});
	const [merchantName, setMerchantName] = (0, import_react.useState)("");
	const [merchantPhone, setMerchantPhone] = (0, import_react.useState)("");
	const [currency, setCurrency] = (0, import_react.useState)("SAR");
	const [ignoreDescriptor, setIgnoreDescriptor] = (0, import_react.useState)(true);
	const current = settingsQuery.data;
	if (current && merchantName === "" && merchantPhone === "" && currency === "SAR" && ignoreDescriptor === true) {
		setMerchantName(current.merchant_name ?? "");
		setMerchantPhone(current.merchant_phone ?? "");
		setCurrency(current.currency ?? "SAR");
		setIgnoreDescriptor(Boolean(current.ignore_descriptor_validation));
	}
	const save = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("payment_gateway_settings").update({
				merchant_name: merchantName.trim(),
				merchant_phone: merchantPhone.trim(),
				currency: currency.trim().toUpperCase(),
				ignore_descriptor_validation: ignoreDescriptor,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", 1);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("تم حفظ إعدادات بوابة الدفع");
			qc.invalidateQueries({ queryKey: ["admin-payment-settings"] });
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "تعذّر حفظ الإعدادات");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		dir: "rtl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-3xl bg-forest p-5 text-background",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-11 place-items-center rounded-2xl bg-background/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-extrabold",
						children: "المدفوعات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs opacity-80",
						children: "إعدادات التاجر وسجل عمليات الدفع الفعلية."
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-base font-extrabold",
					children: "إعدادات التاجر"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: merchantName,
							onChange: (e) => setMerchantName(e.target.value),
							placeholder: "اسم التاجر",
							className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: merchantPhone,
							onChange: (e) => setMerchantPhone(e.target.value),
							placeholder: "رقم هاتف التاجر",
							dir: "ltr",
							className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: currency,
							onChange: (e) => setCurrency(e.target.value),
							placeholder: "العملة",
							dir: "ltr",
							className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 rounded-2xl bg-sand p-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: ignoreDescriptor,
								onChange: (e) => setIgnoreDescriptor(e.target.checked)
							}), "Merchant.data['ignoreDescriptorValidation']"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => save.mutate(),
							disabled: save.isPending || settingsQuery.isLoading,
							className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-50",
							children: [save.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "حفظ إعدادات الدفع"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-base font-extrabold",
						children: "سجل المدفوعات"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-muted-foreground",
						children: [paymentsQuery.data?.length ?? 0, " عملية"]
					})]
				}), paymentsQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center rounded-2xl bg-surface p-8 text-sm text-muted-foreground ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "me-2 size-4 animate-spin" }), "جاري تحميل المدفوعات..."]
				}) : paymentsQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-destructive/10 p-4 text-sm text-destructive",
					children: "تعذّر تحميل سجل المدفوعات."
				}) : !paymentsQuery.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground ring-1 ring-line",
					children: "لا توجد عمليات دفع حتى الآن."
				}) : paymentsQuery.data.map((payment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-3xl bg-surface p-4 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-display text-sm font-extrabold",
								children: payment.package_catalog?.name ?? "باقة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-xs text-muted-foreground",
								children: payment.offices?.name ?? "مكتب"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full px-2.5 py-1 text-[10px] font-bold " + statusClass(payment.status),
								children: statusLabel(payment.status)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "المبلغ",
									value: `${Number(payment.amount).toLocaleString("ar-SA")} ${payment.currency}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "البطاقة",
									value: payment.payment_brand || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "رقم العملية",
									value: payment.merchant_transaction_id
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "Gateway ID",
									value: payment.gateway_transaction_id || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "كود النتيجة",
									value: payment.result_code || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
									label: "التاريخ",
									value: new Date(payment.created_at).toLocaleString("ar-SA")
								})
							]
						}),
						payment.result_description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 rounded-2xl bg-sand p-3 text-xs leading-6 text-muted-foreground",
							children: payment.result_description
						})
					]
				}, payment.id))]
			})
		]
	});
}
function Info({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-sand p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[10px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 break-all text-xs font-bold",
			children: value
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["admin"],
	guestsTo: "/auth/admin",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentsPage, {}) })
});
//#endregion
export { SplitComponent as component };
