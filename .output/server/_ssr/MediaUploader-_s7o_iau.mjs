import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { L as LoaderCircle, V as ImagePlus, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MediaUploader-_s7o_iau.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BUCKET = "property-media";
function storageRef(path) {
	return `storage://${BUCKET}/${path}`;
}
var ALLOWED = [
	"image/jpeg",
	"image/png",
	"image/webp"
];
var MAX_BYTES = 8388608;
async function uploadMedia(file, userId, folder) {
	if (!ALLOWED.includes(file.type)) throw new Error("الصيغة غير مدعومة. استخدم JPG أو PNG أو WEBP");
	if (file.size > MAX_BYTES) throw new Error("حجم الملف يتجاوز 8 ميجابايت");
	const ext = file.name.split(".").pop() ?? "jpg";
	const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage.from("property-media").upload(path, file, {
		contentType: file.type,
		upsert: false
	});
	if (error) throw error;
	return storageRef(path);
}
function MediaUploader({ userId, folder, value, onChange, multiple = false, label = "أضف صورة" }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	async function handleFiles(files) {
		if (!files?.length) return;
		setBusy(true);
		try {
			const urls = [];
			for (const file of Array.from(files).slice(0, multiple ? 10 : 1)) urls.push(await uploadMedia(file, userId, folder));
			onChange(multiple ? [...value, ...urls] : urls);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "تعذّر رفع الملف");
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [value.map((url) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative size-20 overflow-hidden rounded-xl ring-1 ring-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: url,
						alt: "",
						className: "size-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onChange(value.filter((u) => u !== url)),
						className: "absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-background/90",
						"aria-label": "حذف",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
					})]
				}, url)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => inputRef.current?.click(),
					disabled: busy,
					className: "grid size-20 place-items-center rounded-xl border border-dashed border-line bg-surface text-muted-foreground",
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted-foreground",
				children: [label, " · JPG/PNG/WEBP · حتى 8 ميجابايت"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: ALLOWED.join(","),
				multiple,
				className: "hidden",
				onChange: (e) => void handleFiles(e.target.files)
			})
		]
	});
}
//#endregion
export { uploadMedia as n, MediaUploader as t };
