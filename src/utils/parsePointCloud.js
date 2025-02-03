export const parseXYZFile = (text) => {
  const points = text
    .trim()
    .split("\n") // Split by line
    .map(
      (line) =>
        line
          .trim()
          .split(/\s+/) // Split by whitespace
          .map(parseFloat) // Convert to numbers
    )
    .filter((point) => point.length === 3 && point.every((v) => isFinite(v))); // Validate points
  return points;
};
