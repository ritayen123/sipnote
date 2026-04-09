import { db } from "../db";
import type { DrinkRecord } from "../types";
import { v4 as uuidv4 } from "uuid";
import { userService } from "./user-service";
import { updateTasteVector } from "../recommendation/vector";

export const recordService = {
  async create(
    data: Omit<DrinkRecord, "id" | "userId" | "recordedAt" | "isPublic">
  ): Promise<{ record: DrinkRecord; unlockedFeature: string | null }> {
    const user = await userService.getCurrentUser();
    if (!user) throw new Error("請先登入");

    if (!data.overallRating || data.overallRating < 1 || data.overallRating > 5) {
      throw new Error("請給予 1-5 星評分");
    }

    const record: DrinkRecord = {
      ...data,
      id: uuidv4(),
      userId: user.id,
      recordedAt: new Date().toISOString(),
      isPublic: false,
    };

    try {
      await db.records.add(record);
    } catch {
      throw new Error("記錄儲存失敗，請再試一次");
    }

    // Update taste vector based on rating
    try {
      if (record.overallRating !== 3) {
        const newVector = updateTasteVector(user.tasteVector, record);
        await userService.updateTasteVector(newVector);
      }
    } catch {
      // Non-critical: vector update failure shouldn't block record creation
    }

    const unlockedFeature = await userService.incrementRecordCount();

    return { record, unlockedFeature };
  },

  async getAll(): Promise<DrinkRecord[]> {
    try {
      const user = await userService.getCurrentUser();
      if (!user) return [];
      const all = await db.records
        .where("userId")
        .equals(user.id)
        .reverse()
        .sortBy("recordedAt");
      return all.filter((r) => !r.isDeleted);
    } catch {
      return [];
    }
  },

  async softDelete(id: string): Promise<void> {
    try {
      await db.records.update(id, { isDeleted: true });
    } catch {
      // silent
    }
  },

  async restore(id: string): Promise<void> {
    try {
      await db.records.update(id, { isDeleted: false });
    } catch {
      // silent
    }
  },

  async getById(id: string): Promise<DrinkRecord | undefined> {
    try {
      return db.records.get(id);
    } catch {
      return undefined;
    }
  },

  async toggleVisibility(id: string): Promise<void> {
    const record = await db.records.get(id);
    if (record) {
      await db.records.update(id, { isPublic: !record.isPublic });
    }
  },

  async getCount(): Promise<number> {
    try {
      const user = await userService.getCurrentUser();
      if (!user) return 0;
      return db.records.where("userId").equals(user.id).count();
    } catch {
      return 0;
    }
  },

  async getByBarId(barId: string): Promise<DrinkRecord[]> {
    try {
      const user = await userService.getCurrentUser();
      if (!user) return [];
      return db.records
        .where(["userId", "barId"])
        .equals([user.id, barId])
        .toArray();
    } catch {
      return [];
    }
  },
};
