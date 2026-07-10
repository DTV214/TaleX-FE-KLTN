export function isNotEntitledError(message?: string | null) {
  return message === "PLAYBACK_NOT_ENTITLED";
}
