// Import models in the correct order to ensure schemas are registered
import "./User";
import "./Target";

// Re-export models for convenience
export { default as User } from "./User";
export { default as Target } from "./Target";
