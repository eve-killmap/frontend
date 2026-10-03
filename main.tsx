import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  useParams,
} from "react-router-dom";
import RootLayout from "@/layout";
import LoadingPage from "@/components/loading";
import { ErrorPage } from "@/components/error-page";
import { startHealthCheck } from "@/lib/api/health";
import { gateApiCalls } from "@/lib/api/client";
import "@/globals.css";

const MapLoader = lazy(() =>
  import("@/components/map/map-loader").then((m) => ({ default: m.MapLoader })),
);
const SystemPageClient = lazy(() =>
  import("@/components/system/system-page-client").then((m) => ({
    default: m.SystemPageClient,
  })),
);
const InfoPage = lazy(() => import("@/components/info/info-page"));

function SystemPage() {
  const { system } = useParams<{ system: string }>();
  return <SystemPageClient key={system} slug={system!} />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingPage />}>
            <MapLoader key="new-eden" mapType="new-eden" />
          </Suspense>
        ),
      },
      {
        path: "anoikis",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <MapLoader key="anoikis" mapType="anoikis" />
          </Suspense>
        ),
      },
      {
        path: "abyssal-deadspace",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <MapLoader key="abyssal-deadspace" mapType="abyssal-deadspace" />
          </Suspense>
        ),
      },
      {
        path: "tutorials",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <MapLoader key="tutorials" mapType="tutorials" />
          </Suspense>
        ),
      },
      {
        path: "about",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <InfoPage />
          </Suspense>
        ),
      },
      {
        path: ":system",
        element: (
          <Suspense fallback={<LoadingPage />}>
            <SystemPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

gateApiCalls(startHealthCheck());

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
