import type { Command } from "../commands/Command";

export interface SamerArtisanConfig {
  /**
   * Name of the CLI
  */
  name: string;
  

  /**
   * Commands cache distination
  */
  cacheDist: string;
  
  /**
   * Directories from where commands will be discovered
  */
  load: string[];
  
  /**
   * Additional commands instance or path
  */
  commands: (string | Command)[];
}
