import { t as supabase } from "./client-BDpUJ4Jl.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office-C4hHv7Zt.js
function useMyOffice() {
	const { userId } = useAuth();
	return useQuery({
		queryKey: ["my-office-full", userId],
		enabled: !!userId,
		queryFn: async () => {
			const owned = await supabase.from("offices").select("*").eq("owner_id", userId).maybeSingle();
			if (owned.error) throw owned.error;
			if (owned.data) return {
				office: owned.data,
				isOwner: true,
				staff: null
			};
			const staff = await supabase.from("office_staff").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle();
			if (staff.error) throw staff.error;
			if (!staff.data) return {
				office: null,
				isOwner: false,
				staff: null
			};
			const office = await supabase.from("offices").select("*").eq("id", staff.data.office_id).maybeSingle();
			if (office.error) throw office.error;
			return {
				office: office.data ?? null,
				isOwner: false,
				staff: staff.data
			};
		}
	});
}
function useNewInquiriesCount(officeId) {
	return useQuery({
		queryKey: ["new-inquiries-count", officeId],
		enabled: !!officeId,
		queryFn: async () => {
			const { count, error } = await supabase.from("property_inquiries").select("id", {
				count: "exact",
				head: true
			}).eq("office_id", officeId).eq("status", "new");
			if (error) throw error;
			return count ?? 0;
		}
	});
}
async function copyToClipboard(url) {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(url);
			return true;
		}
	} catch {}
	try {
		const el = document.createElement("textarea");
		el.value = url;
		el.setAttribute("readonly", "");
		el.style.position = "fixed";
		el.style.opacity = "0";
		document.body.appendChild(el);
		el.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(el);
		return ok;
	} catch {
		return false;
	}
}
async function shareLink(title, url) {
	const absolute = new URL(url, window.location.origin).toString();
	if (typeof navigator !== "undefined" && typeof navigator.share === "function") try {
		await navigator.share({
			title,
			url: absolute
		});
		return "shared";
	} catch (err) {
		if (err?.name === "AbortError") return "cancelled";
	}
	return await copyToClipboard(absolute) ? "copied" : "failed";
}
function whatsappHref(phone, text) {
	const digits = phone.replace(/[^\d]/g, "").replace(/^0+/, "");
	return `https://wa.me/${digits.startsWith("966") ? digits : `966${digits.replace(/^966/, "")}`}?text=${encodeURIComponent(text)}`;
}
//#endregion
export { whatsappHref as i, useMyOffice as n, useNewInquiriesCount as r, shareLink as t };
