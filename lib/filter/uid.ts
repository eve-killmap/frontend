let counter = 0;

export function makeUid(): string {
  counter += 1;
  return `fc${counter}`;
}
