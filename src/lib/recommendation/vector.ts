import type { OnboardingAnswer, DrinkRecord } from "../types";
import { FLAVOR_SUPER_CATEGORIES } from "../types";

// Taste vector: [acidity, sweetness, bitterness, saltiness, strength, texture, temperatureFeel, flavorWeight1, flavorWeight2, flavorWeight3]
// Each dimension is 1-5

export function generateInitialVector(answers: OnboardingAnswer): number[] {
  const vector = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]; // Default middle values

  // Q1: Sour vs Sweet
  switch (answers.q1) {
    case "sour":
      vector[0] = 4; vector[1] = 2;
      break;
    case "sweet":
      vector[0] = 2; vector[1] = 4;
      break;
    case "middle":
      vector[0] = 3; vector[1] = 3;
      break;
  }

  // Q2: Bitterness tolerance
  switch (answers.q2) {
    case "dislike":
      vector[2] = 1;
      break;
    case "okay":
      vector[2] = 3;
      break;
    case "like":
      vector[2] = 5;
      break;
  }

  // Q3: Favorite classic cocktail → adjust multiple dimensions
  switch (answers.q3) {
    case "mojito":
      vector[0] = Math.min(5, vector[0] + 1); // More acidic
      vector[5] = 2; // Light texture
      vector[6] = 2; // Cool
      break;
    case "whisky_sour":
      vector[0] = Math.min(5, vector[0] + 1);
      vector[4] = 4; // Strong
      vector[6] = 4; // Warm
      break;
    case "espresso_martini":
      vector[2] = Math.min(5, vector[2] + 1); // Bitter
      vector[4] = 4; // Strong
      vector[5] = 4; // Heavy
      break;
    case "all":
      // Balanced, keep defaults
      break;
  }

  // Q4: Strength preference
  switch (answers.q4) {
    case "smooth":
      vector[4] = 2;
      break;
    case "middle":
      vector[4] = 3;
      break;
    case "strong":
      vector[4] = 5;
      break;
  }

  // Q5: Light vs Rich
  switch (answers.q5) {
    case "light":
      vector[5] = 2; vector[6] = 2;
      break;
    case "middle":
      vector[5] = 3; vector[6] = 3;
      break;
    case "rich":
      vector[5] = 4; vector[6] = 4;
      break;
  }

  return vector;
}

export function cocktailToVector(cocktail: {
  acidity: number;
  sweetness: number;
  bitterness: number;
  saltiness: number;
  strength: number;
  texture: string;
  temperatureFeel: string;
}): number[] {
  const textureMap: Record<string, number> = { light: 2, medium: 3, heavy: 4 };
  const tempMap: Record<string, number> = { cool: 2, neutral: 3, warm: 4 };

  return [
    cocktail.acidity,
    cocktail.sweetness,
    cocktail.bitterness,
    cocktail.saltiness,
    cocktail.strength,
    textureMap[cocktail.texture] || 3,
    tempMap[cocktail.temperatureFeel] || 3,
    3, 3, 3, // flavor weights default
  ];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function updateTasteVector(
  currentVector: number[],
  record: DrinkRecord
): number[] {
  const newVector = [...currentVector];
  const rating = record.overallRating;
  const weight = rating >= 4 ? 0.1 : rating <= 2 ? -0.1 : 0;

  if (weight === 0) return newVector;

  const dimensions = [
    record.acidityRating,
    record.sweetnessRating,
    record.bitternessRating,
    record.saltinessRating,
    record.strengthRating,
  ];

  dimensions.forEach((val, i) => {
    if (val !== undefined) {
      newVector[i] = Math.max(1, Math.min(5, newVector[i] + (val - newVector[i]) * Math.abs(weight)));
    }
  });

  // Update texture
  if (record.texture) {
    const textureVal = { light: 2, medium: 3, heavy: 4 }[record.texture];
    newVector[5] = Math.max(1, Math.min(5, newVector[5] + (textureVal - newVector[5]) * Math.abs(weight)));
  }

  // Update temperature feel
  if (record.temperatureFeel) {
    const tempVal = { cool: 2, neutral: 3, warm: 4 }[record.temperatureFeel];
    newVector[6] = Math.max(1, Math.min(5, newVector[6] + (tempVal - newVector[6]) * Math.abs(weight)));
  }

  // Update flavor tag weights (dimensions 7-9)
  // Map flavor tags to 3 super-categories:
  // dim 7: fruity/floral (citrus, fruit, floral)
  // dim 8: herbal/spice (herbs, spice, woody)
  // dim 9: rich/dessert (roasted, cream, special)
  if (record.flavorTags && record.flavorTags.length > 0) {
    const superCats = [
      FLAVOR_SUPER_CATEGORIES.fruity,
      FLAVOR_SUPER_CATEGORIES.herbal,
      FLAVOR_SUPER_CATEGORIES.rich,
    ];

    const counts = [0, 0, 0];
    record.flavorTags.forEach((tag) => {
      superCats.forEach((cats, i) => {
        if (cats.includes(tag)) counts[i]++;
      });
    });

    const total = record.flavorTags.length;
    for (let i = 0; i < 3; i++) {
      if (counts[i] > 0) {
        const tagWeight = 1 + (counts[i] / total) * 4; // 1-5 scale
        newVector[7 + i] = Math.max(1, Math.min(5, newVector[7 + i] + (tagWeight - newVector[7 + i]) * Math.abs(weight)));
      }
    }
  }

  return newVector;
}
