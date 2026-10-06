import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DfdXUDDw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
async function loadSession() {
	const { data } = await supabase.auth.getSession();
	const session = data.session ?? null;
	if (!session) return {
		session: null,
		userId: null,
		roles: [],
		profile: null,
		officeId: null,
		officeVerificationStatus: null,
		officeRejectionReason: null
	};
	const [rolesRes, profileRes, officeRes] = await Promise.all([
		supabase.from("user_roles").select("role").eq("user_id", session.user.id),
		supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
		supabase.from("offices").select("id,verification_status,rejection_reason").eq("owner_id", session.user.id).maybeSingle()
	]);
	return {
		session,
		userId: session.user.id,
		roles: (rolesRes.data ?? []).map((r) => r.role),
		profile: profileRes.data ?? null,
		officeId: officeRes.data?.id ?? null,
		officeVerificationStatus: officeRes.data?.verification_status ?? null,
		officeRejectionReason: officeRes.data?.rejection_reason ?? null
	};
}
function useAuth() {
	const qc = useQueryClient();
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") qc.invalidateQueries({ queryKey: ["session"] });
		});
		return () => sub.subscription.unsubscribe();
	}, [qc]);
	const query = useQuery({
		queryKey: ["session"],
		queryFn: loadSession,
		staleTime: 6e5,
		gcTime: 864e5,
		refetchOnWindowFocus: false
	});
	const info = query.data;
	return {
		...query,
		session: info?.session ?? null,
		userId: info?.userId ?? null,
		roles: info?.roles ?? [],
		profile: info?.profile ?? null,
		officeId: info?.officeId ?? null,
		officeVerificationStatus: info?.officeVerificationStatus ?? null,
		officeRejectionReason: info?.officeRejectionReason ?? null,
		isOffice: (info?.roles ?? []).includes("office"),
		isAdmin: (info?.roles ?? []).includes("admin")
	};
}
async function signOut() {
	await supabase.auth.signOut();
}
//#endregion
export { useAuth as n, signOut as t };
