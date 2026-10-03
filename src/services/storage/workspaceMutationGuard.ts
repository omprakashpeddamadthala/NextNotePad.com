let pendingMutations = 0;

export function hasPendingWorkspaceMutation(): boolean {
  return pendingMutations > 0;
}

export async function withWorkspaceMutation<T>(
  mutation: () => Promise<T>,
): Promise<T> {
  pendingMutations += 1;
  try {
    return await mutation();
  } finally {
    pendingMutations -= 1;
  }
}
