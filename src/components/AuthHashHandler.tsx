import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PASSWORD_RESET_PATH = "/passwort-zuruecksetzen";

const AuthHashHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const rawHash = window.location.hash;
    if (!rawHash) return;

    const hashParams = new URLSearchParams(rawHash.startsWith("#") ? rawHash.slice(1) : rawHash);
    const hasRecoveryToken = hashParams.has("access_token") && hashParams.get("type") === "recovery";
    const hasExpiredRecoveryError =
      hashParams.get("error") === "access_denied" && hashParams.get("error_code") === "otp_expired";

    if ((hasRecoveryToken || hasExpiredRecoveryError) && location.pathname !== PASSWORD_RESET_PATH) {
      navigate(
        {
          pathname: PASSWORD_RESET_PATH,
          hash: rawHash,
        },
        { replace: true }
      );
    }
  }, [location.pathname, navigate]);

  return null;
};

export default AuthHashHandler;
