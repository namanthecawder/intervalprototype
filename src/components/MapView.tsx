import { useEffect, useRef } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Cinema } from "@/data/venues";
import type { Plan } from "@/lib/planner";

const FORK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M7 2v8M4 2v5a3 3 0 0 0 6 0V2M7 10v12M17 2c-2 1.5-3 4-3 7h3v13"/></svg>';
const TICKET =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 6l2-3M14 6l2-3"/></svg>';

/**
 * The selected plan on a map: restaurant (amber), cinema (indigo), the walk between
 * them, and every other cinema in the area as a faint dot. Leaflet is loaded on the
 * client only, so the page still server-renders.
 */
export function MapView({
  plan,
  cinemas,
  center,
  className = "",
}: {
  plan: Plan | null;
  cinemas: Cinema[];
  center: { lat: number; lng: number };
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const lib = useRef<typeof L | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  // create once
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      const Lf = (mod.default ?? mod) as typeof L;
      if (cancelled || !el.current || map.current) return;
      lib.current = Lf;
      map.current = Lf.map(el.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([center.lat, center.lng], 12);
      Lf.control.zoom({ position: "bottomright" }).addTo(map.current);
      Lf.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map.current);
      layer.current = Lf.layerGroup().addTo(map.current);
      draw();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw on data change
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, cinemas, center.lat, center.lng]);

  function draw() {
    const Lf = lib.current;
    const m = map.current;
    const g = layer.current;
    if (!Lf || !m || !g) return;
    g.clearLayers();

    for (const c of cinemas) {
      if (plan && c.name === plan.cinema.name) continue;
      Lf.marker([c.lat, c.lng], {
        icon: Lf.divIcon({ className: "", html: '<div class="pin-dot"></div>', iconSize: [9, 9] }),
        keyboard: false,
        interactive: false,
      }).addTo(g);
    }

    if (!plan) {
      const pts = cinemas.map((c) => [c.lat, c.lng] as [number, number]);
      if (pts.length > 1) m.fitBounds(Lf.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
      else m.setView([center.lat, center.lng], 12);
      return;
    }

    const r: [number, number] = [plan.restaurant.lat, plan.restaurant.lng];
    const c: [number, number] = [plan.cinema.lat, plan.cinema.lng];
    Lf.polyline([r, c], { color: "#1f1f24", weight: 2.5, opacity: 0.55, dashArray: "2 7", lineCap: "round" }).addTo(g);
    // Same building (e.g. a mall): nudge the pins apart so both stay visible.
    const together = plan.distanceKm < 0.08;
    const pin = (cls: string, svg: string, dx: number) =>
      Lf.divIcon({ className: "", html: `<div class="pin ${cls}">${svg}</div>`, iconSize: [30, 30], iconAnchor: [15 + dx, 15] });
    Lf.marker(r, { icon: pin("pin-dinner", FORK, together ? 17 : 0), title: plan.restaurant.name, zIndexOffset: 500 }).addTo(g);
    Lf.marker(c, { icon: pin("pin-film", TICKET, together ? -17 : 0), title: plan.cinema.name, zIndexOffset: 600 }).addTo(g);
    m.flyToBounds(Lf.latLngBounds([r, c]), { padding: [80, 80], maxZoom: together ? 15 : 16, duration: 0.6 });
  }

  return <div ref={el} className={`isolate ${className}`} aria-label="Map of the plan" role="region" />;
}
