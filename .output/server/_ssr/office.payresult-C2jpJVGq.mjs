import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.payresult-C2jpJVGq.js
var $$splitComponentImporter = () => import("./office.payresult-BG6NLe4p.mjs");
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
