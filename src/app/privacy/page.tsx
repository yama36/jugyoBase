import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー — jugyoBase",
  description:
    "jugyoBase（授業実践の共有サービス）における個人情報等の取り扱いについて説明します。",
};

const sectionTitle = "text-lg font-semibold text-zinc-900";
const prose = "mt-3 text-sm leading-7 text-zinc-600";
const list = "mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <article>
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-700">Privacy</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            プライバシーポリシー
          </h1>
          <p className={`${prose} mt-3`}>
            jugyoBase（以下「本サービス」）の運営者は、ユーザーの皆さまの個人情報および本サービスに関連して取り扱う情報の重要性を認識し、適切に保護・管理します。本ポリシーは、本サービスの利用にあたって収集・利用する情報とその目的、第三者提供、安全管理、お問い合わせ窓口等を定めます。
          </p>
          <p className={`${prose} mt-3 text-xs text-zinc-500`}>
            制定日: 2026年5月13日
          </p>
        </header>

        <div className="mt-10 space-y-10">
        <section>
          <h2 className={sectionTitle}>1. 適用範囲</h2>
          <p className={prose}>
            本ポリシーは、本サービス（学校単位のクローズドな授業実践の共有）の提供およびこれに付随する画面・API・お問い合わせフォームに適用されます。本サービス外のウェブサイトや第三者サービス（例: Google
            の認証画面）については、各提供者の規約・ポリシーが適用されます。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>2. 取得する情報</h2>
          <p className={prose}>
            本サービスの性質上、次のような情報を、利用に必要な範囲で取得・生成・記録することがあります。
          </p>
          <ul className={list}>
            <li>
              <strong className="font-medium text-zinc-800">アカウント・認証</strong>
              ：Google アカウントによるログインに伴い、メールアドレス、表示名、プロフィール画像の
              URL、メール確認日時等を取得します。OAuth 連携に伴うトークン類は認証ライブラリの仕様に従い安全に保管されます。
            </li>
            <li>
              <strong className="font-medium text-zinc-800">学校（テナント）情報</strong>
              ：所属校の識別子・名称・スラッグ、運用設定としての学校種別・都道府県・タイムゾーン、Google
              の hosted domain 制限に用いるドメイン設定（設定されている場合）等。
            </li>
            <li>
              <strong className="font-medium text-zinc-800">プロフィール・利用行為</strong>
              ：プロフィール文、役職、担当教科・学年、投稿・コメント・いいね・ブックマーク・通知の履歴、投稿に紐づく検索用テキスト等。
            </li>
            <li>
              <strong className="font-medium text-zinc-800">添付ファイル</strong>
              ：投稿に添付された資料（PDF・スライド・画像・動画等）のファイル名、形式、サイズ、保存先キー、マルウェア検査の状態等。ファイル本体はオブジェクトストレージ（S3
              互換）上に保存されます。
            </li>
            <li>
              <strong className="font-medium text-zinc-800">技術情報</strong>
              ：セッション Cookie 等によるログイン状態の維持、サーバーログに含まれるアクセス日時、IP
              アドレス、ユーザーエージェント等（運用・セキュリティのために必要な範囲）。
            </li>
            <li>
              <strong className="font-medium text-zinc-800">お問い合わせ</strong>
              ：お問い合わせフォームに入力された氏名、メールアドレス、内容、任意項目、送信元の識別子等。これらは運営の問い合わせ管理システムに送信・記録されます。
            </li>
          </ul>
        </section>

        <section>
          <h2 className={sectionTitle}>3. 利用目的</h2>
          <p className={prose}>取得した情報は、次の目的の範囲内で利用します。</p>
          <ul className={list}>
            <li>本サービスの提供・認証・権限管理（学校ごとのデータ分離を含む）</li>
            <li>投稿・検索・通知・プロフィール表示など、サービス機能の実現</li>
            <li>不正利用の防止、セキュリティ確保、障害対応・品質改善</li>
            <li>お問い合わせへの対応、重要なお知らせの連絡</li>
            <li>法令に基づく対応、紛争対応</li>
          </ul>
        </section>

        <section>
          <h2 className={sectionTitle}>4. 第三者提供・委託</h2>
          <p className={prose}>
            次の場合を除き、個人情報を第三者に提供することはありません。ただし、統計情報等の個人を識別できない形式での提供はこの限りではありません。
          </p>
          <ul className={list}>
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく開示請求等がある場合</li>
            <li>
              人の生命、身体または財産の保護のために必要で、本人の同意を得ることが困難である場合
            </li>
          </ul>
          <p className={prose}>
            本サービスの提供にあたり、ホスティング、データベース、オブジェクトストレージ、認証（Google）、問い合わせ管理などの外部サービスを利用する場合があります。この場合、運営者は委託先の選定と必要な契約・監督を行います。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>5. 保存期間</h2>
          <p className={prose}>
            個人情報および利用記録は、利用目的の達成に必要な期間保存します。アカウント削除や退会手続きが行われた場合、または保存が不要となった場合は、法令の定めに従い、合理的な期間内に削除または匿名化します。具体的な保存期間は、学校・契約・運用方針により異なる場合があります。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>6. セキュリティ</h2>
          <p className={prose}>
            運営者は、不正アクセス、漏えい、改ざん、滅失等を防止するため、アクセス制御、通信の暗号化、権限管理、依存ライブラリの更新等、技術的・組織的安全管理措置に努めます。添付ファイルについては、設定に応じてマルウェア検査を行う場合があります。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>7. Cookie 等</h2>
          <p className={prose}>
            本サービスは、ログイン状態の維持等に Cookie 等を使用することがあります。ブラウザの設定により
            Cookie を無効化した場合、一部機能が利用できないことがあります。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>8. 開示・訂正・利用停止等</h2>
          <p className={prose}>
            個人情報保護法その他の法令に定める開示、訂正・追加・削除、利用停止・消去、第三者提供の停止等の請求については、法令に従い対応します。手続きは
            <Link href="/contact" className="text-sky-700 underline-offset-2 hover:underline">
              お問い合わせ
            </Link>
            よりご連絡ください。本人確認のため、追加の情報をお願いする場合があります。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>9. 未成年者</h2>
          <p className={prose}>
            本サービスは主として教育現場の利用を想定しています。保護者・学校の方針に従い、必要に応じて法定代理人の同意や校内手続きを経たうえでご利用ください。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>10. 本ポリシーの変更</h2>
          <p className={prose}>
            法令の改正やサービス内容の変更等に応じ、本ポリシーを改定することがあります。改定後は本ページに掲載した時点から効力を生じるものとし、重要な変更がある場合は、本サービス上の通知その他合理的な方法でお知らせします。
          </p>
        </section>

        <section>
          <h2 className={sectionTitle}>11. お問い合わせ窓口</h2>
          <p className={prose}>
            本ポリシーまたは個人情報の取り扱いに関するお問い合わせは、
            <Link href="/contact" className="text-sky-700 underline-offset-2 hover:underline">
              お問い合わせフォーム
            </Link>
            からご連絡ください。
          </p>
        </section>
        </div>
      </article>
    </div>
  );
}
