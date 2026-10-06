import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useMyOffice } from "./office-C4hHv7Zt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plans-CricE-8e.js
function normalizePackage(row) {
	return {
		id: String(row.id),
		code: row.code ?? null,
		name: String(row.name ?? "باقة"),
		description: row.description ?? null,
		price: Number(row.price ?? 0),
		duration_days: Number(row.duration_days ?? 0),
		property_limit: row.property_limit == null ? null : Number(row.property_limit),
		chat_enabled: Boolean(row.chat_enabled),
		featured_limit: Number(row.featured_limit ?? 0),
		verification_included: Boolean(row.verification_included),
		features: Array.isArray(row.features) ? row.features.map((x) => String(x)) : [],
		is_active: Boolean(row.is_active),
		sort_order: Number(row.sort_order ?? 0)
	};
}
function effectivePlan(office) {
	if (!office || office.plan !== "pro") return "free";
	if (!office.plan_expires_at) return "pro";
	return new Date(office.plan_expires_at).getTime() > Date.now() ? "pro" : "free";
}
function usePackages(activeOnly = true) {
	return useQuery({
		queryKey: ["public-package-catalog", activeOnly],
		queryFn: async () => {
			let q = supabase.from("package_catalog").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
			if (activeOnly) q = q.eq("is_active", true);
			const { data, error } = await q;
			if (error) throw error;
			return (data ?? []).map(normalizePackage);
		}
	});
}
function useMyPlan() {
	const { data: membership, isLoading } = useMyOffice();
	const office = membership?.office;
	const packageId = office?.package_id ?? null;
	const packageQuery = useQuery({
		queryKey: [
			"my-package",
			packageId,
			office?.plan
		],
		enabled: !!office,
		queryFn: async () => {
			if (packageId) {
				const { data, error } = await supabase.from("package_catalog").select("*").eq("id", packageId).maybeSingle();
				if (error) throw error;
				if (data) return normalizePackage(data);
			}
			const fallbackCode = office?.plan === "pro" ? "pro" : "free";
			const { data, error } = await supabase.from("package_catalog").select("*").eq("code", fallbackCode).maybeSingle();
			if (error) throw error;
			return data ? normalizePackage(data) : null;
		}
	});
	const pkg = packageQuery.data;
	const expired = !!office?.plan_expires_at && Number(pkg?.duration_days ?? 0) > 0 && new Date(office.plan_expires_at).getTime() <= Date.now();
	const currentPlan = expired ? "free" : pkg?.code === "pro" || Number(pkg?.price ?? 0) > 0 ? "pro" : "free";
	return {
		isLoading: isLoading || packageQuery.isLoading,
		office: office ?? null,
		package: pkg,
		plan: currentPlan,
		isPro: currentPlan === "pro",
		isPaid: Number(pkg?.price ?? 0) > 0,
		expired,
		expiresAt: office?.plan_expires_at ?? null,
		startedAt: office?.plan_started_at ?? null,
		propertyLimit: expired ? 5 : pkg?.property_limit ?? null,
		chatEnabled: !expired && Boolean(pkg?.chat_enabled),
		featuredLimit: expired ? 0 : Number(pkg?.featured_limit ?? 0),
		verificationIncluded: !expired && Boolean(pkg?.verification_included)
	};
}
function useOfficePropertiesCount(officeId) {
	return useQuery({
		queryKey: ["office-properties-count", officeId],
		enabled: !!officeId,
		queryFn: async () => {
			const { count, error } = await supabase.from("properties").select("id", {
				count: "exact",
				head: true
			}).eq("office_id", officeId).eq("is_deleted", false);
			if (error) throw error;
			return count ?? 0;
		}
	});
}
function usePlanEvents(officeId) {
	return useQuery({
		queryKey: ["office-plan-events", officeId],
		enabled: !!officeId,
		queryFn: async () => {
			const { data, error } = await supabase.from("office_plan_events").select("*").eq("office_id", officeId).order("created_at", { ascending: false }).limit(20);
			if (error) throw error;
			return data ?? [];
		}
	});
}
function useSetPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (packageId) => {
			const { error } = await supabase.rpc("set_office_package", { _package_id: packageId });
			if (error) throw error;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-office-full"] });
			qc.invalidateQueries({ queryKey: ["my-package"] });
			qc.invalidateQueries({ queryKey: ["office-plan-events"] });
		}
	});
}
function planErrorMessage(e) {
	const raw = e instanceof Error ? e.message : String(e ?? "");
	if (raw.includes("property_limit")) return raw;
	if (raw.includes("package_not_available")) return "هذه الباقة غير متاحة حاليًا.";
	return raw || "حدث خطأ غير متوقع، حاول مجددًا.";
}
//#endregion
export { usePackages as a, useOfficePropertiesCount as i, planErrorMessage as n, usePlanEvents as o, useMyPlan as r, useSetPackage as s, effectivePlan as t };
