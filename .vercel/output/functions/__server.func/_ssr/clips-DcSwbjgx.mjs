import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Authed } from "./chrome-B4BW7vq9.mjs";
import { r as ClipsAdminPage } from "./admin-pages-CYdod0v9.mjs";
import { n as Route } from "./router-vNtMSDRN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clips-DcSwbjgx.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = function AdminClipsRoute() {
	const { q } = Route.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Authed, {
		role: "admin",
		children: (profile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipsAdminPage, {
			profile,
			initialQuery: q
		})
	});
};
//#endregion
export { SplitComponent as component };
