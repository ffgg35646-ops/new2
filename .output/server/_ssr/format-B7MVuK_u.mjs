//#region node_modules/.nitro/vite/services/ssr/assets/format-B7MVuK_u.js
function formatPrice(value) {
	const n = Number(value ?? 0);
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
function formatArea(value) {
	const n = Number(value ?? 0);
	return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} م²`;
}
function timeAgo(iso) {
	if (!iso) return "";
	const diff = Date.now() - new Date(iso).getTime();
	const m = Math.floor(diff / 6e4);
	if (m < 1) return "الآن";
	if (m < 60) return `قبل ${m} دقيقة`;
	const h = Math.floor(m / 60);
	if (h < 24) return `قبل ${h} ساعة`;
	const d = Math.floor(h / 24);
	if (d < 30) return `قبل ${d} يوم`;
	const mo = Math.floor(d / 30);
	if (mo < 12) return `قبل ${mo} شهر`;
	return `قبل ${Math.floor(mo / 12)} سنة`;
}
function formatDate(iso) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("ar-SA-u-nu-latn", {
		year: "numeric",
		month: "short",
		day: "numeric"
	});
}
//#endregion
export { timeAgo as i, formatDate as n, formatPrice as r, formatArea as t };
