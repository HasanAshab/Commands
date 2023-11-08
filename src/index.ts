import { SamerArtisan } from "./SamerArtisan";
import CacheCommands from "./commands/CacheCommands";
import ListCommands from "./commands/ListCommands";

/**
 * Setting default root of the project.
 * All imports will be prefixed with that
*/
process.env.NODE_PATH = process.cwd();

/**
 * Registering the core commands of SamerArtisan
*/
SamerArtisan.commands([
  new CacheCommands(SamerArtisan),
  new ListCommands(SamerArtisan)
]);

export { SamerArtisan };
export * from "./commands/Command";
export * from "./interfaces/SamerArtisanConfig";