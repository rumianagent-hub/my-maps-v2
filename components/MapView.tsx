"use client";

import { useEffect, useRef, useState } from "react";
import type { PostWithAuthor } from "@/lib/types";
import { useMapsLoaded } from "./GoogleMapsLoader";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0c0c14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c0c14" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#555566" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a24" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111119" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050508" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a1a24" }] },
];

function createPhotoOverlay(map: any, post: PostWithAuthor, onClick: () => void): any {
  if (typeof google === "undefined" || !google.maps) return null;

  const overlay = new google.maps.OverlayView();
  const position = new google.maps.LatLng(post.lat, post.lng);
  let div: HTMLDivElement | null = null;

  overlay.onAdd = function () {
    div = document.createElement("div");
    div.style.cssText = "position:absolute;cursor:pointer;transition:transform 0.2s ease;z-index:1;";
    div.onmouseenter = () => { if (div) { div.style.transform = "scale(1.15) translateY(-4px)"; div.style.zIndex = "10"; } };
    div.onmouseleave = () => { if (div) { div.style.transform = "scale(1)"; div.style.zIndex = "1"; } };
    div.onclick = (e) => { e.stopPropagation(); onClick(); };

    const hasPhoto = post.photo_urls && post.photo_urls.length > 0;
    div.innerHTML = hasPhoto
      ? `<div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.6));"><div style="width:50px;height:50px;border-radius:10px;overflow:hidden;border:3px solid #6366f1;"><img src="${post.photo_urls[0]}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" /></div><div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #6366f1;margin:-1px auto 0;"></div></div>`
      : `<div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.6));"><div style="width:50px;height:50px;border-radius:10px;background:#111119;border:3px solid #6366f1;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #6366f1;margin:-1px auto 0;"></div></div>`;

    const panes = this.getPanes();
    if (panes) panes.overlayMouseTarget.appendChild(div);
  };

  overlay.draw = function () {
    if (!div) return;
    const proj = this.getProjection();
    if (!proj) return;
    const pos = proj.fromLatLngToDivPixel(position);
    if (pos) { div.style.left = (pos.x - 25) + "px"; div.style.top = (pos.y - 58) + "px"; }
  };

  overlay.onRemove = function () { if (div && div.parentNode) div.parentNode.removeChild(div); div = null; };
  overlay.setMap(map);
  return overlay;
}

export default function MapView({ posts }: { posts: PostWithAuthor[] }) {
  const mapsLoaded = useMapsLoaded();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const overlaysRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || typeof google === "undefined") return;
    try {
      const m = new google.maps.Map(mapRef.current, {
        center: { lat: 40, lng: -95 },
        zoom: 3,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        styles: darkMapStyle,
        backgroundColor: "#0c0c14",
      });
      setMap(m);
    } catch (err) {
      console.error("Failed to init map:", err);
    }
  }, [mapsLoaded]);

  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    // Clean up old overlays
    overlaysRef.current.forEach((o) => { try { o.setMap(null); } catch {} });
    overlaysRef.current = [];
    if (!posts || posts.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let activeIW: google.maps.InfoWindow | null = null;
    const clickListener = map.addListener("click", () => { if (activeIW) activeIW.close(); });

    posts.forEach((post) => {
      if (!post.lat || !post.lng) return;
      const overlay = createPhotoOverlay(map, post, () => {
        if (activeIW) activeIW.close();
        const card = document.createElement("div");
        card.style.cssText = "font-family:Inter,system-ui,sans-serif;width:240px;background:#111119;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);cursor:pointer;";
        const photoHtml = post.photo_urls && post.photo_urls[0] ? `<img src="${post.photo_urls[0]}" style="width:100%;height:120px;object-fit:cover;" />` : "";
        card.innerHTML = `${photoHtml}<div style="padding:10px 12px;"><div style="font-weight:600;font-size:14px;color:#f5f5f7;">${post.place_name}</div><div style="font-size:11px;color:#666;margin-top:2px;">${post.city || post.place_address}</div></div>`;
        card.onclick = () => { window.location.href = `/post?id=${post.id}`; };
        const iw = new google.maps.InfoWindow({ content: card, position: new google.maps.LatLng(post.lat, post.lng), pixelOffset: new google.maps.Size(0, -62) });
        activeIW = iw;
        iw.open(map);
      });
      if (overlay) overlaysRef.current.push(overlay);
      bounds.extend({ lat: post.lat, lng: post.lng });
    });

    const validPosts = posts.filter((p) => p.lat && p.lng);
    if (validPosts.length > 1) {
      map.fitBounds(bounds, 50);
    } else if (validPosts.length === 1) {
      map.setCenter({ lat: validPosts[0].lat, lng: validPosts[0].lng });
      map.setZoom(14);
    }

    return () => { try { google.maps.event.removeListener(clickListener); } catch {} };
  }, [map, posts]);

  if (!mapsLoaded) return (
    <div className="w-full h-full rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-zinc-500">
      <div className="text-center"><div className="text-3xl mb-2">🗺️</div><p className="text-sm">Loading map...</p></div>
    </div>
  );

  return <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />;
}
