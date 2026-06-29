/* eslint-disable */
import { Route as rootRoute } from "./routes/__root";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      parentRoute: typeof rootRoute;
    };
  }
}

export const routeTree = rootRoute;
