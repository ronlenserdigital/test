import { useEffect, useState } from "react";
import { initServices } from "./state/services";
import { hashToRoute, savePrefs, useApp } from "./state/store";
import { mergePrefs } from "./state/prefs";
import { restoreTimer } from "./state/focus";
import { Shell } from "./ui/Shell";
import { Loading } from "./ui/components";
import { Logo } from "./ui/icons";

export function App() {
  const services = useApp((s) => s.services);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const svc = await initServices();
        if (cancelled) return;
        const prefs = mergePrefs(await svc.repo.getSetting("prefs", null));
        // Validate the remembered certification still exists.
        const certs = await svc.repo.listCertifications();
        if (prefs.currentCertId && !certs.some((c) => c.id === prefs.currentCertId)) prefs.currentCertId = certs[0]?.id ?? null;
        if (!prefs.currentCertId && certs.length) prefs.currentCertId = certs[0].id;
        const st = useApp.getState();
        st.setServices(svc);
        await savePrefs(prefs);
        const route = hashToRoute(location.hash);
        st.setTimer(null);
        useApp.setState({ route: !prefs.onboarded && certs.length === 0 ? { view: "onboarding" } : route });
        await restoreTimer();
      } catch (e) {
        setError((e as Error).message || String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onPop = () => useApp.setState({ route: hashToRoute(location.hash) });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (error) {
    return (
      <div className="onboarding" role="alert">
        <h1>StudyMode could not start</h1>
        <p>{error}</p>
        <p className="muted">Your data has not been changed. If this keeps happening, restart the app. If you recently installed an older version, reinstall the latest one.</p>
      </div>
    );
  }
  if (!services) {
    return (
      <div className="onboarding" style={{ textAlign: "center" }}>
        <div style={{ width: 56, margin: "0 auto 16px" }}>
          <Logo />
        </div>
        <Loading label="Opening your study workspace…" />
      </div>
    );
  }
  return <Shell />;
}
