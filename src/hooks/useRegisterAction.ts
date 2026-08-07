import { useEffect } from "react";
import { registerAction } from "@/services/shortcuts/actionRegistry";

/** Declaratively registers an action handler for the lifetime of the component. */
export function useRegisterAction(
  id: string,
  handler: () => void,
  deps: React.DependencyList,
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => registerAction(id, handler), deps);
}
