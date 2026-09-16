/** Minúsculas y sin acentos, para que "Ned" y "néd" busquen igual. */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
