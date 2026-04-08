"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "../../../lib/context/AppContext";
import { recordService } from "../../../lib/services/record-service";
import { userService } from "../../../lib/services/user-service";
import type { DrinkRecord } from "../../../lib/types";
import dynamic from "next/dynamic";
const TasteRadar = dynamic(() => import("../../../components/profile/TasteRadar"), {
  loading: () => <div className="h-[280px] bg-bg-input rounded-xl animate-pulse" />,
});
import TasteInsights from "../../../components/profile/TasteInsights";
import ProgressBar from "../../../components/ui/ProgressBar";
import StarRating from "../../../components/ui/StarRating";
import Button from "../../../components/ui/Button";
import ShareCard from "../../../components/share/ShareCard";
import {
  CocktailIcon,
  ShareIcon,
  HeartIcon,
  LockIcon,
  UnlockIcon,
  BarChartIcon,
} from "../../../components/ui/Icons";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useApp();
  const router = useRouter();
  const [records, setRecords] = useState<DrinkRecord[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      await refreshUser();
      const recs = await recordService.getAll();
      setRecords(recs);
      setLoading(false);
    }
    load();
  }, [refreshUser]);

  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const totalRecords = records.length;

    // Average rating
    const avgRating =
      records.reduce((sum, r) => sum + r.overallRating, 0) / totalRecords;

    // Most common flavor tag as proxy for base spirit preference
    const tagCounts: Record<string, number> = {};
    records.forEach((r) => {
      r.flavorTags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRecords,
      avgRating,
      topFlavorTag: topTag ? topTag[0] : null,
      topFlavorCount: topTag ? topTag[1] : 0,
    };
  }, [records]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-accent">
          <CocktailIcon size={48} />
        </div>
      </div>
    );
  }

  const hasProfile = user.unlockedFeatures.includes("taste_profile");
  const hasInsights = user.unlockedFeatures.includes("taste_insights");

  const milestones = [
    { count: 1, label: "口味圖譜", feature: "taste_profile" },
    { count: 5, label: "口味洞察", feature: "taste_insights" },
    { count: 10, label: "探索推薦", feature: "explore_recommendations" },
    { count: 25, label: "完整報告", feature: "full_report" },
    { count: 50, label: "調酒師卡片", feature: "bartender_card" },
  ];

  // Determine recently unlocked: features unlocked at the current record count
  const recentlyUnlockedFeatures = new Set(
    milestones
      .filter(
        (m) =>
          user.unlockedFeatures.includes(m.feature) &&
          user.recordCount >= m.count &&
          user.recordCount < m.count + 3
      )
      .map((m) => m.feature)
  );

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Avatar + Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 ring-2 ring-accent/30">
            <CocktailIcon size={28} color="var(--color-accent, #d4a053)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-text-muted text-sm">
              已記錄 {user.recordCount} 杯調酒
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                const data = await userService.exportData();
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `sipnote-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch { /* silent */ }
            }}
            className="text-text-muted text-sm hover:text-accent"
          >
            備份資料
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-text-muted text-sm hover:text-danger"
          >
            登出
          </button>
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="bg-bg-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChartIcon size={18} className="text-accent" />
            <h3 className="font-bold text-sm">飲酒統計</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {stats.totalRecords}
              </p>
              <p className="text-text-muted text-xs mt-0.5">總記錄</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-text-muted text-xs mt-0.5">平均評分</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-accent truncate">
                {stats.topFlavorTag || "--"}
              </p>
              <p className="text-text-muted text-xs mt-0.5">最愛風味</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-bg-card rounded-2xl p-4">
        <ProgressBar
          current={user.recordCount}
          milestones={[1, 5, 10, 25, 50]}
          label="記錄進度"
        />

        {/* Unlock Badges Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {milestones.map((m) => {
            const isUnlocked = user.unlockedFeatures.includes(m.feature);
            const isRecent = recentlyUnlockedFeatures.has(m.feature);
            const remaining = Math.max(0, m.count - user.recordCount);

            return (
              <div
                key={m.feature}
                className={`
                  relative rounded-xl p-3 border transition-all duration-300
                  ${
                    isUnlocked
                      ? "bg-accent/10 border-accent/30"
                      : "bg-bg-input border-border"
                  }
                  ${isRecent ? "animate-badge-glow" : ""}
                `}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 flex-shrink-0 ${
                      isUnlocked ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {isUnlocked ? (
                      <UnlockIcon size={16} />
                    ) : (
                      <LockIcon size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isUnlocked ? "text-text-primary" : "text-text-muted"
                      }`}
                    >
                      {m.label}
                    </p>
                    {!isUnlocked && (
                      <p className="text-xs text-text-muted mt-0.5">
                        再喝 {remaining} 杯解鎖
                      </p>
                    )}
                    {isUnlocked && (
                      <p className="text-xs text-accent/70 mt-0.5">
                        {m.count} 杯達成
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge glow animation */}
      <style jsx>{`
        @keyframes badgeGlow {
          0%,
          100% {
            box-shadow: 0 0 4px rgba(212, 160, 83, 0.2);
          }
          50% {
            box-shadow: 0 0 12px rgba(212, 160, 83, 0.4);
          }
        }
        :global(.animate-badge-glow) {
          animation: badgeGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Taste Radar */}
      {hasProfile && (
        <div className="bg-bg-card rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">口味圖譜</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5"
            >
              <ShareIcon size={16} />
              <span className="sr-only">分享</span>
            </Button>
          </div>
          <TasteRadar vector={user.tasteVector} />
        </div>
      )}

      {/* Taste Insights */}
      {hasInsights && (
        <TasteInsights vector={user.tasteVector} recordCount={user.recordCount} />
      )}

      {/* Records List */}
      {records.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">所有記錄</h3>
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {record.cocktailName || "未知調酒"}
                    </p>
                    {record.barName && (
                      <p className="text-text-muted text-sm">
                        {record.barName}
                      </p>
                    )}
                    <p className="text-text-muted text-xs mt-1">
                      {new Date(record.recordedAt).toLocaleDateString("zh-TW")}
                    </p>
                    {record.flavorTags && record.flavorTags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {record.flavorTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 bg-bg-input rounded-full text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleFavorite(record.id)}
                      className="p-1 transition-colors duration-200 hover:scale-110"
                      aria-label={
                        favorites.has(record.id) ? "取消收藏" : "加入收藏"
                      }
                    >
                      <HeartIcon
                        size={18}
                        filled={favorites.has(record.id)}
                        className={
                          favorites.has(record.id)
                            ? "text-red-400"
                            : "text-text-muted"
                        }
                      />
                    </button>
                    <StarRating
                      value={record.overallRating}
                      onChange={() => {}}
                      readonly
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareCard
          type="taste_profile"
          user={user}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
