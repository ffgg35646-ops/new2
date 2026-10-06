import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/governorate-21auhEUK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var STORAGE_KEY = "ofoq-governorate";
function useGovernorates() {
	return useQuery({
		queryKey: ["governorates"],
		queryFn: async () => {
			const { data, error } = await supabase.from("governorates").select("id,name_ar,code,banner_url").eq("is_active", true).order("sort_order");
			if (error) throw error;
			return data ?? [];
		},
		staleTime: 0,
		refetchOnMount: "always"
	});
}
function useNeighborhoods(governorateId) {
	return useQuery({
		queryKey: ["neighborhoods", governorateId],
		enabled: !!governorateId,
		queryFn: async () => {
			const { data, error } = await supabase.from("neighborhoods").select("id,name_ar").eq("governorate_id", governorateId).eq("is_active", true).order("name_ar");
			if (error) throw error;
			return data ?? [];
		},
		staleTime: 3e5
	});
}
function useSelectedGovernorate() {
	const { data: governorates } = useGovernorates();
	const { profile, userId } = useAuth();
	const qc = useQueryClient();
	const [local, setLocal] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") setLocal(window.localStorage.getItem(STORAGE_KEY));
	}, []);
	const id = profile?.governorate_id ?? local ?? governorates?.[0]?.id ?? null;
	const current = governorates?.find((g) => g.id === id) ?? null;
	const select = (0, import_react.useCallback)(async (next) => {
		setLocal(next);
		if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
		if (userId) {
			await supabase.from("profiles").update({ governorate_id: next }).eq("id", userId);
			qc.invalidateQueries({ queryKey: ["session"] });
		}
		qc.invalidateQueries();
	}, [qc, userId]);
	return {
		governorates: governorates ?? [],
		governorateId: id,
		governorate: current,
		select
	};
}
//#endregion
export { useNeighborhoods as n, useSelectedGovernorate as r, useGovernorates as t };
