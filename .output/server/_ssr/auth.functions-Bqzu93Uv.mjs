import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as createServerRpc } from "./createServerRpc-CxD4EZ5P.mjs";
import { a as stringType, i as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.functions-Bqzu93Uv.js
var resolveEmailForPhone_createServerFn_handler = createServerRpc({
	id: "84b9114139086ebb3cdd27a8da06f636e06f3c42ad5ca0a18ddcc4ec4b9adff7",
	name: "resolveEmailForPhone",
	filename: "src/lib/auth.functions.ts"
}, (opts) => resolveEmailForPhone.__executeServer(opts));
var resolveEmailForPhone = createServerFn({ method: "POST" }).inputValidator((data) => objectType({ phone: stringType().min(6).max(20) }).parse(data)).handler(resolveEmailForPhone_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	const { data: row } = await supabaseAdmin.from("profiles").select("email").eq("phone", data.phone).maybeSingle();
	return { email: row?.email ?? null };
});
//#endregion
export { resolveEmailForPhone_createServerFn_handler };
