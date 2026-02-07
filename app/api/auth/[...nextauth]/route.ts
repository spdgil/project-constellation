/**
 * Auth.js catch-all API route.
 * Handles sign-in, sign-out, callback, and session endpoints.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
