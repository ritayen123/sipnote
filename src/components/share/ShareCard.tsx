"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { User, DrinkRecord } from "../../lib/types";
import TasteRadar from "../profile/TasteRadar";
import Button from "../ui/Button";
import {
  CocktailIcon,
  ShareIcon,
  DownloadIcon,
  XIcon,
  CheckIcon,
  StarIcon,
} from "../ui/Icons";
import Modal from "../ui/Modal";

interface ShareCardProps {
  type: "record" | "bar" | "taste_profile";
  user: User;
  record?: DrinkRecord;
  barName?: string;
  barDrinkCount?: number;
  onClose: () => void;
}

const STYLE_TEMPLATES = [
  {
    id: "deep-blue",
    label: "深藍",
    gradient: "from-[#1a1a2e] to-[#16213e]",
    accent: "#4fc3f7",
    bgColor: "#1a1a2e",
  },
  {
    id: "dark-red",
    label: "暗紅",
    gradient: "from-[#2d1117] to-[#3b1a25]",
    accent: "#e57373",
    bgColor: "#2d1117",
  },
  {
    id: "neon",
    label: "霓虹",
    gradient: "from-[#0d0d2b] to-[#1a0a2e]",
    accent: "#b388ff",
    bgColor: "#0d0d2b",
  },
  {
    id: "minimal",
    label: "極簡",
    gradient: "from-[#1c1c1c] to-[#2a2a2a]",
    accent: "#d4a053",
    bgColor: "#1c1c1c",
  },
] as const;

export default function ShareCard({
  type,
  user,
  record,
  barName,
  barDrinkCount,
  onClose,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<"9:16" | "1:1">("9:16");
  const [saving, setSaving] = useState(false);
  const [styleIdx, setStyleIdx] = useState(0);

  const currentStyle = STYLE_TEMPLATES[styleIdx];

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: currentStyle.bgColor,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (err) {
      console.error("Share card generation failed:", err);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: currentStyle.bgColor,
      });
      const link = document.createElement("a");
      link.download = `sipnote-${type}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Share card generation failed:", err);
    }
    setSaving(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      setSaving(true);
      const blob = await generateImage();
      if (blob) {
        const file = new File([blob], `sipnote-${type}-${Date.now()}.png`, {
          type: "image/png",
        });
        try {
          await navigator.share({
            title: "SipNote - 我的調酒記錄",
            files: [file],
          });
        } catch (err) {
          // User cancelled or share failed — fall back to download
          if ((err as Error).name !== "AbortError") {
            await handleDownload();
          }
        }
      }
      setSaving(false);
    } else {
      // Fallback: download
      await handleDownload();
    }
  };

  const cardWidth = ratio === "1:1" ? 360 : 270;
  const cardHeight = ratio === "1:1" ? 360 : 480;

  return (
    <Modal open={true} onClose={onClose}>
        {/* Ratio toggle */}
        <div className="flex gap-2 mb-3">
          <Button
            variant={ratio === "9:16" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setRatio("9:16")}
          >
            Stories 9:16
          </Button>
          <Button
            variant={ratio === "1:1" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setRatio("1:1")}
          >
            Feed 1:1
          </Button>
        </div>

        {/* Style templates */}
        <div className="flex gap-2 mb-4">
          {STYLE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={tmpl.id}
              onClick={() => setStyleIdx(idx)}
              className={`
                relative flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200
                bg-gradient-to-br ${tmpl.gradient} border
                ${
                  idx === styleIdx
                    ? "border-white/40 ring-1 ring-white/20"
                    : "border-white/10 opacity-60 hover:opacity-80"
                }
              `}
              style={{ color: tmpl.accent }}
            >
              {tmpl.label}
              {idx === styleIdx && (
                <span className="absolute -top-1 -right-1">
                  <CheckIcon size={12} color={tmpl.accent} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Card preview */}
        <div className="flex justify-center mb-4">
          <div
            ref={cardRef}
            style={{ width: cardWidth, height: cardHeight }}
            className={`bg-gradient-to-br ${currentStyle.gradient} rounded-2xl p-5 flex flex-col justify-between text-white overflow-hidden relative`}
          >
            {/* Background decoration */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl"
              style={{ backgroundColor: `${currentStyle.accent}18` }}
            />
            <div
              className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl"
              style={{ backgroundColor: `${currentStyle.accent}0d` }}
            />

            {/* Content */}
            <div className="relative z-10">
              {type === "record" && record && (
                <>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: currentStyle.accent }}
                  >
                    今晚喝了
                  </p>
                  <h3 className="text-xl font-bold mb-1">
                    {record.cocktailName}
                  </h3>
                  {record.barName && (
                    <p className="text-white/60 text-sm">
                      @ {record.barName}
                    </p>
                  )}
                  <div className="flex mt-3 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon
                        key={s}
                        size={18}
                        color={s <= record.overallRating ? "#fbbf24" : "rgba(255,255,255,0.2)"}
                        filled={s <= record.overallRating}
                      />
                    ))}
                  </div>
                  {record.flavorTags && record.flavorTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {record.flavorTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-white/10 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {type === "bar" && (
                <>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: currentStyle.accent }}
                  >
                    今晚在
                  </p>
                  <h3 className="text-xl font-bold mb-1">{barName}</h3>
                  <p className="text-white/60 text-sm">
                    喝了 {barDrinkCount} 杯
                  </p>
                </>
              )}

              {type === "taste_profile" && (
                <>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: currentStyle.accent }}
                  >
                    我的口味圖譜
                  </p>
                  <TasteRadar
                    vector={user.tasteVector}
                    size={ratio === "1:1" ? 200 : 250}
                  />
                  <p className="text-white/60 text-sm text-center">
                    已記錄 {user.recordCount} 杯調酒
                  </p>
                </>
              )}
            </div>

            {/* Footer: Logo */}
            <div className="relative z-10 flex items-center gap-2 mt-auto pt-3">
              <CocktailIcon size={20} color={currentStyle.accent} />
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: currentStyle.accent }}
                >
                  SipNote
                </p>
                <p className="text-[10px] text-white/40">
                  每一杯，都讓你更了解自己
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            fullWidth
            onClick={handleShare}
            disabled={saving}
            className="flex items-center justify-center gap-2"
          >
            <ShareIcon size={18} />
            {saving ? "生成中..." : "分享"}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={handleDownload}
            disabled={saving}
            className="flex items-center justify-center gap-2"
          >
            <DownloadIcon size={18} />
            下載圖片
          </Button>
          <Button
            fullWidth
            variant="ghost"
            onClick={onClose}
            className="flex items-center justify-center gap-2"
          >
            <XIcon size={16} />
            關閉
          </Button>
        </div>
    </Modal>
  );
}
