"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface LocationMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  lastSeen?: string;
  address?: string;
  color?: string;
}

interface LiveMapProps {
  markers: LocationMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedId?: number | null;
}

export default function LiveMap({
  markers,
  center = [30.0444, 31.2357],
  zoom = 6,
  height = "600px",
  selectedId,
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import("leaflet").then(L => {
      if (!mapContainerRef.current) return;

      // Fix marker icons
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import("leaflet").then(L => {
      if (!markersLayerRef.current) return;
      markersLayerRef.current.clearLayers();

      markers.forEach(marker => {
        const m = L.marker([marker.lat, marker.lng]).bindPopup(`<div style="font-size:13px;min-width:200px">
            <strong>${marker.name}</strong>
            ${marker.department ? `<br/><span style="color:#555">🏢 ${marker.department}</span>` : ""}
            ${marker.address ? `<br/><span style="color:#333">📍 ${marker.address}</span>` : ""}
            ${marker.lastSeen ? `<br/><small style="color:#666">🕐 ${marker.lastSeen}</small>` : ""}
          </div>`);
        markersLayerRef.current!.addLayer(m);
      });
    });
  }, [markers]);

  // Center on selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedId) {
      const found = markers.find(m => m.id === selectedId);
      if (found) {
        mapInstanceRef.current.setView([found.lat, found.lng], 14);
      }
    }
  }, [selectedId, markers]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        height,
        width: "100%",
        borderRadius: "12px",
        zIndex: 1,
      }}
    />
  );
}
