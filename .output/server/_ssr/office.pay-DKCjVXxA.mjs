import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/office.pay-DKCjVXxA.js
var $$splitComponentImporter = () => import("./office.pay-DHR5pUWN.mjs");
var Route = createFileRoute("/office/pay")({
	validateSearch: (search) => ({ package: typeof search["package"] === "string" ? search["package"] : void 0 }),
	head: () => ({ meta: [{ title: "الدفع | عقار البطين" }, {
		name: "description",
		content: "إتمام دفع اشتراك الباقة المختارة بأمان."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
