import { useSelector } from "react-redux";
import { selectCurrentToken } from "./features/auth/authSlice"

export default function TestAuth() {
  const token = useSelector(selectCurrentToken);
  
  return (
    <div>
      <h3>Auth Debug Info:</h3>
      <p>Redux Token: {token ? "Present" : "Missing"}</p>
      <p>LocalStorage (generic): {localStorage.getItem("accessToken") ? "Present" : "Missing"}</p>
      <p>LocalStorage (student): {localStorage.getItem("student_accessToken") ? "Present" : "Missing"}</p>
      <p>LocalStorage (mentor): {localStorage.getItem("mentor_accessToken") ? "Present" : "Missing"}</p>
      <p>LocalStorage (admin): {localStorage.getItem("admin_accessToken") ? "Present" : "Missing"}</p>
      <p>Token Length: {token?.length}</p>
    </div>
  );
}
