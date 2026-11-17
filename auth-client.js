import { authConfig } from "./auth-config.js";
let clientPromise;
export function getClient() {
  if (!authConfig.supabaseUrl || !authConfig.supabasePublishableKey)
    return Promise.resolve(null);
  if (!clientPromise)
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2.49.8").then(
      ({ createClient }) =>
        createClient(authConfig.supabaseUrl, authConfig.supabasePublishableKey),
    );
  return clientPromise;
}
export function localUrl(path) {
  return new URL(path, window.location.href).href;
}
