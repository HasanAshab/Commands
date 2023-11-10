import type { Command } from "../commands/Command";

export interface SamerArtisanConfig {
  /**
   * All imports will be joined with that
  */
  root: string;
  
  /**
   * Name of the CLI
  */
  name: string;
  
  /**
   * Directories from where commands will be discovered
  */
  load: string[];
  
  /**
   * Additional commands instance or path
  */
  commands: (string | Command<any, any>)[];
}
