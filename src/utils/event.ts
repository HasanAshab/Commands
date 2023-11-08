export type Listener = () => void;

let listener: Listener = () => process.exit(0);

export function commandCompleted(cb?: Listener) {
  if(cb) listener = cb;
  else listener();
}
