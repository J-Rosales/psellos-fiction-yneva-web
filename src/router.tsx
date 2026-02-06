import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { AppShell, SimpleView } from './App';
import { DiagnosticsRouteView } from './views/diagnosticsRoute';
import { EntitiesRouteView } from './views/entitiesRoute';
import { EntityDetailRouteView } from './views/entityDetailRoute';
import { GraphRouteView } from './views/graphRoute';
import { LayersRouteView } from './views/layersRoute';
import { MapRouteView } from './views/mapRoute';
import { SearchRouteView } from './views/searchRoute';

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <SimpleView
      title="Overview"
      description="Portfolio-grade prosopographical explorer shell is active. Use route tabs to navigate planned surfaces."
      routeId="/"
    />
  ),
});

const entitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/entities',
  component: EntitiesRouteView,
});

const entityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/entity/$entityId',
  component: EntityDetailRouteView,
});

const graphRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/graph',
  component: GraphRouteView,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: MapRouteView,
});

const layersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/layers',
  component: LayersRouteView,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchRouteView,
});

const diagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/diagnostics',
  component: DiagnosticsRouteView,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  entitiesRoute,
  entityRoute,
  graphRoute,
  mapRoute,
  layersRoute,
  searchRoute,
  diagnosticsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
