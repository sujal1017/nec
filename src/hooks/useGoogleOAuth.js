import { useCallback } from "react";

export const useGoogleOAuth = ({ onSuccess, onError }) => {
  return useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      onError?.("Google OAuth script is not available.");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: (response) => {
        if (response?.error) {
          onError?.(response.error);
          return;
        }
        onSuccess?.(response);
      },
    });

    client.requestAccessToken();
  }, [onError, onSuccess]);
};
