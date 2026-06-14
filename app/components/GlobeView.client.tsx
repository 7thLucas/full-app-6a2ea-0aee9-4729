"use client";
import { useEffect, useRef, useCallback } from "react";

export interface GlobePin {
  lat: number;
  lng: number;
  title: string;
  description: string;
  shareId: string;
}

interface GlobeViewProps {
  pins: GlobePin[];
  onPinClick: (pin: GlobePin) => void;
  onGlobeClick: (lat: number, lng: number) => void;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  atmosphereColor?: string;
  highlightedShareId?: string | null;
}

export default function GlobeView({
  pins,
  onPinClick,
  onGlobeClick,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  atmosphereColor = "#00E5FF",
  highlightedShareId = null,
}: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const isRotatingRef = useRef(autoRotate);
  const rafRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoRotate = useCallback(() => {
    if (!globeRef.current || !isRotatingRef.current) return;
    const globe = globeRef.current;
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotateSpeed]);

  const stopAutoRotate = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = false;
    }
    // Resume after 4 seconds of inactivity
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isRotatingRef.current) {
      idleTimerRef.current = setTimeout(startAutoRotate, 4000);
    }
  }, [startAutoRotate]);

  useEffect(() => {
    isRotatingRef.current = autoRotate;
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

  useEffect(() => {
    if (!containerRef.current) return;

    let Globe: any;
    let instance: any;

    const init = async () => {
      const mod = await import("globe.gl");
      Globe = mod.default;

      const width = containerRef.current!.clientWidth;
      const height = containerRef.current!.clientHeight;

      instance = Globe()(containerRef.current!);
      globeRef.current = instance;

      instance
        .width(width)
        .height(height)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
        .atmosphereColor(atmosphereColor)
        .atmosphereAltitude(0.15)
        .onGlobeClick(({ lat, lng }: { lat: number; lng: number }) => {
          stopAutoRotate();
          onGlobeClick(lat, lng);
        });

      // Setup controls
      const controls = instance.controls();
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = autoRotateSpeed;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 200;
        controls.maxDistance = 700;

        // Detect user interaction
        const canvas = containerRef.current!.querySelector("canvas");
        if (canvas) {
          canvas.addEventListener("mousedown", stopAutoRotate);
          canvas.addEventListener("touchstart", stopAutoRotate, { passive: true });
        }
      }

      // Set initial camera position
      instance.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
    };

    init().catch(console.error);

    const handleResize = () => {
      if (!containerRef.current || !globeRef.current) return;
      globeRef.current
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      if (globeRef.current) {
        try {
          globeRef.current._destructor?.();
        } catch (_) {}
        globeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pins when they change
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const pointsData = pins.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      title: p.title,
      description: p.description,
      shareId: p.shareId,
      color: p.shareId === highlightedShareId ? "#00E5FF" : "#FF5C5C",
      radius: p.shareId === highlightedShareId ? 0.6 : 0.4,
    }));

    globe
      .pointsData(pointsData)
      .pointAltitude(0.01)
      .pointColor("color")
      .pointRadius("radius")
      .pointResolution(12)
      .pointsMerge(false)
      .onPointClick((point: any) => {
        stopAutoRotate();
        onPinClick({
          lat: point.lat,
          lng: point.lng,
          title: point.title,
          description: point.description,
          shareId: point.shareId,
        });
      })
      .pointLabel((point: any) => `
        <div style="
          background: rgba(19,25,41,0.9);
          border: 1px solid rgba(0,229,255,0.4);
          border-radius: 8px;
          padding: 6px 10px;
          color: white;
          font-family: Inter, sans-serif;
          font-size: 12px;
          pointer-events: none;
        ">
          <strong style="color:#00E5FF;">${point.title}</strong>
          ${point.description ? `<div style="color:#A0AEC0;margin-top:2px;">${point.description}</div>` : ""}
        </div>
      `);
  }, [pins, highlightedShareId, stopAutoRotate, onPinClick]);

  // Fly to highlighted pin
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !highlightedShareId) return;
    const pin = pins.find((p) => p.shareId === highlightedShareId);
    if (!pin) return;
    globe.pointOfView({ lat: pin.lat, lng: pin.lng, altitude: 1.8 }, 800);
  }, [highlightedShareId, pins]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
