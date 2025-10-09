/**
 * Utilidades para manipulación de colores
 */

/**
 * Oscurece un color hexadecimal por un porcentaje dado
 * @param color - Color hexadecimal (ej: "#3B82F6")
 * @param percent - Porcentaje de oscurecimiento (0-100)
 * @returns Color hexadecimal oscurecido
 */
export function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
