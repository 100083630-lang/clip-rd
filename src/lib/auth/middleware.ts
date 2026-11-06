import { createMiddleware } from "@tanstack/react-start";

/**
 * BYPASS: autenticación deshabilitada.
 * Todo request se trata como el admin fijo configurado abajo.
 */
const BYPASS_ADMIN_ID = "58c0b0aa-43f4-4630-a9da-7c67892caec7";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { assertSameSiteRequest } = await import("./isolation.server");
  assertSameSiteRequest();
  return next({ context: { userId: BYPASS_ADMIN_ID } });
});
