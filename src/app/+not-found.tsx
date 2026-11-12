import { Redirect } from 'expo-router';

// Unknown URLs (mostly web and deep links) fall back to the home tab instead of a blank screen.
export default function NotFound() {
  return <Redirect href="/" />;
}
