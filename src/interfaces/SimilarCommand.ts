import type { Command } from "../commands/Command";

export interface SimilarCommand {
  /**
   * The levenshtein distance from the input base
   */
  distance: number;
  
  /**
   * Command class
   */
  command: Command<unknown, unknown>;
}