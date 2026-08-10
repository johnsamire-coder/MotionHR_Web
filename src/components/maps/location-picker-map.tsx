"use client";

import { useEffect, useRef } from "react";

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export default function LocationPickerMap({
  lat,
  lng,
  radius,
  onChange,
  height = "400px",
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // Default: Cairo
  const defaultLat = lat || 30.0444;
  const defaultLng = lng || 31.2357;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Fix marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Init map
      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 15);
      mapInstanceRef.current = map;

      // Tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Circle
      const circle = L.circle([defaultLat, defaultLng], {
        radius: radius || 100,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      // Click on map
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      // Drag marker
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng([pos.lat, pos.lng]);
        onChange(pos.lat, pos.lng);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius when it changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius || 100);
    }
  }, [radius]);

  // Update marker + circle when lat/lng change externally
  useEffect(() => {
    if (!lat || !lng) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 15);
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
      className="border border-border overflow-hidden"
    />
  );
}
