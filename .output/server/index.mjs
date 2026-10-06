globalThis.__nitro_main__ = import.meta.url;
import { i as HTTPError, n as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-10-06T04:03:51.954Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/logo.jpg": {
		"type": "image/jpeg",
		"etag": "\"12b3e-1ZXfUwnvVglXUW5SHUscilevf+o\"",
		"mtime": "2026-10-06T04:03:51.942Z",
		"size": 76606,
		"path": "../public/logo.jpg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"1f8-7+bM7blFkJWLRBzFie6fTxllDz4\"",
		"mtime": "2026-10-06T04:03:51.926Z",
		"size": 504,
		"path": "../public/manifest.webmanifest"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-10-06T04:03:51.926Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/AdminShell-Bs5QC3h-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2282-l4PZ00qq6N5lxfFsLeBSLLluFT8\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 8834,
		"path": "../public/assets/AdminShell-Bs5QC3h-.js"
	},
	"/assets/AppHeader-DGvQjwKW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16d4b-w75a5RWpby8rkAskLH8uPg0Rocw\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 93515,
		"path": "../public/assets/AppHeader-DGvQjwKW.js"
	},
	"/assets/AuthForm-b4xdmwVy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"39c3-oOGry2O/xOcL4NSjarKNnXCMyI0\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 14787,
		"path": "../public/assets/AuthForm-b4xdmwVy.js"
	},
	"/assets/BottomNav-BaFG0Gtf.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d57-PE8mKrqeESR3fGWKgJI/OKFSfR0\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 3415,
		"path": "../public/assets/BottomNav-BaFG0Gtf.js"
	},
	"/assets/BrandLogo-DKFPor3n.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"112-I1kt150aP/YslvHOQB94cnt/QWg\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 274,
		"path": "../public/assets/BrandLogo-DKFPor3n.js"
	},
	"/assets/ChatThread-D_nQCDRW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2655-fLXExXlTEALWpn6XUNQoAP6ZgKo\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 9813,
		"path": "../public/assets/ChatThread-D_nQCDRW.js"
	},
	"/assets/EmptyState-Cq8AX_DS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32d-2Z+75jaWn+sBwgQ0jO1Vd677GIk\"",
		"mtime": "2026-10-06T04:03:38.163Z",
		"size": 813,
		"path": "../public/assets/EmptyState-Cq8AX_DS.js"
	},
	"/assets/LocationPicker-C7PCL4Uu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a71-U2RxSNTFmP8Gybzpe9nD/Hw2QxA\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 2673,
		"path": "../public/assets/LocationPicker-C7PCL4Uu.js"
	},
	"/assets/MediaUploader-Cih650gB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"929-obcOJgtoiCZPGuHZhGoqhKEPXTA\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 2345,
		"path": "../public/assets/MediaUploader-Cih650gB.js"
	},
	"/assets/OfficeCard-CG_C5PTu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"725-3Z1pPmFubXzap3DabaQTxZQDdUk\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 1829,
		"path": "../public/assets/OfficeCard-CG_C5PTu.js"
	},
	"/assets/ProLock-CVwB7gvR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6dc-qg6mzJS8OokfLJKv1SdvbIZyLJU\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 1756,
		"path": "../public/assets/ProLock-CVwB7gvR.js"
	},
	"/assets/QrDialog-DlO0ns63.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"633d-SBOF2EgZm5vswhWI7YXUOxYvnLI\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 25405,
		"path": "../public/assets/QrDialog-DlO0ns63.js"
	},
	"/assets/QueryClientProvider-BYJwDUxm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19c-IPopfS4glxGJSdog6k21mVVPnf0\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 412,
		"path": "../public/assets/QueryClientProvider-BYJwDUxm.js"
	},
	"/assets/SupportCenter-Ca6HKUwJ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2a65-nxc3LJUlt3Gr/GYZbsymQs578nY\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 10853,
		"path": "../public/assets/SupportCenter-Ca6HKUwJ.js"
	},
	"/assets/account-CYZQPo-U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a66-4hzvYjT092qNd93nQG/uyp5zCq4\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 6758,
		"path": "../public/assets/account-CYZQPo-U.js"
	},
	"/assets/admin-B_3VTAmw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a40-Ck/slnOJXc1wFF7SuETnMlL9/0c\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 35392,
		"path": "../public/assets/admin-B_3VTAmw.js"
	},
	"/assets/admin.individuals-Cr661ZJZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18ac-3PB41UKbcVFDdeof/nqHEdEoajw\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 6316,
		"path": "../public/assets/admin.individuals-Cr661ZJZ.js"
	},
	"/assets/admin.individuals._userId-CuTcltDD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14f6-2Q9KCFBTH5eSTimb5x1ZHEfcLoA\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 5366,
		"path": "../public/assets/admin.individuals._userId-CuTcltDD.js"
	},
	"/assets/admin.login-DXGN6Z6U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c33-6zPZaGNmxc0C/acplaAhuSZ0+Ao\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 3123,
		"path": "../public/assets/admin.login-DXGN6Z6U.js"
	},
	"/assets/admin.notifications-w1n0TW8d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"225c-f38d3VBaz/wXjPiJJIkdVqT/mJQ\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 8796,
		"path": "../public/assets/admin.notifications-w1n0TW8d.js"
	},
	"/assets/admin.offices-BSzfs3GR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"22e7-emKKBQ1wx2n31FSQ0+LeQID3RJY\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 8935,
		"path": "../public/assets/admin.offices-BSzfs3GR.js"
	},
	"/assets/admin.offices._officeId-Co2Kny6N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ebf-ZE8bDaEE3EHZGoEFvEXStoyNckw\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 7871,
		"path": "../public/assets/admin.offices._officeId-Co2Kny6N.js"
	},
	"/assets/arrow-right-D_t5sPRj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a5-XHJ2krzauuuVct3LIC4QXtEU/Ag\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 165,
		"path": "../public/assets/arrow-right-D_t5sPRj.js"
	},
	"/assets/auth-Cfodsll8.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5db3-5t3qhArUI9gFGD6LXvSnTCtxw20\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 23987,
		"path": "../public/assets/auth-Cfodsll8.js"
	},
	"/assets/auth.admin-DTxwpmqz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df7-2zM/uwlVKY40koXe1XZ7hCPoVQc\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 3575,
		"path": "../public/assets/auth.admin-DTxwpmqz.js"
	},
	"/assets/auth.confirm-Dw6l7SV3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bfd-HTgLPCNHBUjMBUE3lb2gLs/JHTk\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 3069,
		"path": "../public/assets/auth.confirm-Dw6l7SV3.js"
	},
	"/assets/auth.forgot-password-rJdUBtVY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"df2-/Pq2SjI7hiob7jUfO8FFjODzDXM\"",
		"mtime": "2026-10-06T04:03:38.164Z",
		"size": 3570,
		"path": "../public/assets/auth.forgot-password-rJdUBtVY.js"
	},
	"/assets/auth.individual-CytCo326.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9c-OsCSI8PTRMwpTAYk6HtA4pkP4nI\"",
		"mtime": "2026-10-06T04:03:38.165Z",
		"size": 156,
		"path": "../public/assets/auth.individual-CytCo326.js"
	},
	"/assets/auth.office-a-F1rTg-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c4-6r6skJDiMw9BTZK61roPdUNKgIU\"",
		"mtime": "2026-10-06T04:03:38.165Z",
		"size": 196,
		"path": "../public/assets/auth.office-a-F1rTg-.js"
	},
	"/assets/auth.reset-password-CgXQyVYN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1269-1aVDbiOoP/myj7SMm6//rvA0y8c\"",
		"mtime": "2026-10-06T04:03:38.165Z",
		"size": 4713,
		"path": "../public/assets/auth.reset-password-CgXQyVYN.js"
	},
	"/assets/auth.verify-email-C9lJ-7uY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f75-f1ZWC1LaczZh2bGf1nkPAW4Ji0M\"",
		"mtime": "2026-10-06T04:03:38.165Z",
		"size": 3957,
		"path": "../public/assets/auth.verify-email-C9lJ-7uY.js"
	},
	"/assets/bell-CQJdeobV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-emzvHK4rnN7HyTIqPcfpCEpFXjo\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 290,
		"path": "../public/assets/bell-CQJdeobV.js"
	},
	"/assets/building-2-Cz3uT5aP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"17f-Ayb9alM7jnx9W4VnWg16UHBB3to\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 383,
		"path": "../public/assets/building-2-Cz3uT5aP.js"
	},
	"/assets/calendar-days-D_z85A7Y.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ee-migkJY2xMmIZlQRiEDbT6E6s5ok\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 494,
		"path": "../public/assets/calendar-days-D_z85A7Y.js"
	},
	"/assets/chats-BdVk_qNW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1037-ZjReOxoc0fh+0NmZPsYxO0URYaA\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 4151,
		"path": "../public/assets/chats-BdVk_qNW.js"
	},
	"/assets/check-l8y3aT-v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7c-FqLs8h+iQdAPdsVYAoUqh52jJ2o\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 124,
		"path": "../public/assets/check-l8y3aT-v.js"
	},
	"/assets/chevron-down-CMzGfsmT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"80-guELS0+5BpD1dMOEmb2aT/leUCU\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 128,
		"path": "../public/assets/chevron-down-CMzGfsmT.js"
	},
	"/assets/chevron-left-eEe2n3pc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"82-DQ9dej/VByl8V9H8ZfaQBVzhFPw\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 130,
		"path": "../public/assets/chevron-left-eEe2n3pc.js"
	},
	"/assets/chevron-up-C2TuGXIA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"80-/8IRAcdm8lrqAXu5CXrsMdUBnoI\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 128,
		"path": "../public/assets/chevron-up-C2TuGXIA.js"
	},
	"/assets/circle-x-DGO_O_3A.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14c-UTKY/rIEzYvs79JdtS1WfKGOn7w\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 332,
		"path": "../public/assets/circle-x-DGO_O_3A.js"
	},
	"/assets/client-DcjfjkLy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"33f87-Yn7xKFI4E6b+7ejpWeZRH541QdY\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 212871,
		"path": "../public/assets/client-DcjfjkLy.js"
	},
	"/assets/clock-3-s-EfcmD7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a9-o2HM5owW85OZ9ytpor1MHSwksgs\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 169,
		"path": "../public/assets/clock-3-s-EfcmD7.js"
	},
	"/assets/constants-CzAoXWVz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"877-n0dHUfmeGre794pbUjAWr41g368\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 2167,
		"path": "../public/assets/constants-CzAoXWVz.js"
	},
	"/assets/createClientRpc-DwlRmguy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8218-nkC8djQa2MCZbEF+hvtuurgh+VM\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 33304,
		"path": "../public/assets/createClientRpc-DwlRmguy.js"
	},
	"/assets/createLucideIcon-Dz5w4CtK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4d0-ElRig+iTYv5Ba8fXcpYcTeHERzY\"",
		"mtime": "2026-10-06T04:03:38.172Z",
		"size": 1232,
		"path": "../public/assets/createLucideIcon-Dz5w4CtK.js"
	},
	"/assets/createServerFn-CQkCD538.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1171-gtBmcV/3djU2xSA0+oTlf5oiqEs\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 4465,
		"path": "../public/assets/createServerFn-CQkCD538.js"
	},
	"/assets/crown-QxIH2HsF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16a-BtFrIapuheUvjBYhMl2auw9KyeE\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 362,
		"path": "../public/assets/crown-QxIH2HsF.js"
	},
	"/assets/dist-CoyTvvSm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8336-nSyWvspZ8WnSQPEt/LOSP0DIyXs\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 33590,
		"path": "../public/assets/dist-CoyTvvSm.js"
	},
	"/assets/esm-Ckt1VxNB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2045-3aKYo4CFGGbj4Z/3eYOSW/kwcEw\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 8261,
		"path": "../public/assets/esm-Ckt1VxNB.js"
	},
	"/assets/extras-CpAztweO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da7-sZ46s7g078Eajwqe59aO+azNBB8\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 3495,
		"path": "../public/assets/extras-CpAztweO.js"
	},
	"/assets/eye-8YoOALhG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"100-UiQXjpUqmzsjlyB8H/P2NnJG4Hw\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 256,
		"path": "../public/assets/eye-8YoOALhG.js"
	},
	"/assets/favorites-CVXNYP2v.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"745-v650s2W3CghaUuXszWoEPddOH58\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 1861,
		"path": "../public/assets/favorites-CVXNYP2v.js"
	},
	"/assets/file-check-corner-C7i_RZzZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b-lcTYQZ30f4pGlkNXWwekr2yWQww\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 315,
		"path": "../public/assets/file-check-corner-C7i_RZzZ.js"
	},
	"/assets/flag-PUKh4tZW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fe-da66+eFr8uOe3tNJv/ChvagqzV4\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 254,
		"path": "../public/assets/flag-PUKh4tZW.js"
	},
	"/assets/follows-jSMUYTDM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b83-eAadwuLBwCzazIXReRoMofoh4Wk\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 2947,
		"path": "../public/assets/follows-jSMUYTDM.js"
	},
	"/assets/format-h4V0qHm6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2e3-qDuhgHaOk3gThpwcUlqi3dkhTto\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 739,
		"path": "../public/assets/format-h4V0qHm6.js"
	},
	"/assets/governorate-7rd-4Ji_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"540-Mp3xduR2gDsrfsBYtCBSJm+8ylI\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 1344,
		"path": "../public/assets/governorate-7rd-4Ji_.js"
	},
	"/assets/heart-BbPucAbG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"102-tiqqB3ZkXy3teTjWoEUnkXkNZ3Y\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 258,
		"path": "../public/assets/heart-BbPucAbG.js"
	},
	"/assets/home-CKQJiaZT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1704-VtAp0oUBYuEQCR6JB1ZghA+jJh0\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 5892,
		"path": "../public/assets/home-CKQJiaZT.js"
	},
	"/assets/image-plus-B1QVNvHS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16b-71kknKObo7in14O3We+p0zEC4eU\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 363,
		"path": "../public/assets/image-plus-B1QVNvHS.js"
	},
	"/assets/index-BR-tuw76.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"495ed-V7mDyzZyS/+Yj4OP6HxLvemSUn8\"",
		"mtime": "2026-10-06T04:03:38.157Z",
		"size": 300525,
		"path": "../public/assets/index-BR-tuw76.js"
	},
	"/assets/invariant-DEEwAagU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c-eVh/3DMi1s3cxf4N/OJar+ew1jA\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 60,
		"path": "../public/assets/invariant-DEEwAagU.js"
	},
	"/assets/jsx-runtime-BkSabwWG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c1-VkW1xFbt56H2FC99QIi6PTzaFIo\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 961,
		"path": "../public/assets/jsx-runtime-BkSabwWG.js"
	},
	"/assets/key-round-dRCybhdS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"163-sVAS5TEpRY9DMPsfKXKN4O8kt3s\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 355,
		"path": "../public/assets/key-round-dRCybhdS.js"
	},
	"/assets/link-xTSVJL1b.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2c00-mInZBaeQx/orD7/sVQbl420NjO8\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 11264,
		"path": "../public/assets/link-xTSVJL1b.js"
	},
	"/assets/loader-circle-DdNdnF6-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"90-ELanz1UG8Qw5Rk6lepHI5HGulmY\"",
		"mtime": "2026-10-06T04:03:38.173Z",
		"size": 144,
		"path": "../public/assets/loader-circle-DdNdnF6-.js"
	},
	"/assets/location-Cm854WgZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"381-LHU5jyVH8I2tzeTd0cOLnvBkJ+w\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 897,
		"path": "../public/assets/location-Cm854WgZ.js"
	},
	"/assets/log-out-BqpWcKQz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e6-4PTVIX17zwlUivaW43A6usYXmB8\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 230,
		"path": "../public/assets/log-out-BqpWcKQz.js"
	},
	"/assets/logo-Co891RHR.jpeg": {
		"type": "image/jpeg",
		"etag": "\"12b3e-1ZXfUwnvVglXUW5SHUscilevf+o\"",
		"mtime": "2026-10-06T04:03:38.177Z",
		"size": 76606,
		"path": "../public/assets/logo-Co891RHR.jpeg"
	},
	"/assets/map-pin-BnQggz49.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"103-RV/bI8CCDdcxRT+aiaLQv1Q04t0\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 259,
		"path": "../public/assets/map-pin-BnQggz49.js"
	},
	"/assets/message-circle-DpgrN90q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f1-IV/MMcfX5DUK0F0CT8dCWsy6RAM\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 241,
		"path": "../public/assets/message-circle-DpgrN90q.js"
	},
	"/assets/moon-B7pZ1HCu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d9-V4TOu3v6GQfAgZBeffvO+fagtWw\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 217,
		"path": "../public/assets/moon-B7pZ1HCu.js"
	},
	"/assets/notifications-B4iXOBV7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b4f-LZl9BIm7aqShHPJcPB1drtRnj6w\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 2895,
		"path": "../public/assets/notifications-B4iXOBV7.js"
	},
	"/assets/notify-whatsapp-BgWRqe_b.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c8-4p9Fsctn3BZbj5olUwqZwAB1mNA\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 200,
		"path": "../public/assets/notify-whatsapp-BgWRqe_b.js"
	},
	"/assets/office-sX4z5iUh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6f6-KIrjs87dVZH15QLoE0Kd5jUO8Xg\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 1782,
		"path": "../public/assets/office-sX4z5iUh.js"
	},
	"/assets/office.chat-CxIP_YjI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1385-pDqMRJr/d26Lyrn34pUlnqXW1wc\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 4997,
		"path": "../public/assets/office.chat-CxIP_YjI.js"
	},
	"/assets/office.index-BKiGm3k4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2191-9zaNLydNXbA9+D7R84AuAStZToU\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 8593,
		"path": "../public/assets/office.index-BKiGm3k4.js"
	},
	"/assets/office.pay-AXKPlzvK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1305-Tu9giAsHtRVLUqbiV6Acky2160k\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 4869,
		"path": "../public/assets/office.pay-AXKPlzvK.js"
	},
	"/assets/office.payresult-CYjqbR0s.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e74-xwlKSARUN0OAa6w+qaObOdWP7oE\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 3700,
		"path": "../public/assets/office.payresult-CYjqbR0s.js"
	},
	"/assets/office.profile-8C-Rt1FC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"341a-BVLxg2AsNJrQMLsM9+kh8dMD90E\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 13338,
		"path": "../public/assets/office.profile-8C-Rt1FC.js"
	},
	"/assets/office.properties._propertyId.edit-DMQUZhTN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a8a-LygzfwNLSwyBNSiDuQsrY33g74k\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 6794,
		"path": "../public/assets/office.properties._propertyId.edit-DMQUZhTN.js"
	},
	"/assets/office.properties.index-Y8bj_-yE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b9d-6mFcad2xrVcM73MBFjFglBjnZ5E\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 7069,
		"path": "../public/assets/office.properties.index-Y8bj_-yE.js"
	},
	"/assets/office.properties.new-Cl85o6l4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"199f-15ACl59aUZ+JwroJUANdZcLi4rQ\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 6559,
		"path": "../public/assets/office.properties.new-Cl85o6l4.js"
	},
	"/assets/office.requests-CIfP5Hf0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"31d8-uxbuSgNLT8Ya1eIWIPp8cme8Ewc\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 12760,
		"path": "../public/assets/office.requests-CIfP5Hf0.js"
	},
	"/assets/office.status-BUIlkuWu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1506-xzqs9vg+xkfiWs2Lc21Uc/Lbllc\"",
		"mtime": "2026-10-06T04:03:38.174Z",
		"size": 5382,
		"path": "../public/assets/office.status-BUIlkuWu.js"
	},
	"/assets/office.subscription-CTyAXDsT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"14cb-WhEVTs1yJElmz5hMv4OSNMw9NsI\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 5323,
		"path": "../public/assets/office.subscription-CTyAXDsT.js"
	},
	"/assets/offices._officeId-B0Ms2rSC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be-H1ftunD5EUlyfhpk/clin147xCU\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 190,
		"path": "../public/assets/offices._officeId-B0Ms2rSC.js"
	},
	"/assets/offices._officeId-BP9OO4EW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"421e-CpQyQ1fREvgC5wf35eVKZ2LBnMw\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 16926,
		"path": "../public/assets/offices._officeId-BP9OO4EW.js"
	},
	"/assets/offices._officeId-aYKF117W.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be-sKk4p3guMJ14yuUtnJZ5mYjSNJY\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 190,
		"path": "../public/assets/offices._officeId-aYKF117W.js"
	},
	"/assets/offices.following-B0Ms2rSC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be-H1ftunD5EUlyfhpk/clin147xCU\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 190,
		"path": "../public/assets/offices.following-B0Ms2rSC.js"
	},
	"/assets/offices.following-Dc6DA7y9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1206-LKpJxU43Vtw42hg19AwdvbygflI\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 4614,
		"path": "../public/assets/offices.following-Dc6DA7y9.js"
	},
	"/assets/offices.following-Pem8D4EM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c0-pMKiaqBmL7i/u6oy7YxEHnI9NP4\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 192,
		"path": "../public/assets/offices.following-Pem8D4EM.js"
	},
	"/assets/offices.index-DOfFKJhE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"66d-61uiUSIXpJx52JMr2IvyCfVhZuM\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 1645,
		"path": "../public/assets/offices.index-DOfFKJhE.js"
	},
	"/assets/pencil-DblvSzqz.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"114-zXdtbFSKDy7lYo59ovR/acLWeSM\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 276,
		"path": "../public/assets/pencil-DblvSzqz.js"
	},
	"/assets/phone-CFEnp_vY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"142-4P0LMu9r4gcnT90LEoUGGDPHuAU\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 322,
		"path": "../public/assets/phone-CFEnp_vY.js"
	},
	"/assets/plans-DOTHBvkh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c90-GUJ1mBuE6oo2+skkVTiWP7Z3odg\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 3216,
		"path": "../public/assets/plans-DOTHBvkh.js"
	},
	"/assets/plans-DnTP_a1w.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1008-CQJrWKEvwIgWwEQckcTxAAH4IRc\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 4104,
		"path": "../public/assets/plans-DnTP_a1w.js"
	},
	"/assets/plus-qBfxbRGB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"99-IjjluoFhtdy9WzGrabMTKGONY7s\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 153,
		"path": "../public/assets/plus-qBfxbRGB.js"
	},
	"/assets/preload-helper-BpATCFKB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12be-LaEhC8YsbPbXNH2mRZaomvwYUVA\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 4798,
		"path": "../public/assets/preload-helper-BpATCFKB.js"
	},
	"/assets/properties-IswkO9SX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1664-poWZvqHaJSyLKtNohlfo3REzYeI\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 5732,
		"path": "../public/assets/properties-IswkO9SX.js"
	},
	"/assets/properties._propertyId-C2P2vKsC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ba-FzCrBV858SixoPHhbXP72hNzBto\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 186,
		"path": "../public/assets/properties._propertyId-C2P2vKsC.js"
	},
	"/assets/properties._propertyId-CIvQT-4Z.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"49f6-rcBPZ+7AWLJE/Atrrt8s/RODiw8\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 18934,
		"path": "../public/assets/properties._propertyId-CIvQT-4Z.js"
	},
	"/assets/properties._propertyId-D2x8c-BZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"be-gqnM1lHqh62YjHQ19KAZxQJ1dXw\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 190,
		"path": "../public/assets/properties._propertyId-D2x8c-BZ.js"
	},
	"/assets/properties.index-suuF4zId.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9e5-5iQaFwA4SNzctRdMeClRyhYqT1A\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 2533,
		"path": "../public/assets/properties.index-suuF4zId.js"
	},
	"/assets/qr-code-CDUxGJ91.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"28a-M6N7p63gAdrHCrgBxAsmKTaTkMU\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 650,
		"path": "../public/assets/qr-code-CDUxGJ91.js"
	},
	"/assets/react-dom-CNPo7PjZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"dff-CmRaKM99iZU4oG495SmAYJNv1Gg\"",
		"mtime": "2026-10-06T04:03:38.175Z",
		"size": 3583,
		"path": "../public/assets/react-dom-CNPo7PjZ.js"
	},
	"/assets/redirect-DmtLUW0N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"184-TRM49T5nvIhX8okm9YKQe/jdlzE\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 388,
		"path": "../public/assets/redirect-DmtLUW0N.js"
	},
	"/assets/request-tVTcAFnq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"28e6-/m8t6ivaHgcCAWFNIwOMUD9+M5c\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 10470,
		"path": "../public/assets/request-tVTcAFnq.js"
	},
	"/assets/role-guard-oV23rVeo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3f9-pvZBRQwyKsfdfqTxj+VN4YsgFOk\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 1017,
		"path": "../public/assets/role-guard-oV23rVeo.js"
	},
	"/assets/routes-B5jlA3bt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a46-GrC8cu0Pu2d+0Kvb4ObKpm+B6RI\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 2630,
		"path": "../public/assets/routes-B5jlA3bt.js"
	},
	"/assets/search-D5tBalO4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15a8-ihDEvqyR4AZXQUBq6n9Zxj9vRRI\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 5544,
		"path": "../public/assets/search-D5tBalO4.js"
	},
	"/assets/send-ClGHcKrI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"122-qXqIrKpj+1QwHamEKH4sWzjoJ1Q\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 290,
		"path": "../public/assets/send-ClGHcKrI.js"
	},
	"/assets/share-2-BMsCQ9he.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"165-XJssZO7MhIJrvMfa6yEX0ffYq+0\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 357,
		"path": "../public/assets/share-2-BMsCQ9he.js"
	},
	"/assets/shield-check-Djau1VnD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"140-AoaXkIrPc8ORal+M3kI9C2IShnE\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 320,
		"path": "../public/assets/shield-check-Djau1VnD.js"
	},
	"/assets/sparkles-gf6_8K8H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ee-CEZZowafA6Y7CkmsUIg/NekhFjQ\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 494,
		"path": "../public/assets/sparkles-gf6_8K8H.js"
	},
	"/assets/star-Dn6juDLI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1d8-9Eh+CKB0ulOcVutZtc7pUkrWjS0\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 472,
		"path": "../public/assets/star-Dn6juDLI.js"
	},
	"/assets/styles-BaoYnZVB.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1538a-BdgHr9smegWmdmQhcbkoDP9N15k\"",
		"mtime": "2026-10-06T04:03:38.177Z",
		"size": 86922,
		"path": "../public/assets/styles-BaoYnZVB.css"
	},
	"/assets/trash-2-DHNL_4c4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"148-ZokdMc5IFGsuVi7BR1Z1CFAK97o\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 328,
		"path": "../public/assets/trash-2-DHNL_4c4.js"
	},
	"/assets/useMatch-1CvS7K1M.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"268-kyM55MwR2qtH6PP+opwk0ChdAZA\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 616,
		"path": "../public/assets/useMatch-1CvS7K1M.js"
	},
	"/assets/useMutation-sfp96z4U.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"996-8AZNqbfkcWLipFcfhe+siM1b/WQ\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 2454,
		"path": "../public/assets/useMutation-sfp96z4U.js"
	},
	"/assets/useNavigate-BR9bgUfC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e4-qHJcjOh0ldDYqqaIRRovZc6Fp+o\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 228,
		"path": "../public/assets/useNavigate-BR9bgUfC.js"
	},
	"/assets/useParams-BX2Ea7WR.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"102-Zidqve+ut0T/z2xMFghtpeOMq1o\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 258,
		"path": "../public/assets/useParams-BX2Ea7WR.js"
	},
	"/assets/useRouter-C8taXhX3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1dbf-z6zxHORenoQ00+HHb9gsGLrxg3I\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 7615,
		"path": "../public/assets/useRouter-C8taXhX3.js"
	},
	"/assets/user-BFT04SdI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c4-fNWGZYSLW9oZ1kt5I5oIHmtUw7c\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 196,
		"path": "../public/assets/user-BFT04SdI.js"
	},
	"/assets/user-round-x-D6hjYWc7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"109-b263bxXmkuxUvDFSmSXRaITeh9w\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 265,
		"path": "../public/assets/user-round-x-D6hjYWc7.js"
	},
	"/assets/users-C819VsA9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1d2-mXj3OckNSHHqOMDLHP+rsZEHpUc\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 466,
		"path": "../public/assets/users-C819VsA9.js"
	},
	"/assets/utils-BtRqtsxU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6a76-JkKQpQvQjju9Gum3ePYtjWZ23Rg\"",
		"mtime": "2026-10-06T04:03:38.176Z",
		"size": 27254,
		"path": "../public/assets/utils-BtRqtsxU.js"
	},
	"/assets/x-DCxPHqh1.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9a-GMAQ9x0mcZtCQfea2L1Fyw+FCqM\"",
		"mtime": "2026-10-06T04:03:38.177Z",
		"size": 154,
		"path": "../public/assets/x-DCxPHqh1.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_JvAk8s = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_JvAk8s
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
