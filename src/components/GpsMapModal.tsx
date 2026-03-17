"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/layout/Modal";
import { Button } from "@/components/ui";
import type L from "leaflet";

// ─── Types ──────────────────────────────────────────────────

interface GpsLocation {
  lat: number;
  lon: number;
  label: string;
  time: string | null;
}

interface OfficeGps {
  officeLatitude: number | null;
  officeLongitude: number | null;
  gpsRadius: number;
}

interface GpsMapModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  date: string;
  checkIn: GpsLocation | null;
  checkOut: GpsLocation | null;
  office: OfficeGps;
}

// ─── Utility ────────────────────────────────────────────────

/** Haversine distance in meters between two lat/lon points */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ─── Map Content (loaded dynamically) ───────────────────────

function MapContent({
  checkIn,
  checkOut,
  office,
}: {
  checkIn: GpsLocation | null;
  checkOut: GpsLocation | null;
  office: OfficeGps;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      // Dynamically import leaflet (SSR-safe)
      const leaflet = await import("leaflet");

      if (cancelled || !mapContainerRef.current) return;

      // Inject Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity =
          "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }

      // Fix default marker icons (webpack/next breaks the default paths)
      leaflet.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Collect valid coordinates to determine bounds
      const points: [number, number][] = [];

      if (checkIn) points.push([checkIn.lat, checkIn.lon]);
      if (checkOut) points.push([checkOut.lat, checkOut.lon]);
      if (office.officeLatitude != null && office.officeLongitude != null) {
        points.push([office.officeLatitude, office.officeLongitude]);
      }

      // Default center: Seoul City Hall if nothing available
      const defaultCenter: [number, number] = [37.5665, 126.978];
      const center = points.length > 0 ? points[0] : defaultCenter;

      // Create map
      const map = leaflet.map(mapContainerRef.current, {
        center,
        zoom: 15,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tile layer
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // ─── Custom icon factory ───
      function createIcon(color: string): L.DivIcon {
        return leaflet.divIcon({
          className: "custom-map-marker",
          html: `<div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          "></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });
      }

      // ─── Office marker + radius circle ───
      if (office.officeLatitude != null && office.officeLongitude != null) {
        const officeIcon = createIcon("#ef4444"); // red
        leaflet
          .marker([office.officeLatitude, office.officeLongitude], {
            icon: officeIcon,
          })
          .addTo(map)
          .bindPopup(
            `<div style="text-align:center;font-size:13px;">
              <strong>사무실</strong><br/>
              허용 반경: ${office.gpsRadius}m
            </div>`,
          );

        // Allowed radius circle
        leaflet
          .circle([office.officeLatitude, office.officeLongitude], {
            radius: office.gpsRadius,
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.08,
            weight: 2,
            dashArray: "6 4",
          })
          .addTo(map);
      }

      // ─── Check-in marker ───
      if (checkIn) {
        const checkInIcon = createIcon("#3b82f6"); // blue
        let distText = "";
        if (
          office.officeLatitude != null &&
          office.officeLongitude != null
        ) {
          const dist = haversineDistance(
            checkIn.lat,
            checkIn.lon,
            office.officeLatitude,
            office.officeLongitude,
          );
          distText = `<br/>사무실까지: ${formatDistance(dist)}`;
        }
        leaflet
          .marker([checkIn.lat, checkIn.lon], { icon: checkInIcon })
          .addTo(map)
          .bindPopup(
            `<div style="text-align:center;font-size:13px;">
              <strong>출근</strong>
              ${checkIn.time ? `<br/>${checkIn.time}` : ""}
              ${distText}
            </div>`,
          );
      }

      // ─── Check-out marker ───
      if (checkOut) {
        const checkOutIcon = createIcon("#22c55e"); // green
        let distText = "";
        if (
          office.officeLatitude != null &&
          office.officeLongitude != null
        ) {
          const dist = haversineDistance(
            checkOut.lat,
            checkOut.lon,
            office.officeLatitude,
            office.officeLongitude,
          );
          distText = `<br/>사무실까지: ${formatDistance(dist)}`;
        }
        leaflet
          .marker([checkOut.lat, checkOut.lon], { icon: checkOutIcon })
          .addTo(map)
          .bindPopup(
            `<div style="text-align:center;font-size:13px;">
              <strong>퇴근</strong>
              ${checkOut.time ? `<br/>${checkOut.time}` : ""}
              ${distText}
            </div>`,
          );
      }

      // ─── Fit bounds ───
      if (points.length > 1) {
        const bounds = leaflet.latLngBounds(
          points.map(([lat, lon]) => [lat, lon] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } else if (points.length === 1) {
        map.setView(points[0], 15);
      }

      setLeafletLoaded(true);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [checkIn, checkOut, office]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        style={{ height: "400px", width: "100%", borderRadius: "8px" }}
      />
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-secondary">
          <span className="text-sm text-text-tertiary">지도 로딩 중...</span>
        </div>
      )}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────

function MapLegend({
  checkIn,
  checkOut,
  office,
}: {
  checkIn: GpsLocation | null;
  checkOut: GpsLocation | null;
  office: OfficeGps;
}) {
  const items: { color: string; label: string; detail: string }[] = [];

  if (checkIn) {
    let detail = `${checkIn.lat.toFixed(5)}, ${checkIn.lon.toFixed(5)}`;
    if (checkIn.time) detail = `${checkIn.time} | ${detail}`;
    if (office.officeLatitude != null && office.officeLongitude != null) {
      const dist = haversineDistance(
        checkIn.lat,
        checkIn.lon,
        office.officeLatitude,
        office.officeLongitude,
      );
      detail += ` (${formatDistance(dist)})`;
    }
    items.push({ color: "#3b82f6", label: "출근", detail });
  }

  if (checkOut) {
    let detail = `${checkOut.lat.toFixed(5)}, ${checkOut.lon.toFixed(5)}`;
    if (checkOut.time) detail = `${checkOut.time} | ${detail}`;
    if (office.officeLatitude != null && office.officeLongitude != null) {
      const dist = haversineDistance(
        checkOut.lat,
        checkOut.lon,
        office.officeLatitude,
        office.officeLongitude,
      );
      detail += ` (${formatDistance(dist)})`;
    }
    items.push({ color: "#22c55e", label: "퇴근", detail });
  }

  if (office.officeLatitude != null && office.officeLongitude != null) {
    items.push({
      color: "#ef4444",
      label: "사무실",
      detail: `반경 ${office.gpsRadius}m`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-sp-3 space-y-sp-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-sp-2 text-sm">
          <span
            className="inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ background: item.color, border: "2px solid white", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}
          />
          <span className="font-medium text-text-primary">{item.label}</span>
          <span className="text-text-tertiary">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

function GpsMapModal({
  open,
  onClose,
  employeeName,
  date,
  checkIn,
  checkOut,
  office,
}: GpsMapModalProps) {
  const hasAnyLocation = !!(checkIn || checkOut);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="GPS 위치 확인"
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {/* Header info */}
      <div className="mb-sp-3 rounded-md bg-surface-secondary px-sp-3 py-sp-2 text-sm">
        <span className="font-medium">{employeeName}</span>
        <span className="ml-sp-2 text-text-tertiary">{date}</span>
      </div>

      {hasAnyLocation ? (
        <>
          <MapContent checkIn={checkIn} checkOut={checkOut} office={office} />
          <MapLegend checkIn={checkIn} checkOut={checkOut} office={office} />
        </>
      ) : (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">
            GPS 위치 정보가 없습니다.
          </span>
        </div>
      )}
    </Modal>
  );
}

export { GpsMapModal };
export type { GpsMapModalProps, GpsLocation, OfficeGps };
