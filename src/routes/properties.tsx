import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for /properties. The listing lives in properties.index.tsx and
// the detail page in properties.$id.tsx; this parent just renders whichever
// child matches. Without this Outlet, visiting /properties/:id would render the
// listing instead of the detail page.
export const Route = createFileRoute("/properties")({
  component: PropertiesLayout,
});

function PropertiesLayout() {
  return <Outlet />;
}
