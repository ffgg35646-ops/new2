//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-B5k53zIo.js
var manifest = {
	"84b9114139086ebb3cdd27a8da06f636e06f3c42ad5ca0a18ddcc4ec4b9adff7": {
		functionName: "resolveEmailForPhone_createServerFn_handler",
		importer: () => import("./_ssr/auth.functions-Bqzu93Uv.mjs")
	},
	"a2fbf8e7adf20964c7d3c58b05df09c46765ee6f80a8bf93a3ee7ddf73a273cf": {
		functionName: "getCachedPublicProperties_createServerFn_handler",
		importer: () => import("./_ssr/public-cache.functions-C1cdAxvx.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ??= await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
