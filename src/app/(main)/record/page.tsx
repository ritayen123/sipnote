"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cocktailService } from "../../../lib/services/cocktail-service";
import { recordService } from "../../../lib/services/record-service";
import { barService as barSvc } from "../../../lib/services/bar-service";
import type { Cocktail } from "../../../lib/types";
import Button from "../../../components/ui/Button";
import StarRating from "../../../components/ui/StarRating";
import SliderInput from "../../../components/ui/SliderInput";
import FlavorTagPicker from "../../../components/ui/FlavorTagPicker";
import TasteBars from "../../../components/ui/TasteBars";
import PhotoUpload from "../../../components/ui/PhotoUpload";
import BarSearch from "../../../components/ui/BarSearch";
import { useApp } from "../../../lib/context/AppContext";
import { getCocktailDescription, getBaseDescription } from "../../../lib/utils/cocktail-desc";
import {
  CocktailIcon,
  ZapIcon,
  ClipboardIcon,
  CheckIcon,
  TrophyIcon,
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  getBaseColor,
  RefreshIcon,
} from "../../../components/ui/Icons";

const BASE_SPIRITS = [
  "全部",
  "Whiskey",
  "Gin",
  "Vodka",
  "Rum",
  "Tequila",
  "Brandy",
  "Multiple",
  "Champagne",
  "Wine",
  "Liqueur",
  "Beer",
  "Sake",
  "Shochu",
];

const PAGE_SIZE = 20;

function RecordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useApp();
  const preselectedId = searchParams.get("cocktailId");

  const [mode, setMode] = useState<"select" | "quick" | "full" | "done">("select");
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [allCocktails, setAllCocktails] = useState<Cocktail[]>([]);

  // Filters
  const [selectedBaseSpirit, setSelectedBaseSpirit] = useState("全部");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Record data
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);
  const [customName, setCustomName] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [acidityRating, setAcidityRating] = useState(0);
  const [sweetnessRating, setSweetnessRating] = useState(0);
  const [bitternessRating, setBitternessRating] = useState(0);
  const [saltinessRating, setSaltinessRating] = useState(0);
  const [strengthRating, setStrengthRating] = useState(0);
  const [texture, setTexture] = useState<"light" | "medium" | "heavy">("medium");
  const [temperatureFeel, setTemperatureFeel] = useState<"cool" | "neutral" | "warm">("neutral");
  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [barName, setBarName] = useState("");
  const [barGooglePlaceId, setBarGooglePlaceId] = useState<string | undefined>();
  const [barAmbiance, setBarAmbiance] = useState(3);
  const [barServiceRating, setBarServiceRating] = useState(3);
  const [barFood, setBarFood] = useState(3);

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const all = await cocktailService.getAll();
      setAllCocktails(all);
      if (preselectedId) {
        const c = all.find((c) => c.id === preselectedId);
        if (c) {
          setSelectedCocktail(c);
          setMode("select");
        }
      }
    }
    load();
  }, [preselectedId]);

  // Filtered results with category, base spirit, and search
  const filteredResults = useMemo(() => {
    let results = allCocktails;

    if (selectedBaseSpirit !== "全部") {
      results = results.filter((c) => c.baseSpirit === selectedBaseSpirit);
    }
    if (searchQuery.length > 0) {
      const lower = searchQuery.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
      results = results.filter((c) => {
        const nameNorm = c.nameEn.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nameZhNorm = c.nameZh.replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
        const baseNorm = c.baseSpirit.toLowerCase();
        const categoryNorm = c.category.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
        return (
          nameNorm.includes(lower) ||
          nameZhNorm.includes(searchQuery) ||
          baseNorm.includes(lower) ||
          categoryNorm.includes(lower) ||
          c.flavorTags.some((t) => t.includes(searchQuery))
        );
      });
    }

    return results;
  }, [allCocktails, selectedBaseSpirit, searchQuery]);

  const visibleResults = useMemo(
    () => filteredResults.slice(0, displayCount),
    [filteredResults, displayCount]
  );

  const hasMore = filteredResults.length > displayCount;

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setDisplayCount(PAGE_SIZE);
    // Auto-reset base spirit filter when typing search
    if (q.length > 0) {
      setSelectedBaseSpirit("全部");
    }
  }, []);

  const handleBaseSpiritChange = useCallback((spirit: string) => {
    setSelectedBaseSpirit(spirit);
    setDisplayCount(PAGE_SIZE);
  }, []);

  const handleSave = async () => {
    if (overallRating === 0) return;
    setSaving(true);

    let barId: string | undefined;
    if (barName.trim()) {
      const bar = await barSvc.create({ name: barName.trim(), googlePlaceId: barGooglePlaceId });
      barId = bar.id;
      if (mode === "full") {
        await barSvc.updateStats(bar.id, barAmbiance, barServiceRating, barFood);
      }
    }

    const recordData = {
      cocktailId: selectedCocktail?.id || "custom",
      cocktailName: selectedCocktail?.nameEn || customName || "自訂調酒",
      barId,
      barName: barName.trim() || undefined,
      overallRating,
      photoUrl,
      flavorTags: mode === "full" ? flavorTags : [],
      ...(mode === "full" && {
        acidityRating,
        sweetnessRating,
        bitternessRating,
        saltinessRating,
        strengthRating,
        texture,
        temperatureFeel,
        barAmbiance: barName ? barAmbiance : undefined,
        barService: barName ? barServiceRating : undefined,
        barFood: barName ? barFood : undefined,
        occasion: occasion as "date" | "friends" | "solo" | "celebration" | "business" | undefined,
        priceRange: priceRange as "<300" | "300-500" | "500-800" | "800+" | undefined,
      }),
    };

    const { unlockedFeature } = await recordService.create(recordData);
    await refreshUser();

    if (unlockedFeature) {
      setUnlocked(unlockedFeature);
    }

    setSaving(false);
    setMode("done");
  };

  // Reset all state for a new record
  const handleRecordAnother = () => {
    setSelectedCocktail(null);
    setCustomName("");
    setOverallRating(0);
    setAcidityRating(3);
    setSweetnessRating(3);
    setBitternessRating(3);
    setSaltinessRating(3);
    setStrengthRating(3);
    setTexture("medium");
    setTemperatureFeel("neutral");
    setFlavorTags([]);
    setOccasion("");
    setPriceRange("");
    setBarName("");
    setBarAmbiance(3);
    setBarServiceRating(3);
    setBarFood(3);
    setPhotoUrl(undefined);
    setStep(0);
    setUnlocked(null);
    setMode("select");
  };

  // ── Completion page ──
  if (mode === "done") {
    const featureNames: Record<string, string> = {
      taste_profile: "個人口味圖譜",
      taste_insights: "口味分析洞察",
      explore_recommendations: "探索推薦",
      full_report: "完整口味報告",
      bartender_card: "調酒師卡片",
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <CheckIcon size={32} color="var(--accent)" />
        </div>

        <h2 className="text-2xl font-bold mb-1">記錄完成</h2>

        {/* Cocktail summary */}
        <div className="bg-bg-card rounded-2xl p-5 border border-border w-full mt-4">
          <p className="text-text-muted text-xs mb-1">你喝了</p>
          <p className="text-lg font-semibold">
            {selectedCocktail?.nameEn || customName || "自訂調酒"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <StarRating value={overallRating} onChange={() => {}} size="sm" />
            <span className="text-text-muted text-sm">{overallRating}/5</span>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <RefreshIcon size={14} color="var(--accent)" />
            <span className="text-sm text-text-secondary">口味向量已更新</span>
          </div>
        </div>

        {/* Unlock celebration */}
        {unlocked && (
          <div className="bg-bg-card rounded-2xl p-5 border border-accent/40 w-full mt-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
              <TrophyIcon size={24} color="var(--accent)" />
            </div>
            <p className="text-sm text-text-muted mb-1">解鎖新功能</p>
            <p className="text-accent font-semibold text-lg">
              {featureNames[unlocked] || unlocked}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="w-full space-y-3 mt-8">
          <Button fullWidth size="lg" onClick={() => router.push("/home")}>
            回到首頁
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={handleRecordAnother}>
            繼續記錄
          </Button>
        </div>
      </div>
    );
  }

  // ── Step: Select cocktail ──
  if (!selectedCocktail && !customName && mode === "select") {
    return (
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold">記錄一杯調酒</h1>

        {/* Base spirit filter pills */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2 pb-1 w-max">
            {BASE_SPIRITS.map((spirit) => (
              <button
                key={spirit}
                onClick={() => handleBaseSpiritChange(spirit)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                  selectedBaseSpirit === spirit
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-card text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                {spirit !== "全部" && (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getBaseColor(spirit) }}
                  />
                )}
                {spirit === "全部" ? "全部基酒" : getBaseDescription(spirit).replace("基底", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜尋調酒名稱..."
            className="w-full pl-10 pr-4 py-3 bg-bg-input border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Results count */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <FilterIcon size={12} />
          <span>
            {filteredResults.length} 款調酒
            {selectedBaseSpirit !== "全部" && ` / ${getBaseDescription(selectedBaseSpirit).replace("基底", "")}`}
          </span>
        </div>

        {/* Results list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {visibleResults.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCocktail(c)}
              className="w-full bg-bg-card rounded-xl p-3.5 text-left border border-border hover:border-accent transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{c.nameEn}</p>
                  <p className="text-text-muted text-sm">{c.nameEn}</p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {getBaseDescription(c.baseSpirit)} · {c.category}
                  </p>
                </div>
                <TasteBars cocktail={c} />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.flavorTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 bg-bg-input rounded-full text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Show more button */}
        {hasMore && (
          <button
            onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
            className="w-full py-2.5 text-sm text-accent hover:text-accent/80 transition-colors border border-border rounded-xl bg-bg-card"
          >
            顯示更多（還有 {filteredResults.length - displayCount} 款）
          </button>
        )}

        {/* Custom cocktail input — moved to bottom */}
        <div className="pt-3 border-t border-border space-y-1.5">
          <p className="text-sm text-text-muted">喝了菜單上沒有的酒？</p>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="手動輸入酒名..."
            className="w-full px-4 py-3 bg-bg-input border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customName.trim()) {
                setMode("quick");
              }
            }}
          />
        </div>
      </div>
    );
  }

  // ── Mode selection ──
  if (mode === "select" && (selectedCocktail || customName)) {
    return (
      <div className="min-h-screen flex flex-col justify-center px-6 space-y-6">
        {/* Cocktail info card */}
        <div className="bg-bg-card rounded-2xl p-5 border border-border">
          <p className="text-text-muted text-xs mb-1">你選了</p>
          <h2 className="text-2xl font-bold">
            {selectedCocktail?.nameEn || customName}
          </h2>
          {selectedCocktail && (
            <>
              <p className="text-text-muted text-sm mt-0.5">{selectedCocktail.nameEn}</p>

              <p className="text-text-secondary text-sm mt-3">
                {getBaseDescription(selectedCocktail.baseSpirit)} · {selectedCocktail.category}
              </p>
              <p className="text-text-secondary text-sm mt-1">
                {getCocktailDescription(selectedCocktail)}
              </p>

              {/* Taste bars */}
              <div className="flex items-center gap-4 mt-4">
                <TasteBars cocktail={selectedCocktail} />
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {selectedCocktail.flavorTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-bg-input rounded-full text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-full space-y-3">
          <Button fullWidth size="lg" onClick={() => setMode("quick")}>
            <span className="inline-flex items-center gap-2">
              <ZapIcon size={18} />
              快速記錄（30秒）
            </span>
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => setMode("full")}>
            <span className="inline-flex items-center gap-2">
              <ClipboardIcon size={18} />
              完整記錄（2分鐘）
            </span>
          </Button>
        </div>
        <button
          onClick={() => {
            setSelectedCocktail(null);
            setCustomName("");
          }}
          className="inline-flex items-center gap-1 text-text-muted text-sm hover:text-text-secondary"
        >
          <ChevronLeftIcon size={16} />
          重新選擇
        </button>
      </div>
    );
  }

  // ── Quick mode ──
  if (mode === "quick") {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8">
        <h1 className="text-xl font-bold mb-2">
          {selectedCocktail?.nameEn || customName}
        </h1>
        <p className="text-text-muted text-sm mb-8">快速記錄</p>

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="text-center space-y-3">
            <p className="text-text-secondary">整體評分</p>
            <div className="flex justify-center">
              <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
            </div>
          </div>

          <BarSearch
            value={barName}
            onChange={(name, placeId) => {
              setBarName(name);
              setBarGooglePlaceId(placeId);
            }}
          />

          <div>
            <label className="text-sm text-text-secondary block mb-2">照片（選填）</label>
            <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
          </div>
        </div>

        <div className="space-y-3 mt-8">
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={overallRating === 0 || saving}
          >
            {saving ? "儲存中..." : "完成記錄"}
          </Button>
          <button
            onClick={() => setMode("select")}
            className="w-full inline-flex items-center justify-center gap-1 text-text-muted text-sm hover:text-text-secondary py-2"
          >
            <ChevronLeftIcon size={16} />
            返回
          </button>
        </div>
      </div>
    );
  }

  // ── Full mode - multi-step ──
  const fullSteps = [
    // Step 0: Rating + Photo
    <div key="rating" className="space-y-8">
      <div className="text-center space-y-3">
        <p className="text-text-secondary">整體評分</p>
        <div className="flex justify-center">
          <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
        </div>
      </div>
      <div className="text-center space-y-3">
        <p className="text-text-secondary">拍張照片（選填）</p>
        <div className="flex justify-center">
          <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
        </div>
      </div>
    </div>,

    // Step 1: Taste sliders
    <div key="taste" className="space-y-5">
      <SliderInput
        label="酸度"
        value={acidityRating}
        onChange={setAcidityRating}
        labels={["幾乎無酸，柔和", "明顯酸感，刺激"]}
      />
      <SliderInput
        label="甜度"
        value={sweetnessRating}
        onChange={setSweetnessRating}
        labels={["不甜，偏乾口", "甜蜜，甜點感"]}
      />
      <SliderInput
        label="苦度"
        value={bitternessRating}
        onChange={setBitternessRating}
        labels={["無苦味", "明顯苦韻，藥草感"]}
      />
      <SliderInput
        label="鹹度"
        value={saltinessRating}
        onChange={setSaltinessRating}
        labels={["無鹹味", "鹹鮮明顯"]}
      />
      <SliderInput
        label="烈度"
        value={strengthRating}
        onChange={setStrengthRating}
        labels={["順口，幾乎沒酒感", "酒感強烈，灼熱"]}
      />
    </div>,

    // Step 2: Flavor tags
    <div key="flavor">
      <FlavorTagPicker selected={flavorTags} onChange={setFlavorTags} />
    </div>,

    // Step 3: Texture & Temperature
    <div key="texture" className="space-y-6">
      <div>
        <p className="text-sm text-text-secondary mb-3">口感</p>
        <div className="flex gap-2">
          {(["light", "medium", "heavy"] as const).map((t) => (
            <Button
              key={t}
              variant={texture === t ? "primary" : "secondary"}
              onClick={() => setTexture(t)}
              className="flex-1"
            >
              {{ light: "輕盈", medium: "中等", heavy: "厚重" }[t]}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-text-secondary mb-3">溫度感</p>
        <div className="flex gap-2">
          {(["cool", "neutral", "warm"] as const).map((t) => (
            <Button
              key={t}
              variant={temperatureFeel === t ? "primary" : "secondary"}
              onClick={() => setTemperatureFeel(t)}
              className="flex-1"
            >
              {{ cool: "清涼", neutral: "中性", warm: "溫暖" }[t]}
            </Button>
          ))}
        </div>
      </div>
    </div>,

    // Step 4: Bar info
    <div key="bar" className="space-y-5">
      <BarSearch
        value={barName}
        onChange={(name, placeId) => {
          setBarName(name);
          setBarGooglePlaceId(placeId);
        }}
      />
      {barName && (
        <>
          <SliderInput label="環境" value={barAmbiance} onChange={setBarAmbiance} labels={["差", "優"]} />
          <SliderInput label="服務" value={barServiceRating} onChange={setBarServiceRating} labels={["差", "優"]} />
          <SliderInput label="餐食" value={barFood} onChange={setBarFood} labels={["差", "優"]} />
        </>
      )}
    </div>,

    // Step 5: Occasion & Price
    <div key="occasion" className="space-y-6">
      <div>
        <p className="text-sm text-text-secondary mb-3">場合</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "date", label: "約會" },
            { value: "friends", label: "朋友聚會" },
            { value: "solo", label: "獨飲" },
            { value: "celebration", label: "慶祝" },
            { value: "business", label: "商務" },
          ].map((o) => (
            <Button
              key={o.value}
              variant={occasion === o.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setOccasion(occasion === o.value ? "" : o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm text-text-secondary mb-3">價格區間（TWD）</p>
        <div className="flex flex-wrap gap-2">
          {["<300", "300-500", "500-800", "800+"].map((p) => (
            <Button
              key={p}
              variant={priceRange === p ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPriceRange(priceRange === p ? "" : p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
    </div>,
  ];

  const stepLabels = ["評分", "味覺", "風味", "口感", "酒吧", "場合"];

  return (
    <div className="min-h-screen flex flex-col px-6 py-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">
          {selectedCocktail?.nameEn || customName}
        </h1>
        <span className="text-sm text-text-muted">
          {step + 1}/{fullSteps.length}
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1 mb-6">
        {fullSteps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>

      <p className="text-text-muted text-sm mb-4">{stepLabels[step]}</p>

      {/* Step content */}
      <div className="flex-1">{fullSteps[step]}</div>

      {/* Navigation */}
      <div className="space-y-3 mt-6">
        {step < fullSteps.length - 1 ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && overallRating === 0}
          >
            下一步
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={overallRating === 0 || saving}
          >
            {saving ? "儲存中..." : "完成記錄"}
          </Button>
        )}
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : setMode("select"))}
          className="w-full inline-flex items-center justify-center gap-1 text-text-muted text-sm hover:text-text-secondary py-2"
        >
          <ChevronLeftIcon size={16} />
          {step > 0 ? "上一步" : "返回"}
        </button>
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <CocktailIcon size={48} className="animate-pulse text-accent" />
        </div>
      }
    >
      <RecordPageInner />
    </Suspense>
  );
}
