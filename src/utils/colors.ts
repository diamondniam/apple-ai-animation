export function rgbaToArray(rgba: string) {
  const [r, g, b, a] = rgba.replace("rgba(", "").replace(")", "").split(",");
  return [r, g, b, a];
}
