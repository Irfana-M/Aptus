import * as Sentry from "@sentry/react";
import { browserTracingIntegration, replayIntegration } from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import "./index.css";
import App from "./App.tsx";

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>}>
      <App />
      </Sentry.ErrorBoundary>
    </Provider>
  </StrictMode>
);
