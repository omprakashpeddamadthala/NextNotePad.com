/**
 * Command ids registered here include the keyboard-bound `ActionId`s from
 * lib/constants/shortcuts.ts plus menu-only commands (e.g. "edit.cut") that
 * have no dedicated keybinding — kept as `string` so both can share one bus.
 */
type ActionHandler = () => void;

const handlers = new Map<string, ActionHandler>();

/** Components register the concrete implementation of a menu/shortcut action here. */
export function registerAction(id: string, handler: ActionHandler): () => void {
  handlers.set(id, handler);
  return () => {
    if (handlers.get(id) === handler) handlers.delete(id);
  };
}

export function runAction(id: string): boolean {
  const handler = handlers.get(id);
  if (!handler) return false;
  handler();
  return true;
}
