import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../features/auth/authSlice"; 
import { store } from "../../app/store";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const email = params.get("email");
      const error = params.get("error");

      if (error) {
        toast.error(`Google authentication failed: ${error}`);
        navigate("/login");
        return;
      }

      if (token && email) {
        try {
         
          
          dispatch(
            setCredentials({
              user: { email },
              accessToken: token,
            })
          );

          console.log("Token stored in Redux:", store.getState().auth.accessToken);
          console.log("Token stored in localStorage:", localStorage.getItem("accessToken"));

          toast.success("Login successful via Google!");
          navigate("/book-free-trial");
        } catch (error) {
          toast.error("Failed to set user credentials");
          navigate("/login");
        }
      } else {
        toast.error("Google authentication failed - no token received");
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, dispatch, location]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Processing Google login...</p>
        <div className="mt-4">Please wait</div>
      </div>
    </div>
  );
}