import { useState, useCallback, lazy, Suspense, useEffect } from "react";
import { MapPin, Share2, X, Plus, Search, ZoomIn, ZoomOut, RotateCcw, Loader2, Copy, Check, Globe, Navigation } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import type { GlobePin } from "~/components/GlobeView.client";

const GlobeView = lazy(() => import("~/components/GlobeView.client"));

interface PinData {
  _id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  shareId: string;
  createdAt: string;
}

interface PendingPin {
  lat: number;
  lng: number;
}

type ViewState =
  | { mode: "idle" }
  | { mode: "pending-pin"; lat: number; lng: number }
  | { mode: "view-pin"; pin: PinData };

export default function IndexPage() {
  const { config, loading: configLoading } = useConfigurables();

  const [pins, setPins] = useState<PinData[]>([]);
  const [pinsLoading, setPinsLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ mode: "idle" });
  const [pinTitle, setPinTitle] = useState("");
  const [pinDesc, setPinDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedShareId, setHighlightedShareId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const appName = config?.appName || "Location Tracker";
  const tagline = config?.tagline || "Your world, shared perfectly.";
  const accentColor = config?.brandColor?.accent || "#00E5FF";
  const autoRotate = config?.globeSettings?.autoRotate ?? true;
  const autoRotateSpeed = config?.globeSettings?.autoRotateSpeed ?? 0.5;
  const atmosphereColor = config?.globeSettings?.atmosphereColor || "#00E5FF";
  const shareTemplate = config?.shareSettings?.shareMessageTemplate || "Check out this location: {title} — {url}";
  const uiCopy = config?.uiCopy;
  const searchPlaceholder = uiCopy?.searchPlaceholder || "Search or drop a pin…";
  const shareButtonLabel = uiCopy?.shareButtonLabel || "Share Location";
  const pinTitlePlaceholder = uiCopy?.pinTitlePlaceholder || "Name this place";
  const pinDescPlaceholder = uiCopy?.pinDescPlaceholder || "Describe what makes this spot special…";

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Load pins from API
  const fetchPins = useCallback(async () => {
    try {
      const res = await fetch("/api/pins");
      const data = await res.json();
      if (data.success) {
        setPins(data.data);
      }
    } catch (err) {
      console.error("Failed to load pins:", err);
    } finally {
      setPinsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  const handleGlobeClick = useCallback((lat: number, lng: number) => {
    setViewState({ mode: "pending-pin", lat, lng });
    setPinTitle("");
    setPinDesc("");
  }, []);

  const handlePinClick = useCallback((pin: GlobePin) => {
    const fullPin = pins.find((p) => p.shareId === pin.shareId);
    if (fullPin) {
      setViewState({ mode: "view-pin", pin: fullPin });
      setHighlightedShareId(fullPin.shareId);
    }
  }, [pins]);

  const handleSavePin = async () => {
    if (viewState.mode !== "pending-pin") return;
    if (!pinTitle.trim()) {
      showToast("Please give your pin a name.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pinTitle.trim(),
          description: pinDesc.trim(),
          lat: viewState.lat,
          lng: viewState.lng,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newPin = data.data as PinData;
        setPins((prev) => [newPin, ...prev]);
        setViewState({ mode: "view-pin", pin: newPin });
        setHighlightedShareId(newPin.shareId);
        showToast("Pin saved!");
      } else {
        showToast("Failed to save pin.");
      }
    } catch (err) {
      showToast("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getShareUrl = (pin: PinData) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/pin/${pin.shareId}`;
  };

  const getShareMessage = (pin: PinData) => {
    const url = getShareUrl(pin);
    return shareTemplate
      .replace("{title}", pin.title)
      .replace("{url}", url)
      .replace("{desc}", pin.description || "");
  };

  const handleShare = async (pin: PinData) => {
    const url = getShareUrl(pin);
    const message = getShareMessage(pin);

    if (navigator.share) {
      try {
        await navigator.share({ title: pin.title, text: message, url });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (_) {}
    } else {
      await handleCopyLink(pin);
    }
  };

  const handleCopyLink = async (pin: PinData) => {
    const url = getShareUrl(pin);
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (_) {}
  };

  const handleWhatsApp = (pin: PinData) => {
    const message = encodeURIComponent(getShareMessage(pin));
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleEmail = (pin: PinData) => {
    const subject = encodeURIComponent(`Check out: ${pin.title}`);
    const body = encodeURIComponent(getShareMessage(pin));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleSMS = (pin: PinData) => {
    const message = encodeURIComponent(getShareMessage(pin));
    window.open(`sms:?&body=${message}`, "_blank");
  };

  const handleDeletePin = async (pin: PinData) => {
    try {
      const res = await fetch(`/api/pins/${pin.shareId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPins((prev) => prev.filter((p) => p.shareId !== pin.shareId));
        setViewState({ mode: "idle" });
        setHighlightedShareId(null);
        showToast("Pin deleted.");
      }
    } catch (err) {
      showToast("Failed to delete pin.");
    }
  };

  const handleClose = () => {
    setViewState({ mode: "idle" });
    setHighlightedShareId(null);
  };

  const globePins: GlobePin[] = pins.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    title: p.title,
    description: p.description,
    shareId: p.shareId,
  }));

  // Add pending pin as a ghost if in pending mode
  const allGlobePins: GlobePin[] =
    viewState.mode === "pending-pin"
      ? [
          ...globePins,
          {
            lat: viewState.lat,
            lng: viewState.lng,
            title: pinTitle || "New pin…",
            description: "",
            shareId: "__pending__",
          },
        ]
      : globePins;

  const formatCoord = (value: number, positive: string, negative: string) => {
    const abs = Math.abs(value).toFixed(6);
    return `${abs}° ${value >= 0 ? positive : negative}`;
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "#0B0F1A" }}
    >
      {/* Starfield background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, #131929 0%, #0B0F1A 60%, #060810 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none animate-glow-pulse"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Globe — full viewport */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        {configLoading || pinsLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="flex flex-col items-center gap-4">
              <Globe
                className="animate-spin"
                size={48}
                style={{ color: accentColor }}
              />
              <p className="text-white/60 text-sm font-display">Loading globe…</p>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center w-full h-full">
                <Globe
                  className="animate-spin"
                  size={48}
                  style={{ color: accentColor }}
                />
              </div>
            }
          >
            <GlobeView
              pins={allGlobePins}
              onPinClick={handlePinClick}
              onGlobeClick={handleGlobeClick}
              autoRotate={autoRotate}
              autoRotateSpeed={autoRotateSpeed}
              atmosphereColor={atmosphereColor}
              highlightedShareId={
                viewState.mode === "pending-pin"
                  ? "__pending__"
                  : highlightedShareId
              }
            />
          </Suspense>
        )}
      </div>

      {/* Header bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-3"
        style={{ zIndex: 30 }}
      >
        {/* App name / logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: accentColor }}
          >
            <Navigation size={16} color="#0B0F1A" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight leading-none">
            {appName}
          </span>
        </div>

        {/* Instruction hint */}
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <MapPin size={12} style={{ color: accentColor }} />
          <span className="text-white/70 text-xs">Tap globe to drop pin</span>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="absolute top-16 left-4 right-4"
        style={{ zIndex: 20 }}
      >
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-white/40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {/* Search results */}
        {searchQuery.trim() && (
          <div className="glass rounded-2xl mt-2 overflow-hidden animate-scale-in">
            {pins
              .filter(
                (p) =>
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 5)
              .map((pin) => (
                <button
                  key={pin.shareId}
                  onClick={() => {
                    setViewState({ mode: "view-pin", pin });
                    setHighlightedShareId(pin.shareId);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <MapPin size={14} style={{ color: "#FF5C5C" }} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{pin.title}</div>
                    <div className="text-white/50 text-xs font-mono-coords">
                      {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            {pins.filter(
              (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="px-4 py-3 text-white/40 text-sm">No pins found.</div>
            )}
          </div>
        )}
      </div>

      {/* Pin count badge */}
      {pins.length > 0 && viewState.mode === "idle" && (
        <div
          className="absolute bottom-24 left-4 glass rounded-2xl px-3 py-2 animate-fade-in"
          style={{ zIndex: 20 }}
        >
          <div className="flex items-center gap-2">
            <MapPin size={12} style={{ color: "#FF5C5C" }} />
            <span className="text-white/70 text-xs">
              {pins.length} {pins.length === 1 ? "pin" : "pins"} saved
            </span>
          </div>
        </div>
      )}

      {/* Toolbar — bottom right */}
      <div
        className="absolute bottom-8 right-4 flex flex-col gap-2"
        style={{ zIndex: 20 }}
      >
        <button
          onClick={() => {
            const globe = (window as any).__globeInstance;
            if (!globe) return;
            const pov = globe.pointOfView();
            globe.pointOfView({ ...pov, altitude: Math.max(pov.altitude - 0.4, 0.3) }, 300);
          }}
          className="glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} className="text-white/70" />
        </button>
        <button
          onClick={() => {
            const globe = (window as any).__globeInstance;
            if (!globe) return;
            const pov = globe.pointOfView();
            globe.pointOfView({ ...pov, altitude: Math.min(pov.altitude + 0.4, 4) }, 300);
          }}
          className="glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} className="text-white/70" />
        </button>
        <button
          onClick={() => {
            const globe = (window as any).__globeInstance;
            if (!globe) return;
            globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 800);
          }}
          className="glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Reset view"
        >
          <RotateCcw size={16} className="text-white/70" />
        </button>
      </div>

      {/* ────────────────── PANEL: Pending Pin Form ────────────────── */}
      {viewState.mode === "pending-pin" && (
        <div
          className="absolute bottom-0 left-0 right-0 animate-slide-up"
          style={{ zIndex: 30 }}
        >
          <div className="glass rounded-t-3xl p-6 pb-safe">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {/* Coords */}
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} style={{ color: "#FF5C5C" }} />
              <span className="font-mono-coords text-xs text-white/60">
                {formatCoord(viewState.lat, "N", "S")} &nbsp;
                {formatCoord(viewState.lng, "E", "W")}
              </span>
            </div>

            <h3 className="font-display font-semibold text-white text-lg mb-4">
              Name this location
            </h3>

            <input
              type="text"
              value={pinTitle}
              onChange={(e) => setPinTitle(e.target.value)}
              placeholder={pinTitlePlaceholder}
              maxLength={80}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm outline-none focus:border-cyan-400/50 focus:bg-white/8 transition-colors mb-3"
              style={{ "--tw-ring-color": accentColor } as any}
            />

            <textarea
              value={pinDesc}
              onChange={(e) => setPinDesc(e.target.value)}
              placeholder={pinDescPlaceholder}
              maxLength={300}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm outline-none focus:border-cyan-400/50 focus:bg-white/8 transition-colors resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                disabled={saving || !pinTitle.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: accentColor,
                  color: "#0B0F1A",
                }}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {saving ? "Saving…" : "Save Pin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── PANEL: View Pin ────────────────── */}
      {viewState.mode === "view-pin" && (
        <div
          className="absolute bottom-0 left-0 right-0 animate-slide-up"
          style={{ zIndex: 30 }}
        >
          <div className="glass rounded-t-3xl p-6 pb-safe">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={18} style={{ color: "#FF5C5C" }} className="shrink-0" />
                <h3 className="font-display font-bold text-white text-xl leading-tight truncate">
                  {viewState.pin.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="ml-3 shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={14} className="text-white/70" />
              </button>
            </div>

            {/* Coordinates */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono-coords text-xs text-white/50">
                {formatCoord(viewState.pin.lat, "N", "S")} &nbsp;
                {formatCoord(viewState.pin.lng, "E", "W")}
              </span>
            </div>

            {/* Description */}
            {viewState.pin.description && (
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {viewState.pin.description}
              </p>
            )}

            {/* Share URL pill */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 mb-4">
              <span className="text-white/40 text-xs truncate flex-1 font-mono-coords">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/pin/${viewState.pin.shareId}`
                  : `/pin/${viewState.pin.shareId}`}
              </span>
              <button
                onClick={() => handleCopyLink(viewState.pin)}
                className="shrink-0 flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: accentColor }}
              >
                {copySuccess ? <Check size={12} /> : <Copy size={12} />}
                {copySuccess ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Main share button */}
            <button
              onClick={() => handleShare(viewState.pin)}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-3 transition-all active:scale-95"
              style={{ background: accentColor, color: "#0B0F1A" }}
            >
              <Share2 size={16} />
              {shareSuccess ? "Shared!" : shareButtonLabel}
            </button>

            {/* Platform quick-share row */}
            <div className="flex gap-2 mb-4">
              {(config?.shareSettings?.enableWhatsApp ?? true) && (
                <button
                  onClick={() => handleWhatsApp(viewState.pin)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="text-base">💬</span>
                  WhatsApp
                </button>
              )}
              {(config?.shareSettings?.enableEmail ?? true) && (
                <button
                  onClick={() => handleEmail(viewState.pin)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="text-base">✉️</span>
                  Email
                </button>
              )}
              {(config?.shareSettings?.enableSMS ?? true) && (
                <button
                  onClick={() => handleSMS(viewState.pin)}
                  className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="text-base">💬</span>
                  SMS
                </button>
              )}
              <button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareMessage(viewState.pin))}`,
                    "_blank"
                  )
                }
                className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="text-base">𝕏</span>
                X
              </button>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDeletePin(viewState.pin)}
              className="w-full py-2 text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              Remove pin
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-2xl px-5 py-3 animate-scale-in pointer-events-none"
          style={{ zIndex: 40 }}
        >
          <p className="text-white text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
