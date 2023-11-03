export interface SamerArtisanConfig {
  /**
   * Name of the CLI
  */
  name: string;
  
  /**
   * Root of the project.
   * All imports will be prefixed with that
  */
  root: string;
  
  /**
   * Commands cache distination
  */
  cacheDist: string;
  
  /**
   * Directories from where commands will be discovered
  */
  load: string[];
  
  /**
   * Additional commands path
  */
  commands: string[];
}
