import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/follows-CiwpByax.js
function useFollowState(officeId) {
	const { userId } = useAuth();
	return useQuery({
		queryKey: [
			"follow-state",
			officeId,
			userId
		],
		enabled: !!officeId && !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("follows").select("id,notify").eq("office_id", officeId).eq("user_id", userId).maybeSingle();
			if (error) throw error;
			return {
				following: !!data,
				notify: data?.notify ?? false
			};
		}
	});
}
function useToggleFollow() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (vars) => {
			if (!userId) throw new Error("يجب تسجيل الدخول لمتابعة المكاتب");
			if (vars.following) {
				const { error } = await supabase.from("follows").delete().eq("office_id", vars.officeId).eq("user_id", userId);
				if (error) throw error;
				return false;
			}
			const { error } = await supabase.from("follows").insert({
				office_id: vars.officeId,
				user_id: userId
			});
			if (error) throw error;
			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["follow-state"] });
			qc.invalidateQueries({ queryKey: ["followed-offices"] });
		}
	});
}
function useSetOfficeNotifications() {
	const { userId } = useAuth();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (vars) => {
			if (!userId) throw new Error("يجب تسجيل الدخول لتفعيل الإشعارات");
			const existing = await supabase.from("follows").select("id").eq("office_id", vars.officeId).eq("user_id", userId).maybeSingle();
			if (existing.error) throw existing.error;
			if (!existing.data) {
				if (!vars.notify) return vars.notify;
				const { error } = await supabase.from("follows").insert({
					office_id: vars.officeId,
					user_id: userId,
					notify: true
				});
				if (error) throw error;
				return true;
			}
			const { error } = await supabase.from("follows").update({ notify: vars.notify }).eq("id", existing.data.id);
			if (error) throw error;
			return vars.notify;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["follow-state"] });
			qc.invalidateQueries({ queryKey: ["followed-offices"] });
		}
	});
}
function useFollowedOffices() {
	const { userId } = useAuth();
	return useQuery({
		queryKey: ["followed-offices", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data, error } = await supabase.from("follows").select("created_at,notify,offices(id,name,logo_url,verification_status,rating_avg,reviews_count,address,governorates(name_ar))").eq("user_id", userId).order("created_at", { ascending: false });
			if (error) throw error;
			const rows = (data ?? []).map((row) => {
				const r = row;
				return {
					notify: r.notify ?? false,
					office: r.offices
				};
			}).filter((r) => !!r.office);
			return Promise.all(rows.map(async (r) => {
				const office = r.office;
				const { count } = await supabase.from("properties").select("id", {
					count: "exact",
					head: true
				}).eq("office_id", office.id).eq("is_published", true).eq("is_deleted", false);
				return {
					...office,
					notify: r.notify,
					properties_count: count ?? 0
				};
			}));
		}
	});
}
//#endregion
export { useToggleFollow as i, useFollowedOffices as n, useSetOfficeNotifications as r, useFollowState as t };
