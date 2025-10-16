// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { useDispatch } from "react-redux";
// import { setCredentials } from "../../features/auth/authSlice"; 

// export default function GoogleCallback() {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Add this to your GoogleCallback component
// useEffect(() => {
//   const handleAuth = async () => {
//     try {
//       // ... your existing auth logic
//     } catch (error) {
//       console.error("Authentication error:", error);
//       toast.error("Authentication process failed");
//       navigate("/login");
//     }
//   };

//   handleAuth();
// }, [navigate, dispatch, location]);

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get("token");
//     const email = params.get("email");
//     const error = params.get("error");

//     if (error) {
//       toast.error(`Google authentication failed: ${error}`);
//       navigate("/login");
//       return;
//     }

//     if (token && email) {
//       localStorage.setItem("accessToken", token);
      
//       dispatch(
//         setCredentials({
//           user: { email },
//           accessToken: token,
//         })
//       );

//       toast.success("Login successful via Google!");
//       navigate("/dashboard");
//     } else {
//       toast.error("Google authentication failed - no token received");
//       navigate("/login");
//     }
//   }, [navigate, dispatch]);

//   return <div className="flex justify-center items-center min-h-screen">
//     <div className="text-center">
//       <p className="text-lg">Processing Google login...</p>
//       <div className="mt-4">Loading...</div>
//     </div>
//   </div>;
// }

// 

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
          navigate("/dashboard");
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