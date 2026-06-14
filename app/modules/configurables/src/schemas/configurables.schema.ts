/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "App Tagline",
      maxLength: 100,
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "globeSettings",
      type: "object",
      required: false,
      label: "Globe Settings",
      fields: [
        {
          fieldName: "autoRotate",
          type: "boolean",
          required: false,
          label: "Auto Rotate Globe",
        },
        {
          fieldName: "autoRotateSpeed",
          type: "number",
          required: false,
          label: "Auto Rotate Speed",
          min: 0.1,
          max: 5,
        },
        {
          fieldName: "atmosphereColor",
          type: "color",
          required: false,
          label: "Atmosphere Glow Color",
        },
      ],
    },
    {
      fieldName: "shareSettings",
      type: "object",
      required: false,
      label: "Share Settings",
      fields: [
        {
          fieldName: "shareMessageTemplate",
          type: "string",
          required: false,
          label: "Share Message Template",
          maxLength: 200,
        },
        {
          fieldName: "enableWhatsApp",
          type: "boolean",
          required: false,
          label: "Enable WhatsApp Share",
        },
        {
          fieldName: "enableEmail",
          type: "boolean",
          required: false,
          label: "Enable Email Share",
        },
        {
          fieldName: "enableSMS",
          type: "boolean",
          required: false,
          label: "Enable SMS Share",
        },
      ],
    },
    {
      fieldName: "uiCopy",
      type: "object",
      required: false,
      label: "UI Copy / Text",
      fields: [
        {
          fieldName: "searchPlaceholder",
          type: "string",
          required: false,
          label: "Search Bar Placeholder",
          maxLength: 80,
        },
        {
          fieldName: "dropPinLabel",
          type: "string",
          required: false,
          label: "Drop Pin Button Label",
          maxLength: 40,
        },
        {
          fieldName: "shareButtonLabel",
          type: "string",
          required: false,
          label: "Share Button Label",
          maxLength: 40,
        },
        {
          fieldName: "pinTitlePlaceholder",
          type: "string",
          required: false,
          label: "Pin Title Placeholder",
          maxLength: 60,
        },
        {
          fieldName: "pinDescPlaceholder",
          type: "string",
          required: false,
          label: "Pin Description Placeholder",
          maxLength: 120,
        },
      ],
    },
  ],
};
