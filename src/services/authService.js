import api from "./api";

const AUTH_STORAGE_KEY = "auth";

const normalizeUserType = (value) => {
  const type = String(value || "").toLowerCase();
  if (["business", "seller"].includes(type)) return "business";
  return "personal";
};

const buildUser = (data, fallbackEmail = "") => {
  const user = data.user || data.profile || data.customer || {};
  return {
    username: user.username || data.username || fallbackEmail,
    email: user.email || data.email || fallbackEmail,
    firstName: user.firstName || user.first_name || data.firstName || "",
    lastName: user.lastName || user.last_name || data.lastName || "",
    name:
      user.name ||
      data.name ||
      [user.firstName || user.first_name, user.lastName || user.last_name]
        .filter(Boolean)
        .join(" "),
    avatar: user.avatar || data.avatar || "",
    businessName: user.businessName || user.business_name || data.businessName || "",
  };
};

export const persistAuth = (authData, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;

  storage.setItem("token", authData.token);
  if (authData.refreshToken) {
    storage.setItem("refresh_token", authData.refreshToken);
  }
  storage.setItem("userType", authData.userType);
  storage.setItem("user", JSON.stringify(authData.user));
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

  const otherStorage = remember ? sessionStorage : localStorage;
  otherStorage.removeItem("token");
  otherStorage.removeItem("refresh_token");
  otherStorage.removeItem("userType");
  otherStorage.removeItem("user");
  otherStorage.removeItem(AUTH_STORAGE_KEY);
};

export const readStoredAuth = () => {
  const raw =
    localStorage.getItem(AUTH_STORAGE_KEY) ||
    sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return null;

  const userType =
    localStorage.getItem("userType") ||
    sessionStorage.getItem("userType") ||
    "personal";
  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");

  return {
    token,
    refreshToken:
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token") ||
      "",
    userType,
    user: userRaw ? JSON.parse(userRaw) : {},
  };
};

export const clearStoredAuth = () => {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem("token");
    storage.removeItem("refresh_token");
    storage.removeItem("userType");
    storage.removeItem("user");
    storage.removeItem(AUTH_STORAGE_KEY);
  });
};

export const login = async ({ email, password, rememberMe }) => {
  const response = await api.post("/customer/login/", {
    username: email,
    password,
  });

  const data = response.data || {};
  const authData = {
    token: data.token || data.access,
    refreshToken: data.refreshToken || data.refresh || "",
    userType: normalizeUserType(data.userType || data.accountType),
    user: buildUser(data, email),
  };

  persistAuth(authData, rememberMe);
  return authData;
};

export const register = async (payload) => {
  const response = await api.post("/customer/register/", payload);
  return response.data;
};

export const fetchProfile = async () => {
  const response = await api.get("/customer/profile/");
  return response.data;
};

export const googleLogin = async ({ accessToken, accountType = "personal" }) => {
  const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res.json());

  const response = await api.post("/customer/google-login/", {
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    googleId: userInfo.sub,
    accountType,
  });

  const data = response.data || {};
  const authData = {
    token: data.token || data.access,
    refreshToken: data.refreshToken || data.refresh || "",
    userType: normalizeUserType(data.userType || accountType),
    user: buildUser(data, userInfo.email),
  };

  persistAuth(authData, true);
  return authData;
};
