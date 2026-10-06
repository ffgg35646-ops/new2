import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as useNeighborhoods, r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { a as LISTING_TYPES, n as FACINGS, o as PROPERTY_KINDS } from "./constants-Bvy1nlDs.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as MediaUploader } from "./MediaUploader-_s7o_iau.mjs";
import { i as useOfficePropertiesCount, n as planErrorMessage, r as useMyPlan } from "./plans-CricE-8e.mjs";
import { t as LocationPicker } from "./LocationPicker-J313BJJo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.properties.new-DKMIxi4H.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NewProperty() {
	const navigate = useNavigate();
	const { userId } = useAuth();
	const { governorateId } = useSelectedGovernorate();
	const { data: neighborhoods = [] } = useNeighborhoods(governorateId);
	const { data: office } = useQuery({
		queryKey: ["my-office-id", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("offices").select("id,governorate_id").eq("owner_id", userId).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const { propertyLimit } = useMyPlan();
	const { data: propertiesCount = 0 } = useOfficePropertiesCount(office?.id);
	const limitReached = propertyLimit != null && propertiesCount >= propertyLimit;
	const [kind, setKind] = (0, import_react.useState)("land");
	const [listing, setListing] = (0, import_react.useState)("sale");
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [neighborhood, setNeighborhood] = (0, import_react.useState)("");
	const [price, setPrice] = (0, import_react.useState)("");
	const [area, setArea] = (0, import_react.useState)("");
	const [facing, setFacing] = (0, import_react.useState)("");
	const [streetWidth, setStreetWidth] = (0, import_react.useState)("");
	const [rooms, setRooms] = (0, import_react.useState)("");
	const [bathrooms, setBathrooms] = (0, import_react.useState)("");
	const [ageYears, setAgeYears] = (0, import_react.useState)("");
	const [location, setLocation] = (0, import_react.useState)(null);
	const [images, setImages] = (0, import_react.useState)([]);
	const create = useMutation({
		mutationFn: async () => {
			if (!office?.id) throw new Error("لم يتم العثور على مكتبك");
			if (limitReached) throw new Error(`باقتك تسمح بـ ${propertyLimit} عقار فقط. اختر باقة أخرى لزيادة الحد.`);
			if (!title.trim()) throw new Error("أدخل عنوان العرض");
			if (!neighborhood) throw new Error("اختر الحي");
			if (!price || !area) throw new Error("أدخل السعر والمساحة");
			const { data, error } = await supabase.from("properties").insert({
				property_number: "",
				office_id: office.id,
				governorate_id: office.governorate_id ?? governorateId,
				kind,
				listing,
				title: title.trim(),
				description: description.trim() || null,
				neighborhood,
				price: Number(price),
				area: Number(area),
				facing: facing || null,
				street_width: streetWidth ? Number(streetWidth) : null,
				rooms: rooms ? Number(rooms) : null,
				bathrooms: bathrooms ? Number(bathrooms) : null,
				age_years: ageYears ? Number(ageYears) : null,
				latitude: location?.lat ?? null,
				longitude: location?.lng ?? null,
				cover_url: images[0] ?? null
			}).select("id").single();
			if (error) throw error;
			if (images.length) await supabase.from("property_images").insert(images.map((url, i) => ({
				property_id: data.id,
				url,
				sort_order: i
			})));
			return data.id;
		},
		onSuccess: (id) => {
			toast.success("تم نشر العرض بنجاح");
			navigate({
				to: "/properties/$propertyId",
				params: { propertyId: id }
			});
		},
		onError: (e) => toast.error(planErrorMessage(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "flex-1 space-y-4 px-4 py-4 pb-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-extrabold",
					children: "إضافة عرض عقاري"
				}),
				propertyLimit != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl bg-sand p-3 text-[12px] leading-relaxed",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"الحد الحالي: ",
						propertiesCount,
						" من ",
						propertyLimit,
						" عقارات.",
						limitReached && " وصلت إلى الحد الأقصى."
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/office/subscription",
						className: "mt-1 inline-block font-semibold text-terracotta underline underline-offset-4",
						children: "الترقية إلى الباقة الاحترافية لعقارات غير محدودة"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "space-y-3 rounded-3xl bg-surface p-4 ring-1 ring-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "نوع العقار",
							children: PROPERTY_KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								label: k.label,
								active: kind === k.value,
								onClick: () => setKind(k.value)
							}, k.value))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "نوع العرض",
							children: LISTING_TYPES.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								label: l.label,
								active: listing === l.value,
								onClick: () => setListing(l.value)
							}, l.value))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "عنوان العرض",
							value: title,
							onChange: setTitle,
							placeholder: "أرض سكنية بحي الروضة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الحي",
							children: neighborhoods.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								label: n.name_ar,
								active: neighborhood === n.name_ar,
								onClick: () => setNeighborhood(n.name_ar)
							}, n.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "السعر (ر.س)",
									value: price,
									onChange: setPrice,
									type: "number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "المساحة (م²)",
									value: area,
									onChange: setArea,
									type: "number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "عرض الشارع (م)",
									value: streetWidth,
									onChange: setStreetWidth,
									type: "number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "عمر العقار (سنة)",
									value: ageYears,
									onChange: setAgeYears,
									type: "number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "الغرف",
									value: rooms,
									onChange: setRooms,
									type: "number"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "دورات المياه",
									value: bathrooms,
									onChange: setBathrooms,
									type: "number"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الواجهة",
							children: FACINGS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								label: f,
								active: facing === f,
								onClick: () => setFacing(f)
							}, f))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-[11px] text-muted-foreground",
								children: "الوصف"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 4,
								value: description,
								onChange: (e) => setDescription(e.target.value),
								className: "w-full rounded-2xl bg-sand px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-forest"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocationPicker, {
							value: location,
							onChange: setLocation
						}),
						userId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs font-semibold text-muted-foreground",
							children: "صور العقار (حتى 8 ميجابايت للصورة)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaUploader, {
							userId,
							folder: "properties",
							value: images,
							onChange: setImages,
							multiple: true
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => create.mutate(),
							disabled: create.isPending,
							className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
							children: [create.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " نشر العرض"]
						})
					]
				})
			]
		})]
	});
}
function Row({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-1.5 text-xs font-semibold text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children
	})] });
}
function Pill({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("rounded-full px-3 py-1.5 text-xs font-semibold transition", active ? "bg-forest text-background" : "bg-sand text-muted-foreground"),
		children: label
	});
}
function Field({ label, value, onChange, type = "text", placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type,
			value,
			placeholder,
			onChange: (e) => onChange(e.target.value),
			className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewProperty, {})
});
//#endregion
export { SplitComponent as component };
