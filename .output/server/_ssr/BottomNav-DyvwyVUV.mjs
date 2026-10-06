import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as MessageSquare, H as House, R as LayoutGrid, _t as Building2, it as ClipboardList, l as Sparkles, r as User, st as CirclePlus } from "../_libs/lucide-react.mjs";
import { n as useMyOffice, r as useNewInquiriesCount } from "./office-C4hHv7Zt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BottomNav-DyvwyVUV.js
var import_jsx_runtime = require_jsx_runtime();
var individualItems = [
	{
		to: "/home",
		label: "الرئيسية",
		icon: House
	},
	{
		to: "/properties",
		label: "العقارات",
		icon: Building2
	},
	{
		to: "/request",
		label: "اطلب",
		icon: CirclePlus,
		primary: true
	},
	{
		to: "/extras",
		label: "الإضافات",
		icon: Sparkles
	},
	{
		to: "/account",
		label: "حسابي",
		icon: User
	}
];
var officeItems = [
	{
		to: "/office",
		label: "الرئيسية",
		icon: LayoutGrid
	},
	{
		to: "/office/properties",
		label: "عقاراتي",
		icon: Building2
	},
	{
		to: "/office/properties/new",
		label: "إضافة",
		icon: CirclePlus,
		primary: true
	},
	{
		to: "/office/chat",
		label: "الدردشة",
		icon: MessageSquare
	},
	{
		to: "/office/requests",
		label: "الطلبات",
		icon: ClipboardList
	},
	{
		to: "/office/profile",
		label: "الحساب",
		icon: User
	}
];
function BottomNav({ variant }) {
	const { isOffice } = useAuth();
	const resolved = variant ?? (isOffice ? "office" : "individual");
	const items = resolved === "office" ? officeItems : individualItems;
	const { data: membership } = useMyOffice();
	const { data: newRequests = 0 } = useNewInquiriesCount(resolved === "office" ? membership?.office?.id : null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "sticky bottom-0 z-30 grid auto-cols-fr grid-flow-col gap-1 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur",
		children: items.map((item) => {
			const Icon = item.icon;
			if (item.primary) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				className: "flex flex-col items-center gap-1 py-1.5 -mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-12 place-items-center rounded-2xl bg-terracotta text-background ring-4 ring-background",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-6" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-semibold text-terracotta",
					children: item.label
				})]
			}, item.to);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: item.to,
				className: "flex flex-col items-center gap-1 py-1.5 text-muted-foreground",
				activeProps: { className: "text-forest [&_span]:font-semibold" },
				activeOptions: { exact: item.to === "/office" || item.to === "/home" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.to === "/office/requests" && newRequests > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute -top-1.5 -left-2 grid min-w-4 place-items-center rounded-full bg-terracotta px-1 text-[9px] font-bold text-background",
						children: newRequests
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px]",
					children: item.label
				})]
			}, item.to);
		})
	});
}
//#endregion
export { BottomNav as t };
