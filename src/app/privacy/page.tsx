import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私權政策 — SipNote",
  description: "SipNote 隱私權政策",
};

export default function PrivacyPage() {
  return (
    <div className="px-6 py-10 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold text-accent">隱私權政策</h1>
      <p className="text-text-muted">最後更新：2026 年 4 月</p>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">1. 資料儲存方式</h2>
        <p className="text-text-secondary">
          SipNote 目前為純前端應用程式，所有資料（包含帳號、記錄、口味圖譜）皆儲存於您的瀏覽器本地儲存空間（IndexedDB），
          不會傳輸至任何伺服器。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">2. 我們收集的資料</h2>
        <ul className="list-disc list-inside text-text-secondary space-y-1">
          <li>您輸入的暱稱</li>
          <li>口味問卷回答</li>
          <li>調酒記錄（酒名、評分、酒吧名稱、照片）</li>
          <li>匿名使用事件（不包含個人識別資訊）</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">3. 資料安全</h2>
        <p className="text-text-secondary">
          由於資料儲存在您的裝置上，資料安全取決於您的瀏覽器安全設定。
          清除瀏覽器資料將永久刪除所有記錄。建議定期使用「備份資料」功能匯出資料。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">4. 第三方服務</h2>
        <p className="text-text-secondary">
          目前 SipNote 不使用任何第三方分析工具或廣告追蹤。未來若整合第三方服務（如 Google Places API），
          將另行告知並更新此政策。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">5. 您的權利</h2>
        <ul className="list-disc list-inside text-text-secondary space-y-1">
          <li>您可以隨時在個人頁面匯出所有資料</li>
          <li>您可以隨時清除瀏覽器資料來刪除所有記錄</li>
          <li>您的資料完全由您掌控</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">6. 聯絡我們</h2>
        <p className="text-text-secondary">
          如有任何隱私相關問題，請透過 APP 內的回饋管道聯繫我們。
        </p>
      </section>
    </div>
  );
}
