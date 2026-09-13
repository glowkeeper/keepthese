export function passagePath(passageId: string) {
  return `/passages/${encodeURIComponent(passageId)}/`;
}

export function journeyPath(journeyId: string) {
  return `/journeys/${encodeURIComponent(journeyId)}/`;
}
