import { _ as lazyRouteComponent, v as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chats-BwhXhj08.js
var $$splitComponentImporter = () => import("./chats-D_mDSaN7.mjs");
var Route = createFileRoute("/chats")({
	validateSearch: (search) => ({ c: typeof search["c"] === "string" ? search["c"] : void 0 }),
	head: () => ({ meta: [
		{ title: "محادثاتي | عقار البطين" },
		{
			name: "description",
			content: "محادثاتك مع المكاتب العقارية حول العقارات التي استفسرت عنها."
		},
		{
			property: "og:title",
			content: "محادثاتي | عقار البطين"
		},
		{
			property: "og:description",
			content: "تواصل مباشرة مع المكاتب العقارية داخل التطبيق."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
