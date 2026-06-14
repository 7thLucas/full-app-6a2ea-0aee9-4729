// Import global routes
import routes from "./routes";
import { initializeModels } from "./models";
import pinsRouter from "~/pins/routes/pins.routes";

// Initialize models
await initializeModels();

// Register pin model explicitly
await import("~/pins/models/pin.model");

// Register feature routes
routes.use(pinsRouter);

export default routes;
