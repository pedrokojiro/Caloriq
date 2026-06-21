const pendingImages = new Map<string, string>();

export function storePendingAnalysisImage(imageUri: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  pendingImages.set(id, imageUri);
  return id;
}

export function getPendingAnalysisImage(id: string | undefined) {
  return id ? pendingImages.get(id) : undefined;
}

export function clearPendingAnalysisImage(id: string | undefined) {
  if (id) pendingImages.delete(id);
}
