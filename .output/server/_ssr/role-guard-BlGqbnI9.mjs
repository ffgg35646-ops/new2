import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as useAuth } from "./auth-DfdXUDDw.mjs";
import { x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/role-guard-BlGqbnI9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function homeForRoles(roles) {
	if (roles.includes("office")) return "/office";
	if (roles.includes("admin")) return "/admin";
	return "/home";
}
function RoleGuard({ allow, guestsTo, children }) {
	const navigate = useNavigate();
	const { roles, session, data, isLoading } = useAuth();
	const settled = !isLoading || !!data;
	const isGuest = settled && !session;
	const allowed = allow.some((r) => roles.includes(r));
	const effectiveRoles = roles.length ? roles : ["individual"];
	const blocked = settled && !!session && !allowed;
	(0, import_react.useEffect)(() => {
		if (isGuest && guestsTo) {
			navigate({
				to: guestsTo,
				replace: true
			});
			return;
		}
		if (blocked) navigate({
			to: homeForRoles(effectiveRoles),
			replace: true
		});
	}, [
		isGuest,
		blocked,
		guestsTo,
		roles.join(",")
	]);
	if (!settled || blocked || isGuest && guestsTo) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin text-forest" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
//#endregion
export { homeForRoles as n, RoleGuard as t };
