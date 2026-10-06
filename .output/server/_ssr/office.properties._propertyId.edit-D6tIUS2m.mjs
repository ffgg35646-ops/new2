import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as RoleGuard } from "./role-guard-BlGqbnI9.mjs";
import { n as useNeighborhoods, r as useSelectedGovernorate } from "./governorate-21auhEUK.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AppHeader } from "./AppHeader-1-nIT4X8.mjs";
import { a as LISTING_TYPES, n as FACINGS, o as PROPERTY_KINDS } from "./constants-Bvy1nlDs.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as MediaUploader } from "./MediaUploader-_s7o_iau.mjs";
import { t as Route } from "./office.properties._propertyId.edit-97j5rmad.mjs";
import { t as LocationPicker } from "./LocationPicker-J313BJJo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.properties._propertyId.edit-D6tIUS2m.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EditProperty() {
	const { propertyId } = Route.useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { userId } = useAuth();
	const { governorateId } = useSelectedGovernorate();
	const { data: neighborhoods = [] } = useNeighborhoods(governorateId);
	const { data: property, isLoading } = useQuery({
		queryKey: ["edit-property", propertyId],
		queryFn: async () => {
			const { data, error } = await supabase.from("properties").select("*, property_images(id,url,sort_order)").eq("id", propertyId).single();
			if (error) throw error;
			return data;
		}
	});
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
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!property || loaded) return;
		setKind(property.kind);
		setListing(property.listing);
		setTitle(property.title);
		setDescription(property.description ?? "");
		setNeighborhood(property.neighborhood);
		setPrice(String(property.price ?? ""));
		setArea(String(property.area ?? ""));
		setFacing(property.facing ?? "");
		setStreetWidth(property.street_width != null ? String(property.street_width) : "");
		setRooms(property.rooms != null ? String(property.rooms) : "");
		setBathrooms(property.bathrooms != null ? String(property.bathrooms) : "");
		setAgeYears(property.age_years != null ? String(property.age_years) : "");
		if (property.latitude != null && property.longitude != null) setLocation({
			lat: property.latitude,
			lng: property.longitude
		});
		const imgs = [...property.property_images ?? []].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url);
		setImages(property.cover_url && !imgs.includes(property.cover_url) ? [property.cover_url, ...imgs] : imgs);
		setLoaded(true);
	}, [property, loaded]);
	const save = useMutation({
		mutationFn: async () => {
			if (!title.trim()) throw new Error("أدخل عنوان العرض");
			if (!neighborhood) throw new Error("اختر الحي");
			if (!price || !area) throw new Error("أدخل السعر والمساحة");
			const { error } = await supabase.from("properties").update({
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
			}).eq("id", propertyId);
			if (error) throw error;
			await supabase.from("property_images").delete().eq("property_id", propertyId);
			if (images.length) await supabase.from("property_images").insert(images.map((url, i) => ({
				property_id: propertyId,
				url,
				sort_order: i
			})));
		},
		onSuccess: () => {
			toast.success("تم حفظ التعديلات");
			qc.invalidateQueries({ queryKey: ["property", propertyId] });
			qc.invalidateQueries({ queryKey: ["office-properties"] });
			navigate({
				to: "/properties/$propertyId",
				params: { propertyId }
			});
		},
		onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر حفظ التعديلات")
	});
	if (isLoading || !loaded) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-forest" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-screen w-full max-w-md flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { showSearch: false }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "flex-1 space-y-4 px-4 py-4 pb-24",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-extrabold",
				children: "تعديل العرض العقاري"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
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
						onChange: setTitle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Row, {
						label: "الحي",
						children: [neighborhoods.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							label: n.name_ar,
							active: neighborhood === n.name_ar,
							onClick: () => setNeighborhood(n.name_ar)
						}, n.id)), neighborhood && !neighborhoods.some((n) => n.name_ar === neighborhood) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							label: neighborhood,
							active: true,
							onClick: () => {}
						})]
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
						children: "صور العقار (الأولى هي الغلاف)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaUploader, {
						userId,
						folder: "properties",
						value: images,
						onChange: setImages,
						multiple: true
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => save.mutate(),
						disabled: save.isPending,
						className: "flex w-full items-center justify-center gap-2 rounded-2xl bg-forest py-3.5 font-display font-bold text-background disabled:opacity-60",
						children: [save.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " حفظ التعديلات"]
					})
				]
			})]
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
function Field({ label, value, onChange, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type,
			value,
			onChange: (e) => onChange(e.target.value),
			className: "w-full rounded-xl bg-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest"
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGuard, {
	allow: ["office"],
	guestsTo: "/auth/office",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditProperty, {})
});
//#endregion
export { SplitComponent as component };
