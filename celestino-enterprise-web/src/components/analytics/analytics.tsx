"use client";

import { useEffect } from "react";
import Script from "next/script";
import { Analytics as VercelAnalytics, track as vercelTrack } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { track } from "@/lib/analytics/events";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Delegated click tracking: any element with `data-event` emits that event with
 * the element's href/label (never form values). GA4 loads only when NEXT_PUBLIC_GA_ID
 * is set; Vercel Analytics is cookieless.
 */
export function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-event]");
      if (!el) return;
      const name = el.dataset.event;
      if (!name) return;
      const href = el.getAttribute("href") ?? undefined;
      const label = (el.textContent ?? "").trim().slice(0, 60);
      track(name, { href, label, page: window.location.pathname });
    };
    const onTrack = (e: Event) => {
      const { name, params } = (e as CustomEvent).detail ?? {};
      if (name) vercelTrack(name, params);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("celestino:track", onTrack);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("celestino:track", onTrack);
    };
  }, []);

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
      {GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
