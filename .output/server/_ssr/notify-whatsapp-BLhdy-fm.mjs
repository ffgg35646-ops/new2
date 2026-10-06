import { t as supabase } from "./client-BDpUJ4Jl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notify-whatsapp-BLhdy-fm.js
function notifyWhatsApp(event, id) {
	supabase.functions.invoke("notify-whatsapp", { body: {
		event,
		id
	} }).catch((e) => console.warn("[whatsapp] فشل إرسال الإشعار:", e));
}
//#endregion
export { notifyWhatsApp as t };
