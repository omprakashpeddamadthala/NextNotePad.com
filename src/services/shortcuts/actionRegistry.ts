type ActionHandler = () => void;

const handlers = new Map<string, ActionHandler>();

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
