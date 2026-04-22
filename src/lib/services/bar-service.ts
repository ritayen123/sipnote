import { db } from "../db";
import type { Bar } from "../types";
import { v4 as uuidv4 } from "uuid";

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
}

export const barService = {
  async create(data: { name: string; address?: string; city?: string; googlePlaceId?: string }): Promise<Bar> {
    // Check if bar with same googlePlaceId already exists
    if (data.googlePlaceId) {
      const existing = await db.bars.where("googlePlaceId").equals(data.googlePlaceId).first();
      if (existing) return existing;
    }

    const bar: Bar = {
      id: uuidv4(),
      name: data.name,
      address: data.address,
      city: data.city,
      googlePlaceId: data.googlePlaceId,
      reviewCount: 0,
      createdBy: data.googlePlaceId ? "google_api" : "user",
    };
    await db.bars.add(bar);
    return bar;
  },

  async getAll(): Promise<Bar[]> {
    return db.bars.toArray();
  },

  async getById(id: string): Promise<Bar | undefined> {
    return db.bars.get(id);
  },

  async search(query: string): Promise<Bar[]> {
    const q = query.toLowerCase();
    const all = await db.bars.toArray();
    return all.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q))
    );
  },

  async updateStats(
    barId: string,
    ambiance: number,
    service: number,
    food: number
  ): Promise<void> {
    const bar = await db.bars.get(barId);
    if (!bar) return;

    const count = bar.reviewCount + 1;
    const avg = (prev: number | undefined, val: number) =>
      prev ? (prev * bar.reviewCount + val) / count : val;

    await db.bars.update(barId, {
      avgAmbiance: avg(bar.avgAmbiance, ambiance),
      avgService: avg(bar.avgService, service),
      avgFood: avg(bar.avgFood, food),
      reviewCount: count,
    });
  },

  async searchGooglePlaces(query: string): Promise<GooglePlaceResult[]> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey || !query.trim()) return [];

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.addressComponents",
          },
          body: JSON.stringify({
            textQuery: query + " bar",
            languageCode: "zh-TW",
            locationBias: {
              circle: {
                center: { latitude: 25.033, longitude: 121.565 }, // Taipei
                radius: 50000,
              },
            },
            maxResultCount: 5,
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.places) return [];

      return data.places.map((place: { id: string; displayName?: { text: string }; formattedAddress?: string; addressComponents?: { types: string[]; longText: string }[] }) => {
        const city = place.addressComponents?.find(
          (c: { types: string[] }) => c.types.includes("administrative_area_level_1")
        )?.longText || "";

        return {
          placeId: place.id,
          name: place.displayName?.text || "",
          address: place.formattedAddress || "",
          city,
        };
      });
    } catch {
      return [];
    }
  },
};
