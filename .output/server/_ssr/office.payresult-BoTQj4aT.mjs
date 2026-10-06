import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.payresult-BoTQj4aT.js
var $$splitComponentImporter = () => import("./office.payresult-DY3Xt9_0.mjs");
var Route = createFileRoute("/office/payresult")({
	validateSearch: (search) => ({
		id: typeof search["id"] === "string" ? search["id"] : void 0,
		resourcePath: typeof search["resourcePath"] === "string" ? search["resourcePath"] : void 0
	}),
	head: () => ({ meta: [{ title: "نتيجة الدفع | عقار البطين" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
