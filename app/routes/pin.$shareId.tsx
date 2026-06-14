import { useState, lazy, Suspense } from "react";
import {
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { MapPin, Share2, Copy, Check, Globe, Navigation, ArrowLeft } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";

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

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { shareId } = params;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    const res = await fetch(`${baseUrl}/api/pins/${shareId}`);
    const data = await res.json();
    if (!data.success || !data.data) {
      return { pin: null, error: "Pin not found" };
    }
    return { pin: data.data as PinData, error: null };
  } catch (err) {
    return { pin: null, error: "Failed to load pin" };
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.pin) {
    return [{ title: "Pin not found — Location Tracker" }];
  }
  const { pin } = data;
  const title = `${pin.title} — Location Tracker`;
  const description =
    pin.description ||
    `Explore this location: ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
};

function formatCoord(value: number, positive: string, negative: string) {
  const abs = Math.abs(value).toFixed(6);
  return `${abs}° ${value >= 0 ? positive : negative}`;
}

export default function PinSharePage() {
  const { pin, error } = useLoaderData<typeof loader>();
  const { config } = useConfigurables();

  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const accentColor = config?.brandColor?.accent || "#00E5FF";
  const appName = config?.appName || "Location Tracker";
  const shareTemplate =
    config?.shareSettings?.shareMessageTemplate ||
    "Check out this location: {title} — {url}";

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  };

  const getShareMessage = () => {
    if (!pin) return "";
    const url = getShareUrl();
    return shareTemplate
      .replace("{title}", pin.title)
      .replace("{url}", url)
      .replace("{desc}", pin.description || "");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (_) {}
  };

  const handleShare = async () => {
    if (!pin) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: pin.title,
          text: getShareMessage(),
          url: getShareUrl(),
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (_) {}
    } else {
      handleCopy();
    }
  };

  if (error || !pin) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: "#0B0F1A" }}
      >
        <Globe size={48} className="mb-4" style={{ color: "#00E5FF" }} />
        <h1 className="font-display font-bold text-white text-2xl mb-2">
          Pin not found
        </h1>
        <p className="text-white/50 text-sm mb-6">
          This location pin may have been removed.
        </p>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
          style={{ background: "#00E5FF", color: "#0B0F1A" }}
        >
          <Globe size={16} />
          Explore the Globe
        </a>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#0B0F1A" }}
    >
      {/* Radial background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, #131929 0%, #0B0F1A 60%, #060810 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-3">
        <a
          href="/"
          className="flex items-center gap-2 glass rounded-full px-3 py-1.5"
        >
          <ArrowLeft size={14} className="text-white/70" />
          <span className="text-white/70 text-xs">{appName}</span>
        </a>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <Navigation size={16} color="#0B0F1A" />
        </div>
      </div>

      {/* Globe preview — focused on pin location */}
      <div className="relative z-0" style={{ height: "55vh" }}>
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Globe className="animate-spin" size={36} style={{ color: accentColor }} />
            </div>
          }
        >
          <GlobeView
            pins={[pin]}
            onPinClick={() => {}}
            onGlobeClick={() => {}}
            autoRotate={false}
            highlightedShareId={pin.shareId}
          />
        </Suspense>
      </div>

      {/* Pin details card */}
      <div className="relative z-10 -mt-8">
        <div className="glass rounded-t-3xl px-6 pt-6 pb-8 min-h-screen">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

          {/* Title */}
          <div className="flex items-start gap-3 mb-3">
            <MapPin size={22} style={{ color: "#FF5C5C" }} className="shrink-0 mt-0.5" />
            <h1 className="font-display font-bold text-white text-2xl leading-tight">
              {pin.title}
            </h1>
          </div>

          {/* Coordinates */}
          <div className="flex items-center gap-2 mb-4 ml-1">
            <span className="font-mono-coords text-xs text-white/50">
              {formatCoord(pin.lat, "N", "S")} &nbsp;
              {formatCoord(pin.lng, "E", "W")}
            </span>
          </div>

          {/* Description */}
          {pin.description && (
            <p className="text-white/70 text-base leading-relaxed mb-6">
              {pin.description}
            </p>
          )}

          {/* Share URL */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 mb-4">
            <span className="text-white/40 text-xs truncate flex-1 font-mono-coords">
              {getShareUrl()}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 text-xs font-medium"
              style={{ color: accentColor }}
            >
              {copySuccess ? <Check size={12} /> : <Copy size={12} />}
              {copySuccess ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Share CTA */}
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 mb-4 transition-all active:scale-95"
            style={{ background: accentColor, color: "#0B0F1A" }}
          >
            <Share2 size={18} />
            {shareSuccess ? "Shared!" : "Share this Location"}
          </button>

          {/* Platform quick-share */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(getShareMessage())}`,
                  "_blank"
                )
              }
              className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={() =>
                window.open(
                  `mailto:?subject=${encodeURIComponent(`Check out: ${pin.title}`)}&body=${encodeURIComponent(getShareMessage())}`,
                  "_blank"
                )
              }
              className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
            >
              ✉️ Email
            </button>
            <button
              onClick={() =>
                window.open(
                  `sms:?&body=${encodeURIComponent(getShareMessage())}`,
                  "_blank"
                )
              }
              className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
            >
              📱 SMS
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareMessage())}`,
                  "_blank"
                )
              }
              className="flex-1 py-2.5 rounded-xl glass text-xs font-medium text-white/80 hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
            >
              𝕏 X
            </button>
          </div>

          {/* Explore CTA */}
          <a
            href="/"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <Globe size={16} />
            Explore the globe
          </a>
        </div>
      </div>
    </div>
  );
}
