import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { q as Download, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_lib } from "../_libs/qrcode.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/QrDialog-C8Bioagi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
function QrDialog({ open, onClose, value, title, subtitle, fileName = "qr" }) {
	const canvasRef = (0, import_react.useRef)(null);
	const [dataUrl, setDataUrl] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!open || !canvasRef.current) return;
		import_lib.toCanvas(canvasRef.current, value, {
			width: 240,
			margin: 2,
			color: {
				dark: "#0f4d3a",
				light: "#ffffff"
			}
		}, (err) => {
			if (err) return;
			setDataUrl(canvasRef.current?.toDataURL("image/png") ?? "");
		});
	}, [open, value]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-center bg-black/50 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-xs rounded-3xl bg-background p-5 text-center",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm font-extrabold",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						"aria-label": "إغلاق",
						className: "text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[11px] text-muted-foreground",
					children: subtitle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid place-items-center rounded-2xl bg-white p-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", { ref: canvasRef })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: dataUrl || void 0,
					download: `${fileName}.png`,
					onClick: () => {
						if (!dataUrl) toast.error("جارٍ توليد الرمز، حاول بعد لحظة");
					},
					className: "mt-4 flex items-center justify-center gap-2 rounded-2xl bg-forest py-3 text-sm font-bold text-background",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " تنزيل الرمز"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[10px] leading-relaxed text-muted-foreground",
					children: "يفتح الرمز الصفحة مباشرة عند مسحه بكاميرا الجوال."
				})
			]
		})
	});
}
//#endregion
export { QrDialog as t };
