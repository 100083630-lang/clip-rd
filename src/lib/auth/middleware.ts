import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Sesión propia de CLIPRD. El id sale de la cookie de Better Auth
 * (email + contraseña). Sin sesión, la función responde no autorizado.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { assertSameSiteRequest } = await import("./isolation.server");
  const { requireUserId } = await import("./verify.server");
  assertSameSiteRequest();
  const header = getRequest()?.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
  const userId = await requireUserId(bearer);
  return next({ context: { userId } });
});
