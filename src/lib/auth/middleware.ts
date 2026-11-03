import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  // Login desactivado - entra directo
  return next();
});

// Funciones falsas para que no de error
export const getSession = async () => null;
export const requireAuth = async () => true;
