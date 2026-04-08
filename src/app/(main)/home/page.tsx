"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApp } from "../../../lib/context/AppContext";
import { recordService } from "../../../lib/services/record-service";
import { cocktailService } from "../../../lib/services/cocktail-service";
import { getComfortRecommendations } from "../../../lib/recommendation/engine";
import type { Cocktail, DrinkRecord } from "../../../lib/types";
import ProgressBar from "../../../components/ui/ProgressBar";
import StarRating from "../../../components/ui/StarRating";
import Button from "../../../components/ui/Button";
import TasteBars from "../../../components/ui/TasteBars";
import ShareCard from "../../../components/share/ShareCard";
import { getCocktailDescription, getBaseDescription } from "../../../lib/utils/cocktail-desc";
import { useRouter } from "next/navigation";
import {
  CocktailIcon,
  PlusCircleIcon,
  ShareIcon,
  ClipboardIcon,
  RefreshIcon,
  BarChartIcon,
  CompassIcon,
  MapPinIcon,
  getBaseColor,
} from "../../../components/ui/Icons";

const OCCASION_LABELS: Record<string, string> = {
  date: "約會",
  friends: "朋友聚會",
  solo: "獨飲",
  celebration: "慶祝",
  business: "商務",
};

const EXPLORE_CATEGORIES = [
  { label: "IBA經典", value: "IBA經典" },
  { label: "居酒屋", value: "居酒屋" },
  { label: "甜點系", value: "甜點系" },
  { label: "純飲威士忌", value: "純飲威士忌" },
  { label: "熱帶/Tiki", value: "熱帶Tiki" },
  { label: "清爽低酒精", value: "清爽低酒精" },
  { label: "經典改編", value: "經典改編" },
  { label: "咖啡系", value: "咖啡系" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HomePage() {
  const { user, refreshUser } = useApp();
  const router = useRouter();
  const [records, setRecords] = useState<DrinkRecord[]>([]);
  const [allRecommendations, setAllRecommendations] = useState<{ cocktail: Cocktail; similarity: number }[]>([]);
  const [recommendations, setRecommendations] = useState<{ cocktail: Cocktail; similarity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareRecord, setShareRecord] = useState<DrinkRecord | null>(null);

  // Single consolidated data load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      await refreshUser();
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const currentUser = user;
    let cancelled = false;
    async function load() {
      const [recs, cocktails] = await Promise.all([
        recordService.getAll(),
        cocktailService.getAll(),
      ]);
      if (cancelled) return;

      setRecords(recs);

      // Recommendations (cached in state, only recompute if user changes)
      const recordedIds = recs.map((r) => r.cocktailId);
      const reco = getComfortRecommendations(currentUser.tasteVector, cocktails, recordedIds);
      setAllRecommendations(reco);
      setRecommendations(reco.slice(0, 3));

      // Weekly favorite base spirit (resolve in same pass)
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekRecords = recs.filter((r) => new Date(r.recordedAt) >= weekAgo);
      const cocktailMap = new Map(cocktails.map((c) => [c.id, c]));
      const baseCounts: Record<string, number> = {};
      for (const r of weekRecords) {
        const c = cocktailMap.get(r.cocktailId);
        if (c) baseCounts[c.baseSpirit] = (baseCounts[c.baseSpirit] || 0) + 1;
      }
      const sorted = Object.entries(baseCounts).sort((a, b) => b[1] - a[1]);
      setWeeklyFavoriteBase(sorted[0]?.[0] || "---");

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id, user?.tasteVector]);

  const handleShuffle = useCallback(() => {
    const shuffled = shuffleArray(allRecommendations);
    setRecommendations(shuffled.slice(0, 3));
  }, [allRecommendations]);

  // Weekly drink count
  const weeklyCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return records.filter((r) => new Date(r.recordedAt) >= weekAgo).length;
  }, [records]);

  const [weeklyFavoriteBase, setWeeklyFavoriteBase] = useState("---");

  if (loading || !user) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-bg-card rounded animate-pulse" />
            <div className="h-7 w-28 bg-bg-card rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-9 bg-bg-card rounded-full animate-pulse" />
        </div>
        <div className="h-16 bg-bg-card rounded-xl animate-pulse" />
        <div className="h-20 bg-bg-card rounded-2xl animate-pulse" />
        <div className="h-5 w-20 bg-bg-card rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-safe-top py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-text-muted text-sm">歡迎回來</p>
          <h1 className="text-2xl font-bold">{user.username}</h1>
        </div>
        <CocktailIcon size={32} className="text-accent" />
      </div>

      {/* Weekly Stats Card */}
      <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
        <div className="bg-accent/10 rounded-lg p-2 shrink-0">
          <BarChartIcon size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-muted">本週統計</p>
          <p className="font-semibold">
            {weeklyCount} 杯
            {weeklyFavoriteBase !== "---" && (
              <span className="text-text-secondary font-normal">
                {" "}· 最愛基酒：
                <span
                  className="font-medium"
                  style={{ color: getBaseColor(weeklyFavoriteBase) }}
                >
                  {weeklyFavoriteBase}
                </span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-bg-card rounded-2xl p-4">
        <ProgressBar
          current={user.recordCount}
          milestones={[1, 5, 10, 25, 50]}
          label="記錄進度"
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">推薦給你</h2>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1 text-accent text-sm hover:opacity-80 active:scale-95 transition-all"
            >
              <RefreshIcon size={14} className="text-accent" />
              換一批
            </button>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <button
                key={rec.cocktail.id}
                onClick={() => router.push(`/record?cocktailId=${rec.cocktail.id}`)}
                className="w-full bg-bg-card rounded-xl p-4 text-left hover:border-accent border border-border transition-all active:scale-[0.99]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Base spirit color indicator */}
                    <div
                      className="w-1 h-10 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: getBaseColor(rec.cocktail.baseSpirit) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lg">{rec.cocktail.nameZh}</p>
                      <p className="text-text-muted text-sm">{rec.cocktail.nameEn}</p>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className="inline-block bg-accent/15 text-accent text-xs font-medium px-2.5 py-1 rounded-full">
                      {Math.round(rec.similarity * 100)}% 合口味
                    </span>
                  </div>
                </div>

                <p className="text-text-secondary text-sm mt-2 ml-3.5">
                  {getBaseDescription(rec.cocktail.baseSpirit)} · {getCocktailDescription(rec.cocktail)}
                </p>

                <div className="flex justify-between items-end mt-3 ml-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {rec.cocktail.flavorTags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-bg-input rounded-full text-text-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <TasteBars cocktail={rec.cocktail} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Explore Categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CompassIcon size={18} className="text-accent" />
          <h2 className="text-lg font-bold">探索</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {EXPLORE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => router.push(`/record?category=${encodeURIComponent(cat.value)}`)}
              className="shrink-0 px-4 py-2 rounded-full bg-bg-card border border-border text-sm font-medium text-text-primary hover:border-accent hover:text-accent transition-all active:scale-95"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Records */}
      {records.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">最近記錄</h2>
            {records.length > 5 && (
              <button
                onClick={() => router.push("/profile")}
                className="text-accent text-sm"
              >
                查看全部
              </button>
            )}
          </div>
          <div className="space-y-2">
            {records.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="bg-bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{record.cocktailName || "未知調酒"}</p>
                    {record.barName && (
                      <p className="text-text-muted text-sm flex items-center gap-1">
                        <MapPinIcon size={12} className="text-text-muted shrink-0" />
                        {record.barName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-text-muted text-xs">
                        {new Date(record.recordedAt).toLocaleDateString("zh-TW")}
                      </p>
                      {record.occasion && (
                        <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                          {OCCASION_LABELS[record.occasion] || record.occasion}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <StarRating value={record.overallRating} onChange={() => {}} readonly size="sm" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareRecord(record);
                      }}
                      className="text-text-muted hover:text-accent transition-colors p-1"
                      title="分享"
                    >
                      <ShareIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <div className="flex justify-center mb-4">
            <ClipboardIcon size={48} className="text-text-muted" />
          </div>
          <p className="text-lg">還沒有記錄</p>
          <p className="text-sm mt-1 mb-6">記錄你的第一杯調酒吧！</p>
          <Button onClick={() => router.push("/record")}>開始記錄</Button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => router.push("/record")}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all"
        aria-label="記錄一杯調酒"
      >
        <PlusCircleIcon size={28} color="#1a1a1a" />
      </button>

      {/* Share Modal */}
      {shareRecord && (
        <ShareCard
          type="record"
          user={user}
          record={shareRecord}
          onClose={() => setShareRecord(null)}
        />
      )}
    </div>
  );
}
