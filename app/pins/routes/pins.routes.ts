import { Router, type Request, type Response } from "express";
import { createPin, getPinByShareId, getAllPins, deletePinByShareId } from "~/pins/services/pin.service";
import { createLogger } from "~/lib/logger";

const logger = createLogger("PinsRouter");
const router = Router();

// GET /api/pins — list all pins
router.get("/api/pins", async (_req: Request, res: Response) => {
  try {
    const pins = await getAllPins();
    res.json({ success: true, data: pins });
  } catch (error) {
    logger.error("Failed to fetch pins:", error);
    res.status(500).json({ success: false, error: "Failed to fetch pins" });
  }
});

// POST /api/pins — create a new pin
router.post("/api/pins", async (req: Request, res: Response) => {
  try {
    const { title, description, lat, lng } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ success: false, error: "Title is required" });
      return;
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      res.status(400).json({ success: false, error: "lat and lng must be numbers" });
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ success: false, error: "Invalid coordinates" });
      return;
    }

    const pin = await createPin({
      title: title.trim(),
      description: description?.trim() || "",
      lat,
      lng,
    });

    res.status(201).json({ success: true, data: pin });
  } catch (error) {
    logger.error("Failed to create pin:", error);
    res.status(500).json({ success: false, error: "Failed to create pin" });
  }
});

// GET /api/pins/:shareId — get a specific pin by share ID
router.get("/api/pins/:shareId", async (req: Request, res: Response) => {
  try {
    const shareId = Array.isArray(req.params.shareId)
      ? req.params.shareId[0]
      : req.params.shareId;
    const pin = await getPinByShareId(shareId);

    if (!pin) {
      res.status(404).json({ success: false, error: "Pin not found" });
      return;
    }

    res.json({ success: true, data: pin });
  } catch (error) {
    logger.error("Failed to get pin:", error);
    res.status(500).json({ success: false, error: "Failed to get pin" });
  }
});

// DELETE /api/pins/:shareId — delete a pin
router.delete("/api/pins/:shareId", async (req: Request, res: Response) => {
  try {
    const shareId = Array.isArray(req.params.shareId)
      ? req.params.shareId[0]
      : req.params.shareId;
    const deleted = await deletePinByShareId(shareId);

    if (!deleted) {
      res.status(404).json({ success: false, error: "Pin not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete pin:", error);
    res.status(500).json({ success: false, error: "Failed to delete pin" });
  }
});

export default router;
