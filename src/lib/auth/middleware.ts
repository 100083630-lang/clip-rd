import { createMiddleware } from "@tanstack/react-start";

/**
 * No hay inicio de sesión. Cada función del servidor usa el administrador
 * abierto de CLIPRD, con un user id real, para que el perfil nunca se inserte
 * con user_id vacío.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { assertSameSiteRequest } = await import("./isolation.server");
  const { ensureOpenAdminId } = await import("@/server/domain.server");
  assertSameSiteRequest();
  const userId = await ensureOpenAdminId();
  return next({ context: { userId } });
});
