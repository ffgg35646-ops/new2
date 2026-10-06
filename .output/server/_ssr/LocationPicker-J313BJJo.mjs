import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { $ as Crosshair, L as LoaderCircle, j as MapPin } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as googleMapsUrl, r as parseLatLng, t as getCurrentPosition } from "./location-C7S-OTk4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LocationPicker-J313BJJo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LocationPicker({ value, onChange }) {
	const [link, setLink] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	function applyLink() {
		const parsed = parseLatLng(link);
		if (!parsed) {
			toast.error("تعذّر قراءة الموقع من الرابط. الصق رابطًا يحتوي إحداثيات، أو استخدم «موقعي الحالي».");
			return;
		}
		onChange(parsed);
		toast.success("تم تحديد الموقع من الرابط ✓");
	}
	async function useCurrent() {
		setBusy(true);
		try {
			onChange(await getCurrentPosition());
			toast.success("تم تحديد موقعك الحالي ✓");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذّر تحديد الموقع");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs font-semibold text-muted-foreground",
				children: "موقع العقار على الخريطة (اختياري)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: link,
					onChange: (e) => setLink(e.target.value),
					placeholder: "الصق رابط قوقل ماب هنا",
					dir: "ltr",
					className: "flex-1 rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: applyLink,
					className: "shrink-0 rounded-xl bg-forest-soft px-3 text-xs font-bold text-forest",
					children: "تطبيق"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: useCurrent,
				disabled: busy,
				className: "flex w-full items-center justify-center gap-2 rounded-xl bg-sand py-2.5 text-xs font-bold text-forest disabled:opacity-60",
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, { className: "size-4" }), "تحديد موقعي الحالي (GPS)"]
			}),
			value && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-xl bg-forest-soft px-3 py-2 text-[11px] text-forest",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: googleMapsUrl(value.lat, value.lng),
					target: "_blank",
					rel: "noreferrer",
					className: "flex items-center gap-1 font-semibold underline underline-offset-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), " معاينة الموقع المحدد"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						onChange(null);
						setLink("");
					},
					className: "text-terracotta",
					children: "إزالة"
				})]
			})
		]
	});
}
//#endregion
export { LocationPicker as t };
