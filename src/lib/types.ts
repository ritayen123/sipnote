export interface Cocktail {
  id: string;
  nameEn: string;
  nameZh: string;
  category: string;
  baseSpirit: string;
  acidity: number;
  sweetness: number;
  bitterness: number;
  saltiness: number;
  strength: number;
  texture: "light" | "medium" | "heavy";
  temperatureFeel: "cool" | "neutral" | "warm";
  flavorTags: string[];
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
  onboardingVector: number[];
  tasteVector: number[];
  recordCount: number;
  unlockedFeatures: string[];
}

export interface DrinkRecord {
  id: string;
  userId: string;
  cocktailId: string;
  cocktailName?: string;
  barId?: string;
  barName?: string;
  recordedAt: string;
  overallRating: number;
  acidityRating?: number;
  sweetnessRating?: number;
  bitternessRating?: number;
  saltinessRating?: number;
  strengthRating?: number;
  texture?: "light" | "medium" | "heavy";
  temperatureFeel?: "cool" | "neutral" | "warm";
  flavorTags: string[];
  barAmbiance?: number;
  barService?: number;
  barFood?: number;
  musicLevel?: "quiet" | "moderate" | "loud";
  occasion?: "date" | "friends" | "solo" | "celebration" | "business";
  priceRange?: "<300" | "300-500" | "500-800" | "800+";
  photoUrl?: string;
  isPublic: boolean;
  isDeleted?: boolean;
}

export interface Bar {
  id: string;
  name: string;
  address?: string;
  city?: string;
  googlePlaceId?: string;
  avgAmbiance?: number;
  avgService?: number;
  avgFood?: number;
  reviewCount: number;
  createdBy: "google_api" | "user";
}

export interface OnboardingAnswer {
  q1: "sour" | "middle" | "sweet" | "exploring";
  q2: "dislike" | "okay" | "like" | "unsure";
  q3: "mojito" | "whisky_sour" | "espresso_martini" | "none" | "all";
  q4: "smooth" | "middle" | "strong" | "any";
  q5: "light" | "middle" | "rich" | "exploring";
}

export type UnlockableFeature =
  | "taste_profile"
  | "taste_insights"
  | "explore_recommendations"
  | "full_report"
  | "bartender_card";

export const UNLOCK_MILESTONES: Record<number, UnlockableFeature> = {
  1: "taste_profile",
  5: "taste_insights",
  10: "explore_recommendations",
  25: "full_report",
  50: "bartender_card",
};

export const FLAVOR_CATEGORIES: Record<string, string[]> = {
  柑橘類: ["檸檬", "萊姆", "橙", "血橙", "葡萄柚", "柚子", "金桔"],
  果香類: ["草莓", "覆盆子", "藍莓", "黑醋栗", "蘋果", "梨", "桃子", "芒果", "百香果", "鳳梨", "荔枝", "椰子"],
  草本類: ["薄荷", "羅勒", "迷迭香", "百里香", "鼠尾草"],
  花香類: ["玫瑰", "薰衣草", "接骨木花", "茉莉", "橙花", "紫羅蘭"],
  辛香類: ["薑", "薑黃", "肉桂", "丁香", "八角", "豆蔻", "胡椒", "辣椒"],
  木質煙燻類: ["橡木", "雪松", "泥煤", "煙燻", "焦糖", "太妃糖", "香草"],
  烘焙堅果類: ["咖啡", "濃縮咖啡", "可可", "黑巧克力", "牛奶巧克力", "杏仁", "榛果", "花生"],
  奶香甜點類: ["鮮奶油", "奶油", "牛奶", "蛋糕", "餅乾", "焦糖布丁"],
  清新蔬菜類: ["黃瓜", "蘆薈", "西洋芹", "綠茶", "白茶", "抹茶", "伯爵茶"],
  特殊類: ["鹽味", "礦物質感", "海洋", "鹹鮮", "藥草", "苦艾", "龍膽"],
};

// Super-categories for vector dimensions 7-9
// dim 7: fruity/floral, dim 8: herbal/spice, dim 9: rich/dessert
export const FLAVOR_SUPER_CATEGORIES = {
  fruity: [
    ...FLAVOR_CATEGORIES["柑橘類"],
    ...FLAVOR_CATEGORIES["果香類"],
    ...FLAVOR_CATEGORIES["花香類"],
  ],
  herbal: [
    ...FLAVOR_CATEGORIES["草本類"],
    ...FLAVOR_CATEGORIES["辛香類"],
    ...FLAVOR_CATEGORIES["木質煙燻類"],
  ],
  rich: [
    ...FLAVOR_CATEGORIES["烘焙堅果類"],
    ...FLAVOR_CATEGORIES["奶香甜點類"],
    ...FLAVOR_CATEGORIES["特殊類"],
  ],
};
