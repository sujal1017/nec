import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { persistAuth } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export const useKeycloakAuth = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const startLogin = useCallback(() => {
    window.location.assign(`${api.defaults.baseURL}/customer/keycloak/login/`);
  }, []);

  const completeLogin = useCallback(
    async (params = new URLSearchParams(window.location.search)) => {
      const code = params.get("code");
      if (!code) return null;

      const response = await api.post("/customer/keycloak/callback/", {
        code,
        redirectUri: window.location.origin + window.location.pathname,
      });

      const data = response.data;
      const authData = {
        token: data.token || data.access,
        refreshToken: data.refreshToken || data.refresh || "",
        userType: data.userType || "personal",
        user: data.user || {},
      };

      persistAuth(authData, true);
      setAuth(authData);
      navigate("/", {
        replace: true,
      });
      return authData;
    },
    [navigate, setAuth]
  );

  return { startLogin, completeLogin };
};
