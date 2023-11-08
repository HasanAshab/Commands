import { join } from "path";

/**
 * Resolve path to absolute
*/
export function resolvePath(...paths: string[]) {
  return join(process.env.NODE_PATH!, ...paths);
}

export * from "./parser";