import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/clipper/dashboard")({ component: () => <Navigate to="/dashboard" /> });
