import { PinModel } from "~/pins/models/pin.model";
import { createLogger } from "~/lib/logger";

const logger = createLogger("PinService");

function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface CreatePinInput {
  title: string;
  description?: string;
  lat: number;
  lng: number;
}

export interface PinData {
  _id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  shareId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createPin(input: CreatePinInput): Promise<PinData> {
  let shareId = generateShareId();
  // Ensure uniqueness
  let existing = await PinModel.findOne({ shareId });
  while (existing) {
    shareId = generateShareId();
    existing = await PinModel.findOne({ shareId });
  }

  const pin = await PinModel.create({
    title: input.title,
    description: input.description || "",
    lat: input.lat,
    lng: input.lng,
    shareId,
  });

  logger.info(`Created pin ${pin.shareId} at [${pin.lat}, ${pin.lng}]`);

  const now = new Date();
  return {
    _id: pin._id.toString(),
    title: pin.title,
    description: pin.description || "",
    lat: pin.lat,
    lng: pin.lng,
    shareId: pin.shareId,
    createdAt: pin.createdAt ?? now,
    updatedAt: pin.updatedAt ?? now,
  };
}

export async function getPinByShareId(shareId: string): Promise<PinData | null> {
  const pin = await PinModel.findOne({ shareId, deletedAt: null });
  if (!pin) return null;

  const now = new Date();
  return {
    _id: pin._id.toString(),
    title: pin.title,
    description: pin.description || "",
    lat: pin.lat,
    lng: pin.lng,
    shareId: pin.shareId,
    createdAt: pin.createdAt ?? now,
    updatedAt: pin.updatedAt ?? now,
  };
}

export async function getAllPins(): Promise<PinData[]> {
  const pins = await PinModel.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(100);
  const now = new Date();
  return pins.map((pin) => ({
    _id: pin._id.toString(),
    title: pin.title,
    description: pin.description || "",
    lat: pin.lat,
    lng: pin.lng,
    shareId: pin.shareId,
    createdAt: pin.createdAt ?? now,
    updatedAt: pin.updatedAt ?? now,
  }));
}

export async function deletePinByShareId(shareId: string): Promise<boolean> {
  const result = await PinModel.updateOne(
    { shareId },
    { $set: { deletedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}
