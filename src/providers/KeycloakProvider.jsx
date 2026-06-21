/**
 * Keycloak Authentication Provider
 *
 * Provides Keycloak OIDC authentication for the React frontend.
 *
 * IMPORTANT:
 * This provider is infrastructure-only and currently UNUSED.
 * Existing auth system (AuthContext + SimpleJWT) continues as the active system.
 *
 * Activation steps when ready:
 *  1. Wrap the app with KeycloakProvider in App.jsx
 *  2. Replace useAuth() in AuthContext with useKeycloak() hooks
 *  3. Remove direct login/register page routes
 *  4. Update ProtectedRoute to use keycloak.authenticated
 *
 * Required environment variables (.env):
 *   VITE_KEYCLOAK_URL=http://localhost:8080
 *   VITE_KEYCLOAK_REALM=ecommerce
 *   VITE_KEYCLOAK_CLIENT_ID=ecommerce-frontend
 */

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";

const KeycloakContext = createContext(null);

export const KeycloakProvider = ({ children }) => {
  // Placeholder: not yet activated
  // When activated, this will:
  //  1. Initialize Keycloak JS adapter
  //  2. Handle login/logout/register
  //  3. Provide token and user info to the app
  //  4. Handle silent token refresh
  //  5. Manage session lifecycle

  const value = useMemo(
    () => ({
      initialized: false,
      authenticated: false,
      token: null,
      tokenParsed: null,
      user: null,
      userType: "personal",
      roles: [],
      login: () => {
        console.warn("Keycloak not yet activated. Using existing auth system.");
      },
      logout: () => {
        console.warn("Keycloak not yet activated. Using existing auth system.");
      },
      register: () => {
        console.warn("Keycloak not yet activated. Using existing auth system.");
      },
    }),
    []
  );

  return (
    <KeycloakContext.Provider value={value}>
      {children}
    </KeycloakContext.Provider>
  );
};

export const useKeycloak = () => {
  const ctx = useContext(KeycloakContext);
  if (!ctx) {
    throw new Error("useKeycloak must be used within KeycloakProvider");
  }
  return ctx;
};

/**
 * Activation template for when Keycloak is ready to be enabled:
 * 
 * import { useEffect, useState } from 'react';
 * import Keycloak from 'keycloak-js';
 * 
 * const KeycloakProvider = ({ children }) => {
 *   const [keycloak, setKeycloak] = useState(null);
 *   const [authenticated, setAuthenticated] = useState(false);
 *   const [initialized, setInitialized] = useState(false);
 * 
 *   useEffect(() => {
 *     const kc = new Keycloak({
 *       url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
 *       realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ecommerce',
 *       clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ecommerce-frontend',
 *     });
 * 
 *     kc.init({
 *       onLoad: 'check-sso',
 *       silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
 *       pkceMethod: 'S256',
 *       checkLoginIframe: true,
 *       flow: 'standard',
 *     }).then((auth) => {
 *       setKeycloak(kc);
 *       setAuthenticated(auth);
 *       setInitialized(true);
 * 
 *       // Auto-refresh token before expiry
 *       setInterval(() => {
 *         if (kc.authenticated) {
 *           kc.updateToken(60).catch(() => {
 *             console.warn('Token refresh failed, logging out');
 *             kc.logout();
 *           });
 *         }
 *       }, 30000);
 *     }).catch((err) => {
 *       console.error('Keycloak init failed:', err);
 *       setInitialized(true);
 *     });
 *   }, []);
 * 
 *   const value = useMemo(() => ({
 *     initialized,
 *     authenticated,
 *     token: keycloak?.token || null,
 *     tokenParsed: keycloak?.tokenParsed || null,
 *     user: keycloak?.tokenParsed || null,
 *     userType: keycloak?.tokenParsed?.realm_access?.roles?.includes('seller')
 *       ? 'business' : 'personal',
 *     roles: keycloak?.tokenParsed?.realm_access?.roles || [],
 *     login: () => keycloak?.login(),
 *     logout: () => keycloak?.logout({ redirectUri: window.location.origin }),
 *     register: () => keycloak?.login({ action: 'register' }),
 *   }), [initialized, authenticated, keycloak]);
 * 
 *   return (
 *     <KeycloakContext.Provider value={value}>
 *       {children}
 *     </KeycloakContext.Provider>
 *   );
 * };
 */
