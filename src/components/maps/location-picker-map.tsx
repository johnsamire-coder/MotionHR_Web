"use client";

import { useEffect, useRef, useState } from "react";

interface LocationPickerMapProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  lang?: string;
}

export default function LocationPickerMap({
  lat,
  lng,
  radius,
  onChange,
  height = "400px",
  lang = "ar",
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);

  const defaultLat = lat || 30.0444;
  const defaultLng = lng || 31.2357;
  const ar = lang === "ar";

  const updatePosition = (newLat: number, newLng: number) => {
    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
    if (circleRef.current) circleRef.current.setLatLng([newLat, newLng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([newLat, newLng], 16);
    onChange(newLat, newLng);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert(ar ? "المتصفح لا يدعم تحديد الموقع" : "Browser doesn't support geolocation");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert(
          ar
            ? "فشل تحديد الموقع. تأكد من تفعيل الـ GPS والسماح للمتصفح"
            : "Failed to get location. Enable GPS and allow browser access"
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 15);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([defaultLat, defaultLng], {
        radius: radius || 100,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

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

  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radius || 100);
  }, [radius]);

  useEffect(() => {
    if (!lat || !lng) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 15);
  }, [lat, lng]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{ height, width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
        className="border border-border overflow-hidden"
      />
      {/* My Location Button */}
      <button
        type="button"
        onClick={handleMyLocation}
        disabled={locating}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "12px",
          zIndex: 1000,
          width: "44px",
          height: "44px",
          borderRadius: "8px",
          border: "2px solid rgba(0,0,0,0.15)",
          backgroundColor: "white",
          cursor: locating ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          transition: "all 0.2s",
        }}
        title={ar ? "موقعي الحالي" : "My current location"}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "#f0f7ff";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.backgroundColor = "white";
        }}
      >
        {locating ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="3" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="#4285F4" />
            <circle cx="12" cy="12" r="7" stroke="#4285F4" strokeWidth="2" fill="none" />
            <line x1="12" y1="1" x2="12" y2="5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="1" y1="12" x2="5" y2="12" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="12" x2="23" y2="12" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
