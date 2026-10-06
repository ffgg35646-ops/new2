import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import "../_libs/sonner.mjs";
require_react();
require_jsx_runtime();
var $$splitComponentImporter = () => import("./admin-cIKU7Cy1.mjs");
var Route = createFileRoute("/admin")({
	validateSearch: (search) => ({ tab: search["tab"] === "offices" || search["tab"] === "plans" || search["tab"] === "geo" || search["tab"] === "reports" || search["tab"] === "support" || search["tab"] === "privacy" || search["tab"] === "terms" ? search["tab"] : "dashboard" }),
	head: () => ({ meta: [
		{ title: "لوحة الإدارة | عقار البطين" },
		{
			name: "description",
			content: "لوحة إدارة منصة عقار البطين وإحصائياتها وأقسام الإدارة."
		},
		{
			property: "og:title",
			content: "لوحة الإدارة | عقار البطين"
		},
		{
			property: "og:description",
			content: "لوحة إدارة منصة عقار البطين."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
