import { SamerArtisan } from "./SamerArtisan";
import CacheCommands from "./commands/CacheCommands";
import ListCommands from "./commands/ListCommands";

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