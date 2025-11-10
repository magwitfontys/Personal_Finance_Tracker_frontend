// Force the (interface) group to render only on the client.
// This prevents server-side "not logged in" redirects from firing.
export const ssr = false;
export const prerender = false;
