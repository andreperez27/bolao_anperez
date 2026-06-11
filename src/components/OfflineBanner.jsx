import React from "react";

export function OfflineBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner">
      Você está offline. Alguns dados podem não estar disponíveis.
    </div>
  );
}
