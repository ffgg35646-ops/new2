import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/properties._propertyId-BBXCoXrJ.js
var $$splitNotFoundComponentImporter = () => import("./properties._propertyId--Ys9IOdh.mjs");
var $$splitErrorComponentImporter = () => import("./properties._propertyId-BYF_S8cc.mjs");
var $$splitComponentImporter = () => import("./properties._propertyId-X-_0gYE5.mjs");
var Route = createFileRoute("/properties/$propertyId")({
	head: () => ({ meta: [
		{ title: "تفاصيل العقار | عقار البطين" },
		{
			name: "description",
			content: "صور ومواصفات العقار وبيانات المكتب العقاري وحجز موعد معاينة."
		},
		{
			property: "og:title",
			content: "تفاصيل العقار | عقار البطين"
		},
		{
			property: "og:description",
			content: "كل تفاصيل العرض في صفحة واحدة."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
//#endregion
export { Route as t };
