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

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
  }, []);

  useEffect(() => {
    if (!auth?.token) return;

    let alive = true;
    setProfileLoading(true);

    fetchProfile()
      .then((data) => {
        if (!alive) return;
        const profile = data?.profileData?.profile || data?.profile || data?.user;
        if (profile) {
          setAuth((current) => ({
            ...current,
            userType: resolveUserType({ ...current, user: { ...current.user, ...profile } }),
            user: {
              ...current.user,
              ...profile,
            },
          }));
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
    }),
    [auth, login, logout, profileLoading]
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
