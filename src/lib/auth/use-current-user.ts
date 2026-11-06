/** User shape used across the app. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

/** `useCurrentUserState()` result. */
export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

/** Usuario fijo — BYPASS de autenticación. */
export const BYPASS_USER: AppUser = {
  id: "58c0b0aa-43f4-4630-a9da-7c67892caec7",
  displayName: "melo",
  primaryEmail: "elwick03@gmail.com",
  profileImageUrl: null,
  isDevFallback: false,
};

const BYPASS_STATE: CurrentUserState = { user: BYPASS_USER, isPending: false };

/** BYPASS: siempre devuelve el admin, sin mirar sesión. */
export function useCurrentUserState(): CurrentUserState {
  return BYPASS_STATE;
}

/** BYPASS: siempre devuelve el admin. */
export function useCurrentUser(): AppUser | null {
  return BYPASS_USER;
}
