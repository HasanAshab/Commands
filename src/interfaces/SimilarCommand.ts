import type { Command } from "../commands/Command";

export interface SimilarCommand {
  distance: number;
  command: Command<unknown, unknown>;
}