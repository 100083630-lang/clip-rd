import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Authed } from "./chrome-Dr56Rliw.mjs";
import { t as AdminHome } from "./admin-pages-C5TF8DLM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-DqGvCa0m.js
var import_jsx_runtime = require_jsx_runtime();
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Authed, {
	role: "admin",
	children: (profile) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminHome, { profile })
});
//#endregion
export { SplitComponent as component };
