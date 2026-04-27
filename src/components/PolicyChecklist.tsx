export function PolicyChecklist() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">投稿前の確認（児童生徒の保護）</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>顔が判別できる写真・動画は載せない（必要な場合はマスキングする）</li>
        <li>氏名・個人が特定される情報は載せない</li>
        <li>保護者同意のない肖像・個人情報は載せない</li>
        <li>学校・地域のルールや指導要領に反しない内容にする</li>
      </ul>
      <p className="mt-3 text-xs text-amber-900/80">
        最終判断は校則・運用規程に従ってください。本チェックはシステム上の注意喚起です。
      </p>
    </div>
  );
}
