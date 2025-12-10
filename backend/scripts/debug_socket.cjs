
const io = require("socket.io-client");

const MENTOR_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlyZmFuYXJpeWFzbXVsbGFAZ21haWwuY29tIiwiaWQiOiI2OTA4NTRjMmZlMmQ2MjIyNjRjNjQ5M2MiLCJyb2xlIjoibWVudG9yIiwiaWF0IjoxNzY0ODI1NjczLCJleHAiOjE3NjU0MzA0NzN9.WSM43BZ5RzYuUopFnm873R9-HcLdU7VAi21sooJnIsk";
const STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlyZmFuYS4xOG1AZ21haWwuY29tIiwiaWQiOiI2OTBmNGI2NTUzNzFmYTQ0Nzg5N2IyZWMiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc2NDg5ODg4MywiZXhwIjoxNzY0OTAyNDgzfQ.E9dQFp33pxSYt74wTgh7UQzVfvZR4sLmI16KggVpK18";

const TRIAL_CLASS_ID = "692e9c77b84497ba0dd48c22";
const MENTOR_ID = "690854c2fe2d622264c6493c";
const STUDENT_ID = "690f4b655371fa447897b2ec";

const BACKEND_URL = "http://localhost:5000";

function createClient(role, token, userId) {
  console.log(`[${role.toUpperCase()}] Connecting...`);
  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ["polling"],
    extraHeaders: {
      Origin: "http://localhost:5173"
    }
  });

  socket.on("connect", () => {
    console.log(`[${role.toUpperCase()}] Connected! Socket ID: ${socket.id}`);
    
    console.log(`[${role.toUpperCase()}] Joining call...`);
    socket.emit("join-call", {
      trialClassId: TRIAL_CLASS_ID,
      userId: userId,
      userType: role,
    });
  });

  socket.on("connect_error", (err) => {
    console.error(`[${role.toUpperCase()}] Connection Error:`, err.message);
    console.error(`[${role.toUpperCase()}] Error Details:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
  });

  socket.on("join-error", (data) => {
    console.error(`[${role.toUpperCase()}] Join Error:`, data);
  });

  socket.on("join-success", (data) => {
    console.log(`[${role.toUpperCase()}] Join Success:`, data);
  });

  socket.on("user-joined", (data) => {
    console.log(`[${role.toUpperCase()}] User Joined Event:`, data);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[${role.toUpperCase()}] Disconnected:`, reason);
  });

  return socket;
}

// Start Mentor
const mentorSocket = createClient("mentor", MENTOR_TOKEN, MENTOR_ID);

// Start Student after 2 seconds
setTimeout(() => {
  const studentSocket = createClient("student", STUDENT_TOKEN, STUDENT_ID);
}, 2000);

// Keep alive for 10 seconds then exit
setTimeout(() => {
  console.log("Exiting...");
  mentorSocket.disconnect();
  process.exit(0);
}, 10000);
