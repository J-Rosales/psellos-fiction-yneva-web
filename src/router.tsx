import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useParams,
} from '@tanstack/react-router';
import { AppShell, SimpleView } from './App';

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
  component: () => (
    <SimpleView
      title="Entities"
      description="Entity index surface placeholder. MUI X DataGrid integration is planned for Milestone 3."
      routeId="/entities"
    />
  ),
});

const entityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/entity/$entityId',
  component: () => {
    const { entityId } = useParams({ from: '/entity/$entityId' });
    return (
      <SimpleView
        title={`Entity ${entityId}`}
        description="Entity detail route and URL state are wired."
        routeId={`/entity/${entityId}`}
      />
    );
  },
});

const graphRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/graph',
  component: () => (
    <SimpleView
      title="Graph"
      description="Graph route shell is active. Cytoscape integration lands in Milestone 4."
      routeId="/graph"
    />
  ),
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: () => (
    <SimpleView
      title="Map"
      description="Map route shell is active. MapLibre place-first UI lands in Milestone 5."
      routeId="/map"
    />
  ),
});

const layersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/layers',
  component: () => (
    <SimpleView
      title="Layers"
      description="Narrative layer controls route shell is active."
      routeId="/layers"
    />
  ),
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: () => (
    <SimpleView
      title="Search"
      description="Global search route shell is active with URL-synchronized filters."
      routeId="/search"
    />
  ),
});

const diagnosticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/diagnostics',
  component: () => (
    <SimpleView
      title="Diagnostics"
      description="Diagnostics route shell is active (secondary/admin surface)."
      routeId="/diagnostics"
    />
  ),
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
