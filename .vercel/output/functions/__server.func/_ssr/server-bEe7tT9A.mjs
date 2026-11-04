import { r as __exportAll$1 } from "../_runtime.mjs";
import { n as setCookie, r as toResponse, t as H3Event } from "../_libs/h3-v2+rou3.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
//#region node_modules/.nitro/vite/services/ssr/assets/server-bEe7tT9A.js
var server_bEe7tT9A_exports = /* @__PURE__ */ __exportAll$1({
	a: () => __exportAll,
	i: () => requestHandler,
	n: () => getRequest,
	r: () => getResponse,
	t: () => server_exports
});
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj = globalThis;
if (!globalObj[GLOBAL_EVENT_STORAGE_KEY]) globalObj[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return (typeof value === "object" || typeof value === "function") && value !== null && typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function finalizeResponse(value, event) {
	const response = ensureResponse(value);
	mergeEventResponseHeaders(response, event);
	return response;
}
function finalizeMaybeResponse(value, event) {
	if (isPromiseLike(value)) return Promise.resolve(value).then((resolved) => finalizeResponse(resolved, event), (error) => finalizeResponse(handleResponseError(error), event));
	return finalizeResponse(value, event);
}
function ensureResponse(value) {
	if (value instanceof Response) return value;
	return new Response("Internal Server Error", { status: 500 });
}
function handleResponseError(error) {
	if (error instanceof Response) return error;
	if (error instanceof Error) throw error;
	return new Response("Internal Server Error", { status: 500 });
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		let response;
		try {
			response = eventStorage.run({ h3Event }, () => handler(request, requestOpts));
		} catch (error) {
			response = handleResponseError(error);
		}
		return toResponse(finalizeMaybeResponse(response, h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
function getRequest() {
	return getH3Event().req;
}
/**
* Set a cookie value by name.
* @param name Name of the cookie to set
* @param value Value of the cookie to set
* @param options {CookieSerializeOptions} Options for serializing the cookie
* ```ts
* setCookie('Authorization', '1234567')
* ```
*/
function setCookie$1(name, value, options) {
	setCookie(getH3Event(), name, value, options);
}
function getResponse() {
	return getH3Event().res;
}
var server_exports = /* @__PURE__ */ __exportAll({ setCookie: () => setCookie$1 });
//#endregion
export { server_bEe7tT9A_exports as a, requestHandler as i, getRequest as n, getResponse as r, __exportAll as t };
