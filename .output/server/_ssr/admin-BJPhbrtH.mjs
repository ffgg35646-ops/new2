import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BJPhbrtH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function sortNewest(rows) {
	return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
async function fetchAdminDirectory() {
	const [rolesRes, profilesRes, officesRes] = await Promise.all([
		supabase.from("user_roles").select("user_id,role,created_at").in("role", ["individual", "office"]),
		supabase.from("profiles").select("id,full_name,phone,email,governorate_id,created_at,governorates(name_ar)").order("created_at", { ascending: false }),
		supabase.from("offices").select("id,owner_id,name,manager_name,phone,email,address,commercial_register,license_number,fal_license_number,governorate_id,verification_status,rejection_reason,plan,plan_expires_at,created_at,updated_at,is_deleted,governorates(name_ar)").eq("is_deleted", false).order("created_at", { ascending: false })
	]);
	if (rolesRes.error) throw rolesRes.error;
	if (profilesRes.error) throw profilesRes.error;
	if (officesRes.error) throw officesRes.error;
	const individualIds = new Set((rolesRes.data ?? []).filter((r) => r.role === "individual").map((r) => r.user_id));
	const profiles = profilesRes.data ?? [];
	const offices = officesRes.data ?? [];
	return {
		individuals: sortNewest(profiles.filter((p) => individualIds.has(p.id)).map((p) => ({
			id: p.id,
			full_name: p.full_name,
			phone: p.phone,
			email: p.email,
			governorate_id: p.governorate_id,
			governorate_name: p.governorates?.name_ar ?? null,
			created_at: p.created_at
		}))),
		offices: sortNewest(offices.map((o) => ({
			id: o.id,
			owner_id: o.owner_id,
			name: o.name,
			manager_name: o.manager_name,
			phone: o.phone,
			email: o.email,
			address: o.address,
			commercial_register: o.commercial_register,
			license_number: o.license_number,
			fal_license_number: o.fal_license_number,
			governorate_id: o.governorate_id,
			governorate_name: o.governorates?.name_ar ?? null,
			verification_status: o.verification_status,
			rejection_reason: o.rejection_reason,
			plan: o.plan,
			plan_expires_at: o.plan_expires_at,
			created_at: o.created_at,
			updated_at: o.updated_at,
			is_deleted: o.is_deleted
		})))
	};
}
function readSessionCache(key) {
	if (typeof window === "undefined") return void 0;
	try {
		const raw = sessionStorage.getItem(key);
		if (!raw) return void 0;
		const parsed = JSON.parse(raw);
		if (!parsed || !parsed.data || !parsed.savedAt) return;
		return parsed;
	} catch {
		return;
	}
}
function writeSessionCache(key, data) {
	if (typeof window === "undefined") return;
	try {
		const value = {
			data,
			savedAt: Date.now()
		};
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch {}
}
function useAdminDirectory() {
	const cached = readSessionCache("aqar-admin-directory");
	const query = useQuery({
		queryKey: ["admin-directory"],
		queryFn: fetchAdminDirectory,
		initialData: cached?.data,
		initialDataUpdatedAt: cached?.savedAt,
		staleTime: 6e4,
		gcTime: 18e5,
		refetchInterval: 6e4,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		refetchOnMount: true,
		retry: 2
	});
	(0, import_react.useEffect)(() => {
		if (query.data) writeSessionCache("aqar-admin-directory", query.data);
	}, [query.data]);
	return query;
}
async function fetchAdminDashboardStats() {
	const [individualUsersRes, officeUsersRes, propertiesRes, publishedPropertiesRes, propertyRequestsRes, bookingsRes, openReportsRes] = await Promise.all([
		supabase.from("user_roles").select("user_id", {
			count: "exact",
			head: true
		}).eq("role", "individual"),
		supabase.from("user_roles").select("user_id", {
			count: "exact",
			head: true
		}).eq("role", "office"),
		supabase.from("properties").select("id", {
			count: "exact",
			head: true
		}).eq("is_deleted", false),
		supabase.from("properties").select("id", {
			count: "exact",
			head: true
		}).eq("is_deleted", false).eq("is_published", true),
		supabase.from("property_requests").select("id", {
			count: "exact",
			head: true
		}),
		supabase.from("viewing_bookings").select("id", {
			count: "exact",
			head: true
		}),
		supabase.from("reports").select("id", {
			count: "exact",
			head: true
		}).eq("resolved", false)
	]);
	if (individualUsersRes.error) throw individualUsersRes.error;
	if (officeUsersRes.error) throw officeUsersRes.error;
	if (propertiesRes.error) throw propertiesRes.error;
	if (publishedPropertiesRes.error) throw publishedPropertiesRes.error;
	if (propertyRequestsRes.error) throw propertyRequestsRes.error;
	if (bookingsRes.error) throw bookingsRes.error;
	if (openReportsRes.error) throw openReportsRes.error;
	const individualUsers = individualUsersRes.count ?? 0;
	const officeUsers = officeUsersRes.count ?? 0;
	return {
		totalUsers: individualUsers + officeUsers,
		individualUsers,
		officeUsers,
		properties: propertiesRes.count ?? 0,
		publishedProperties: publishedPropertiesRes.count ?? 0,
		propertyRequests: propertyRequestsRes.count ?? 0,
		bookings: bookingsRes.count ?? 0,
		openReports: openReportsRes.count ?? 0
	};
}
function useAdminDashboardStats() {
	const cached = readSessionCache("aqar-admin-dashboard-stats");
	const query = useQuery({
		queryKey: ["admin-dashboard-stats"],
		queryFn: fetchAdminDashboardStats,
		initialData: cached?.data,
		initialDataUpdatedAt: cached?.savedAt,
		staleTime: 6e4,
		gcTime: 18e5,
		refetchInterval: 6e4,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		refetchOnMount: true,
		retry: 2
	});
	(0, import_react.useEffect)(() => {
		if (query.data) writeSessionCache("aqar-admin-dashboard-stats", query.data);
	}, [query.data]);
	return query;
}
async function fetchIndividualActivity(userId) {
	const [viewsRes, favoritesRes, requestsRes, bookingsRes, reviewsRes] = await Promise.all([
		supabase.from("property_views").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("favorites").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("property_requests").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("viewing_bookings").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId),
		supabase.from("office_reviews").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", userId)
	]);
	if (viewsRes.error) throw viewsRes.error;
	if (favoritesRes.error) throw favoritesRes.error;
	if (requestsRes.error) throw requestsRes.error;
	if (bookingsRes.error) throw bookingsRes.error;
	if (reviewsRes.error) throw reviewsRes.error;
	return {
		propertyViews: viewsRes.count ?? 0,
		favorites: favoritesRes.count ?? 0,
		propertyRequests: requestsRes.count ?? 0,
		bookings: bookingsRes.count ?? 0,
		officeReviews: reviewsRes.count ?? 0
	};
}
function useIndividualActivity(userId, enabled = true) {
	return useQuery({
		queryKey: ["admin-individual-activity", userId],
		queryFn: () => fetchIndividualActivity(userId),
		enabled,
		staleTime: 6e4,
		gcTime: 6e5,
		refetchOnWindowFocus: false
	});
}
async function fetchOfficeActivity(officeId) {
	const [propertiesRes, inquiriesRes, bookingsRes, reviewsRes, staffRes] = await Promise.all([
		supabase.from("properties").select("id,is_published,views_count").eq("office_id", officeId).eq("is_deleted", false),
		supabase.from("property_inquiries").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("viewing_bookings").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("office_reviews").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId),
		supabase.from("office_staff").select("id", {
			count: "exact",
			head: true
		}).eq("office_id", officeId).eq("is_active", true)
	]);
	if (propertiesRes.error) throw propertiesRes.error;
	if (inquiriesRes.error) throw inquiriesRes.error;
	if (bookingsRes.error) throw bookingsRes.error;
	if (reviewsRes.error) throw reviewsRes.error;
	if (staffRes.error) throw staffRes.error;
	const props = propertiesRes.data ?? [];
	return {
		properties: props.length,
		publishedProperties: props.filter((p) => p.is_published).length,
		views: props.reduce((sum, p) => sum + (p.views_count ?? 0), 0),
		inquiries: inquiriesRes.count ?? 0,
		bookings: bookingsRes.count ?? 0,
		reviews: reviewsRes.count ?? 0,
		staff: staffRes.count ?? 0
	};
}
function useOfficeActivity(officeId, enabled = true) {
	return useQuery({
		queryKey: ["admin-office-activity", officeId],
		queryFn: () => fetchOfficeActivity(officeId),
		enabled,
		staleTime: 6e4,
		gcTime: 6e5,
		refetchOnWindowFocus: false
	});
}
function isTodaySaudi(date) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Riyadh",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
	return formatter.format(new Date(date)) === formatter.format(/* @__PURE__ */ new Date());
}
//#endregion
export { useAdminDirectory as a, useAdminDashboardStats as i, fetchOfficeActivity as n, useIndividualActivity as o, isTodaySaudi as r, useOfficeActivity as s, fetchIndividualActivity as t };
