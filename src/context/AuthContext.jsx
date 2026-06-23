import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearStoredAuth,
  fetchProfile,
  login as loginRequest,
  readStoredAuth,
} from "../services/authService";
import { addToCart } from "../services/commerceService";

const AuthContext = createContext(null);

const resolveUserType = (auth) => {
  const role =
    auth?.userType ||
    auth?.user?.accountType ||
    auth?.user?.account_type ||
    auth?.user?.role ||
    "personal";

  return ["business", "seller"].includes(String(role).toLowerCase())
    ? "business"
    : "personal";
};

const mapSnakeToCamel = (obj) => {
  if (!obj) return obj;
  const out = { ...obj };
  if ("is_verified" in out) out.isVerified = out.is_verified;
  if ("user_status" in out) out.userStatus = out.user_status;
  if ("email_verified" in out) out.emailVerified = out.email_verified;
  if ("account_type" in out) out.accountType = out.account_type;
  if ("business_name" in out) out.businessName = out.business_name;
  return out;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [profileLoading, setProfileLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    const authData = await loginRequest(credentials);
    setAuth(authData);

    try {
      const guestCart = JSON.parse(localStorage.getItem("guest_cart")) || [];
      if (guestCart.length > 0) {
        localStorage.setItem("token", authData.token);
        for (const item of guestCart) {
          await addToCart({
            productId: item.product_id,
            quantity: item.quantity,
            selectedOptions: item.selected_options || {},
            name: item.name,
            price: item.price,
            image: item.image,
            is_live: item.product_id >= 100000000
          });
        }
        localStorage.removeItem("guest_cart");
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Failed to merge guest cart during login:", err);
    }

    return authData;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth?.token) return;
    try {
      const data = await fetchProfile();
      const profile = data?.profileData?.profile || data?.profile || data?.user;
      if (profile) {
        setAuth((current) => {
          const merged = mapSnakeToCamel({ ...current?.user, ...profile });
          const next = {
            ...current,
            userType: resolveUserType({ ...current, user: merged }),
            user: merged,
          };
          localStorage.setItem("user", JSON.stringify(next.user || {}));
          localStorage.setItem("userType", next.userType || "");
          localStorage.setItem("auth", JSON.stringify(next));
          return next;
        });
      }
    } catch {
      // ignore
    }
  }, [auth?.token]);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
  }, []);

  const syncAuthToStorage = (next) => {
    if (!next) return;
    localStorage.setItem("user", JSON.stringify(next.user || {}));
    localStorage.setItem("userType", next.userType || "");
    localStorage.setItem("auth", JSON.stringify(next));
  };

  useEffect(() => {
    if (!auth?.token) return;

    let alive = true;
    setProfileLoading(true);

    fetchProfile()
      .then((data) => {
        if (!alive) return;
        const profile = data?.profileData?.profile || data?.profile || data?.user;
        if (profile) {
          setAuth((current) => {
            const merged = mapSnakeToCamel({ ...current?.user, ...profile });
            const next = {
              ...current,
              userType: resolveUserType({ ...current, user: merged }),
              user: merged,
            };
            syncAuthToStorage(next);
            return next;
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setProfileLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [auth?.token]);

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      token: auth?.token || "",
      user: auth?.user || null,
      userType: resolveUserType(auth),
      profileLoading,
      login,
      logout,
      setAuth,
      refreshProfile,
    }),
    [auth, login, logout, profileLoading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
};
