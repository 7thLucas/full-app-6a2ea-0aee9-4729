/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TGlobeSettings = {
  autoRotate: boolean;
  autoRotateSpeed: number;
  atmosphereColor: string;
};

export type TShareSettings = {
  shareMessageTemplate: string;
  enableWhatsApp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
};

export type TUICopy = {
  searchPlaceholder: string;
  dropPinLabel: string;
  shareButtonLabel: string;
  pinTitlePlaceholder: string;
  pinDescPlaceholder: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  tagline: string;
  brandColor: TBrandColor;
  globeSettings: TGlobeSettings;
  shareSettings: TShareSettings;
  uiCopy: TUICopy;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Location Tracker",
  logoUrl: "FILL_LOGO_URL_HERE",
  tagline: "Your world, shared perfectly.",
  brandColor: {
    primary: "#0B0F1A",
    secondary: "#131929",
    accent: "#00E5FF",
  },
  globeSettings: {
    autoRotate: true,
    autoRotateSpeed: 0.5,
    atmosphereColor: "#00E5FF",
  },
  shareSettings: {
    shareMessageTemplate: "Check out this location I found! {title} - {url}",
    enableWhatsApp: true,
    enableEmail: true,
    enableSMS: true,
  },
  uiCopy: {
    searchPlaceholder: "Search or drop a pin…",
    dropPinLabel: "Drop Pin",
    shareButtonLabel: "Share Location",
    pinTitlePlaceholder: "Name this place",
    pinDescPlaceholder: "Describe what makes this spot special…",
  },
};
