function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length + 1;
  const len2 = str2.length + 1;

  const matrix: number[][] = [];

  for (let i = 0; i < len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j < len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < len1; i++) {
    for (let j = 1; j < len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1 - 1][len2 - 1];
}

export function analyseSimilarity(str1: string, str2: string, threshold: number): number {
  const distance = calculateLevenshteinDistance(str1, str2);
  console.log(str2, distance)
  return distance <= threshold ? distance : -1;
}