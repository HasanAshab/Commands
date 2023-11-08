export interface CommandMetadata {
  /**
   * First part of the signature devided by space 
  */
  base?: string;
  
  /**
   * Rest part of the signature after first space
  */
  pattern?: string;
}