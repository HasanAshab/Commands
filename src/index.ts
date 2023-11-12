import { SamerArtisan } from "./SamerArtisan";
import ListCommands from "./commands/ListCommands";
import MakeCommand from "./commands/MakeCommand";

/**
 * Registering the core commands of SamerArtisan
*/
SamerArtisan.commands([
  new ListCommands(SamerArtisan),
  new MakeCommand(SamerArtisan)
]);


export { SamerArtisan };
export * from "./commands/Command";
export * from "./interfaces/SamerArtisanConfig";