//#region node_modules/.nitro/vite/services/ssr/assets/location-C7S-OTk4.js
function parseLatLng(input) {
	const s = input.trim();
	if (!s) return null;
	for (const re of [
		/@(-?\d+\.\d+),(-?\d+\.\d+)/,
		/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
		/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
		/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/
	]) {
		const m = s.match(re);
		if (m) {
			const lat = Number(m[1]);
			const lng = Number(m[2]);
			if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return {
				lat,
				lng
			};
		}
	}
	return null;
}
function googleMapsUrl(lat, lng) {
	return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
function getCurrentPosition() {
	return new Promise((resolve, reject) => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			reject(/* @__PURE__ */ new Error("خدمة الموقع غير مدعومة على هذا الجهاز"));
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => resolve({
			lat: pos.coords.latitude,
			lng: pos.coords.longitude
		}), () => reject(/* @__PURE__ */ new Error("تعذّر تحديد موقعك — تأكد من تفعيل صلاحية الموقع")), {
			enableHighAccuracy: true,
			timeout: 1e4
		});
	});
}
//#endregion
export { googleMapsUrl as n, parseLatLng as r, getCurrentPosition as t };
