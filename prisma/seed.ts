import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

type CurriculumSeed = {
  schoolType: "junior_high";
  subject:
    | "国語"
    | "社会"
    | "数学"
    | "理科"
    | "音楽"
    | "美術"
    | "保健体育"
    | "技術"
    | "家庭"
    | "英語"
    | "道徳"
    | "学活"
    | "総合";
  grade: "1年" | "2年" | "3年";
  category?: string;
  name: string;
  aliases?: string[];
  sortOrder: number;
};

export const curriculumUnitSeeds: CurriculumSeed[] = [
  // 国語（学習指導要領解説の内容区分）
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "知識及び技能", name: "言葉の特徴や使い方に関する事項", sortOrder: 10 },
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "知識及び技能", name: "情報の扱い方に関する事項", sortOrder: 20 },
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "知識及び技能", name: "我が国の言語文化に関する事項", sortOrder: 30 },
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "思考力・判断力・表現力等", name: "A 話すこと・聞くこと", sortOrder: 40 },
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "思考力・判断力・表現力等", name: "B 書くこと", sortOrder: 50 },
  { schoolType: "junior_high", subject: "国語", grade: "1年", category: "思考力・判断力・表現力等", name: "C 読むこと", sortOrder: 60 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "知識及び技能", name: "言葉の特徴や使い方に関する事項", sortOrder: 10 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "知識及び技能", name: "情報の扱い方に関する事項", sortOrder: 20 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "知識及び技能", name: "我が国の言語文化に関する事項", sortOrder: 30 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "思考力・判断力・表現力等", name: "A 話すこと・聞くこと", sortOrder: 40 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "思考力・判断力・表現力等", name: "B 書くこと", sortOrder: 50 },
  { schoolType: "junior_high", subject: "国語", grade: "2年", category: "思考力・判断力・表現力等", name: "C 読むこと", sortOrder: 60 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "知識及び技能", name: "言葉の特徴や使い方に関する事項", sortOrder: 10 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "知識及び技能", name: "情報の扱い方に関する事項", sortOrder: 20 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "知識及び技能", name: "我が国の言語文化に関する事項", sortOrder: 30 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "思考力・判断力・表現力等", name: "A 話すこと・聞くこと", sortOrder: 40 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "思考力・判断力・表現力等", name: "B 書くこと", sortOrder: 50 },
  { schoolType: "junior_high", subject: "国語", grade: "3年", category: "思考力・判断力・表現力等", name: "C 読むこと", sortOrder: 60 },

  // 社会
  { schoolType: "junior_high", subject: "社会", grade: "1年", category: "地理的分野", name: "世界と日本の地域構成", sortOrder: 10 },
  { schoolType: "junior_high", subject: "社会", grade: "1年", category: "地理的分野", name: "世界の諸地域", sortOrder: 20 },
  { schoolType: "junior_high", subject: "社会", grade: "1年", category: "地理的分野", name: "日本の諸地域", sortOrder: 30 },
  { schoolType: "junior_high", subject: "社会", grade: "2年", category: "歴史的分野", name: "古代までの日本", sortOrder: 10 },
  { schoolType: "junior_high", subject: "社会", grade: "2年", category: "歴史的分野", name: "中世の日本", sortOrder: 20 },
  { schoolType: "junior_high", subject: "社会", grade: "2年", category: "歴史的分野", name: "近世の日本", sortOrder: 30 },
  { schoolType: "junior_high", subject: "社会", grade: "2年", category: "歴史的分野", name: "近代の日本と世界", sortOrder: 40 },
  { schoolType: "junior_high", subject: "社会", grade: "2年", category: "歴史的分野", name: "現代の日本と世界", sortOrder: 50 },
  { schoolType: "junior_high", subject: "社会", grade: "3年", category: "公民的分野", name: "私たちと現代社会", sortOrder: 10 },
  { schoolType: "junior_high", subject: "社会", grade: "3年", category: "公民的分野", name: "私たちと経済", sortOrder: 20 },
  { schoolType: "junior_high", subject: "社会", grade: "3年", category: "公民的分野", name: "私たちと政治", sortOrder: 30 },
  { schoolType: "junior_high", subject: "社会", grade: "3年", category: "公民的分野", name: "私たちと国際社会の諸課題", sortOrder: 40 },

  // 数学
  { schoolType: "junior_high", subject: "数学", grade: "1年", category: "第1学年の内容", name: "A 数と式", sortOrder: 10 },
  { schoolType: "junior_high", subject: "数学", grade: "1年", category: "第1学年の内容", name: "B 図形", sortOrder: 20 },
  { schoolType: "junior_high", subject: "数学", grade: "1年", category: "第1学年の内容", name: "C 関数", sortOrder: 30 },
  { schoolType: "junior_high", subject: "数学", grade: "1年", category: "第1学年の内容", name: "D データの活用", sortOrder: 40 },
  { schoolType: "junior_high", subject: "数学", grade: "2年", category: "第2学年の内容", name: "A 数と式", sortOrder: 10 },
  { schoolType: "junior_high", subject: "数学", grade: "2年", category: "第2学年の内容", name: "B 図形", sortOrder: 20 },
  { schoolType: "junior_high", subject: "数学", grade: "2年", category: "第2学年の内容", name: "C 関数", sortOrder: 30 },
  { schoolType: "junior_high", subject: "数学", grade: "2年", category: "第2学年の内容", name: "D データの活用", sortOrder: 40 },
  { schoolType: "junior_high", subject: "数学", grade: "3年", category: "第3学年の内容", name: "A 数と式", sortOrder: 10 },
  { schoolType: "junior_high", subject: "数学", grade: "3年", category: "第3学年の内容", name: "B 図形", sortOrder: 20 },
  { schoolType: "junior_high", subject: "数学", grade: "3年", category: "第3学年の内容", name: "C 関数", sortOrder: 30 },
  { schoolType: "junior_high", subject: "数学", grade: "3年", category: "第3学年の内容", name: "D データの活用", sortOrder: 40 },

  // 理科
  { schoolType: "junior_high", subject: "理科", grade: "1年", category: "第1分野", name: "エネルギー", sortOrder: 10 },
  { schoolType: "junior_high", subject: "理科", grade: "1年", category: "第1分野", name: "粒子", sortOrder: 20 },
  { schoolType: "junior_high", subject: "理科", grade: "1年", category: "第2分野", name: "生命", sortOrder: 30 },
  { schoolType: "junior_high", subject: "理科", grade: "1年", category: "第2分野", name: "地球", sortOrder: 40 },
  { schoolType: "junior_high", subject: "理科", grade: "2年", category: "第1分野", name: "エネルギー", sortOrder: 10 },
  { schoolType: "junior_high", subject: "理科", grade: "2年", category: "第1分野", name: "粒子", sortOrder: 20 },
  { schoolType: "junior_high", subject: "理科", grade: "2年", category: "第2分野", name: "生命", sortOrder: 30 },
  { schoolType: "junior_high", subject: "理科", grade: "2年", category: "第2分野", name: "地球", sortOrder: 40 },
  { schoolType: "junior_high", subject: "理科", grade: "3年", category: "第1分野", name: "エネルギー", sortOrder: 10 },
  { schoolType: "junior_high", subject: "理科", grade: "3年", category: "第1分野", name: "粒子", sortOrder: 20 },
  { schoolType: "junior_high", subject: "理科", grade: "3年", category: "第2分野", name: "生命", sortOrder: 30 },
  { schoolType: "junior_high", subject: "理科", grade: "3年", category: "第2分野", name: "地球", sortOrder: 40 },

  // 音楽
  { schoolType: "junior_high", subject: "音楽", grade: "1年", category: "音楽科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "音楽", grade: "1年", category: "音楽科の内容", name: "B 鑑賞", sortOrder: 20 },
  { schoolType: "junior_high", subject: "音楽", grade: "2年", category: "音楽科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "音楽", grade: "2年", category: "音楽科の内容", name: "B 鑑賞", sortOrder: 20 },
  { schoolType: "junior_high", subject: "音楽", grade: "3年", category: "音楽科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "音楽", grade: "3年", category: "音楽科の内容", name: "B 鑑賞", sortOrder: 20 },

  // 美術
  { schoolType: "junior_high", subject: "美術", grade: "1年", category: "美術科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "美術", grade: "1年", category: "美術科の内容", name: "B 鑑賞", sortOrder: 20 },
  { schoolType: "junior_high", subject: "美術", grade: "2年", category: "美術科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "美術", grade: "2年", category: "美術科の内容", name: "B 鑑賞", sortOrder: 20 },
  { schoolType: "junior_high", subject: "美術", grade: "3年", category: "美術科の内容", name: "A 表現", sortOrder: 10 },
  { schoolType: "junior_high", subject: "美術", grade: "3年", category: "美術科の内容", name: "B 鑑賞", sortOrder: 20 },

  // 保健体育
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "A 体つくり運動", sortOrder: 10 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "B 器械運動", sortOrder: 20 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "C 陸上競技", sortOrder: 30 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "D 水泳", sortOrder: 40 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "E 球技", sortOrder: 50 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "F 武道", sortOrder: 60 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "体育分野", name: "G ダンス", sortOrder: 70 },
  { schoolType: "junior_high", subject: "保健体育", grade: "1年", category: "保健分野", name: "健康な生活と疾病の予防", sortOrder: 80 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "A 体つくり運動", sortOrder: 10 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "B 器械運動", sortOrder: 20 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "C 陸上競技", sortOrder: 30 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "D 水泳", sortOrder: 40 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "E 球技", sortOrder: 50 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "F 武道", sortOrder: 60 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "体育分野", name: "G ダンス", sortOrder: 70 },
  { schoolType: "junior_high", subject: "保健体育", grade: "2年", category: "保健分野", name: "心身の機能の発達と心の健康", sortOrder: 80 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "A 体つくり運動", sortOrder: 10 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "B 器械運動", sortOrder: 20 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "C 陸上競技", sortOrder: 30 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "D 水泳", sortOrder: 40 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "E 球技", sortOrder: 50 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "F 武道", sortOrder: 60 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "体育分野", name: "G ダンス", sortOrder: 70 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "保健分野", name: "傷害の防止", sortOrder: 80 },
  { schoolType: "junior_high", subject: "保健体育", grade: "3年", category: "保健分野", name: "健康と環境", sortOrder: 90 },

  // 技術
  { schoolType: "junior_high", subject: "技術", grade: "1年", category: "技術分野", name: "A 材料と加工の技術", sortOrder: 10 },
  { schoolType: "junior_high", subject: "技術", grade: "1年", category: "技術分野", name: "B 生物育成の技術", sortOrder: 20 },
  { schoolType: "junior_high", subject: "技術", grade: "1年", category: "技術分野", name: "C エネルギー変換の技術", sortOrder: 30 },
  { schoolType: "junior_high", subject: "技術", grade: "1年", category: "技術分野", name: "D 情報の技術", sortOrder: 40 },
  { schoolType: "junior_high", subject: "技術", grade: "2年", category: "技術分野", name: "A 材料と加工の技術", sortOrder: 10 },
  { schoolType: "junior_high", subject: "技術", grade: "2年", category: "技術分野", name: "B 生物育成の技術", sortOrder: 20 },
  { schoolType: "junior_high", subject: "技術", grade: "2年", category: "技術分野", name: "C エネルギー変換の技術", sortOrder: 30 },
  { schoolType: "junior_high", subject: "技術", grade: "2年", category: "技術分野", name: "D 情報の技術", sortOrder: 40 },
  { schoolType: "junior_high", subject: "技術", grade: "3年", category: "技術分野", name: "A 材料と加工の技術", sortOrder: 10 },
  { schoolType: "junior_high", subject: "技術", grade: "3年", category: "技術分野", name: "B 生物育成の技術", sortOrder: 20 },
  { schoolType: "junior_high", subject: "技術", grade: "3年", category: "技術分野", name: "C エネルギー変換の技術", sortOrder: 30 },
  { schoolType: "junior_high", subject: "技術", grade: "3年", category: "技術分野", name: "D 情報の技術", sortOrder: 40 },

  // 家庭
  { schoolType: "junior_high", subject: "家庭", grade: "1年", category: "家庭分野", name: "A 家族・家庭生活", sortOrder: 10 },
  { schoolType: "junior_high", subject: "家庭", grade: "1年", category: "家庭分野", name: "B 衣食住の生活", sortOrder: 20 },
  { schoolType: "junior_high", subject: "家庭", grade: "1年", category: "家庭分野", name: "C 消費生活・環境", sortOrder: 30 },
  { schoolType: "junior_high", subject: "家庭", grade: "2年", category: "家庭分野", name: "A 家族・家庭生活", sortOrder: 10 },
  { schoolType: "junior_high", subject: "家庭", grade: "2年", category: "家庭分野", name: "B 衣食住の生活", sortOrder: 20 },
  { schoolType: "junior_high", subject: "家庭", grade: "2年", category: "家庭分野", name: "C 消費生活・環境", sortOrder: 30 },
  { schoolType: "junior_high", subject: "家庭", grade: "3年", category: "家庭分野", name: "A 家族・家庭生活", sortOrder: 10 },
  { schoolType: "junior_high", subject: "家庭", grade: "3年", category: "家庭分野", name: "B 衣食住の生活", sortOrder: 20 },
  { schoolType: "junior_high", subject: "家庭", grade: "3年", category: "家庭分野", name: "C 消費生活・環境", sortOrder: 30 },

  // 外国語（英語）
  { schoolType: "junior_high", subject: "英語", grade: "1年", category: "外国語科の内容", name: "聞くこと", sortOrder: 10 },
  { schoolType: "junior_high", subject: "英語", grade: "1年", category: "外国語科の内容", name: "読むこと", sortOrder: 20 },
  { schoolType: "junior_high", subject: "英語", grade: "1年", category: "外国語科の内容", name: "話すこと［やり取り］", sortOrder: 30 },
  { schoolType: "junior_high", subject: "英語", grade: "1年", category: "外国語科の内容", name: "話すこと［発表］", sortOrder: 40 },
  { schoolType: "junior_high", subject: "英語", grade: "1年", category: "外国語科の内容", name: "書くこと", sortOrder: 50 },
  { schoolType: "junior_high", subject: "英語", grade: "2年", category: "外国語科の内容", name: "聞くこと", sortOrder: 10 },
  { schoolType: "junior_high", subject: "英語", grade: "2年", category: "外国語科の内容", name: "読むこと", sortOrder: 20 },
  { schoolType: "junior_high", subject: "英語", grade: "2年", category: "外国語科の内容", name: "話すこと［やり取り］", sortOrder: 30 },
  { schoolType: "junior_high", subject: "英語", grade: "2年", category: "外国語科の内容", name: "話すこと［発表］", sortOrder: 40 },
  { schoolType: "junior_high", subject: "英語", grade: "2年", category: "外国語科の内容", name: "書くこと", sortOrder: 50 },
  { schoolType: "junior_high", subject: "英語", grade: "3年", category: "外国語科の内容", name: "聞くこと", sortOrder: 10 },
  { schoolType: "junior_high", subject: "英語", grade: "3年", category: "外国語科の内容", name: "読むこと", sortOrder: 20 },
  { schoolType: "junior_high", subject: "英語", grade: "3年", category: "外国語科の内容", name: "話すこと［やり取り］", sortOrder: 30 },
  { schoolType: "junior_high", subject: "英語", grade: "3年", category: "外国語科の内容", name: "話すこと［発表］", sortOrder: 40 },
  { schoolType: "junior_high", subject: "英語", grade: "3年", category: "外国語科の内容", name: "書くこと", sortOrder: 50 },

  // 特別の教科 道徳
  { schoolType: "junior_high", subject: "道徳", grade: "1年", category: "道徳の内容", name: "A 主として自分自身に関すること", sortOrder: 10 },
  { schoolType: "junior_high", subject: "道徳", grade: "1年", category: "道徳の内容", name: "B 主として人との関わりに関すること", sortOrder: 20 },
  { schoolType: "junior_high", subject: "道徳", grade: "1年", category: "道徳の内容", name: "C 主として集団や社会との関わりに関すること", sortOrder: 30 },
  { schoolType: "junior_high", subject: "道徳", grade: "1年", category: "道徳の内容", name: "D 主として生命や自然、崇高なものとの関わりに関すること", sortOrder: 40 },
  { schoolType: "junior_high", subject: "道徳", grade: "2年", category: "道徳の内容", name: "A 主として自分自身に関すること", sortOrder: 10 },
  { schoolType: "junior_high", subject: "道徳", grade: "2年", category: "道徳の内容", name: "B 主として人との関わりに関すること", sortOrder: 20 },
  { schoolType: "junior_high", subject: "道徳", grade: "2年", category: "道徳の内容", name: "C 主として集団や社会との関わりに関すること", sortOrder: 30 },
  { schoolType: "junior_high", subject: "道徳", grade: "2年", category: "道徳の内容", name: "D 主として生命や自然、崇高なものとの関わりに関すること", sortOrder: 40 },
  { schoolType: "junior_high", subject: "道徳", grade: "3年", category: "道徳の内容", name: "A 主として自分自身に関すること", sortOrder: 10 },
  { schoolType: "junior_high", subject: "道徳", grade: "3年", category: "道徳の内容", name: "B 主として人との関わりに関すること", sortOrder: 20 },
  { schoolType: "junior_high", subject: "道徳", grade: "3年", category: "道徳の内容", name: "C 主として集団や社会との関わりに関すること", sortOrder: 30 },
  { schoolType: "junior_high", subject: "道徳", grade: "3年", category: "道徳の内容", name: "D 主として生命や自然、崇高なものとの関わりに関すること", sortOrder: 40 },

  // 特別活動（学活）
  { schoolType: "junior_high", subject: "学活", grade: "1年", category: "学級活動", name: "(1) 学級や学校における生活づくりへの参画", sortOrder: 10 },
  { schoolType: "junior_high", subject: "学活", grade: "1年", category: "学級活動", name: "(2) 日常の生活や学習への適応と自己の成長及び健康安全", sortOrder: 20 },
  { schoolType: "junior_high", subject: "学活", grade: "1年", category: "学級活動", name: "(3) 一人一人のキャリア形成と自己実現", sortOrder: 30 },
  { schoolType: "junior_high", subject: "学活", grade: "2年", category: "学級活動", name: "(1) 学級や学校における生活づくりへの参画", sortOrder: 10 },
  { schoolType: "junior_high", subject: "学活", grade: "2年", category: "学級活動", name: "(2) 日常の生活や学習への適応と自己の成長及び健康安全", sortOrder: 20 },
  { schoolType: "junior_high", subject: "学活", grade: "2年", category: "学級活動", name: "(3) 一人一人のキャリア形成と自己実現", sortOrder: 30 },
  { schoolType: "junior_high", subject: "学活", grade: "3年", category: "学級活動", name: "(1) 学級や学校における生活づくりへの参画", sortOrder: 10 },
  { schoolType: "junior_high", subject: "学活", grade: "3年", category: "学級活動", name: "(2) 日常の生活や学習への適応と自己の成長及び健康安全", sortOrder: 20 },
  { schoolType: "junior_high", subject: "学活", grade: "3年", category: "学級活動", name: "(3) 一人一人のキャリア形成と自己実現", sortOrder: 30 },

  // 総合的な学習の時間（総合）
  { schoolType: "junior_high", subject: "総合", grade: "1年", category: "探究の過程", name: "課題の設定", sortOrder: 10 },
  { schoolType: "junior_high", subject: "総合", grade: "1年", category: "探究の過程", name: "情報の収集", sortOrder: 20 },
  { schoolType: "junior_high", subject: "総合", grade: "1年", category: "探究の過程", name: "整理・分析", sortOrder: 30 },
  { schoolType: "junior_high", subject: "総合", grade: "1年", category: "探究の過程", name: "まとめ・表現", sortOrder: 40 },
  { schoolType: "junior_high", subject: "総合", grade: "2年", category: "探究の過程", name: "課題の設定", sortOrder: 10 },
  { schoolType: "junior_high", subject: "総合", grade: "2年", category: "探究の過程", name: "情報の収集", sortOrder: 20 },
  { schoolType: "junior_high", subject: "総合", grade: "2年", category: "探究の過程", name: "整理・分析", sortOrder: 30 },
  { schoolType: "junior_high", subject: "総合", grade: "2年", category: "探究の過程", name: "まとめ・表現", sortOrder: 40 },
  { schoolType: "junior_high", subject: "総合", grade: "3年", category: "探究の過程", name: "課題の設定", sortOrder: 10 },
  { schoolType: "junior_high", subject: "総合", grade: "3年", category: "探究の過程", name: "情報の収集", sortOrder: 20 },
  { schoolType: "junior_high", subject: "総合", grade: "3年", category: "探究の過程", name: "整理・分析", sortOrder: 30 },
  { schoolType: "junior_high", subject: "総合", grade: "3年", category: "探究の過程", name: "まとめ・表現", sortOrder: 40 },
];

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    create: { id: randomUUID(), name: "デモ小学校", slug: "demo" },
    update: { name: "デモ小学校" },
  });

  const demoEmail = "demo-teacher@example.com";

  await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "デモ先生",
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
    update: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
  });

  await prisma.curriculumUnit.deleteMany({
    where: { schoolType: "junior_high" },
  });
  await prisma.curriculumUnit.createMany({
    data: curriculumUnitSeeds.map((row) => ({
      schoolType: row.schoolType,
      subject: row.subject,
      grade: row.grade,
      category: row.category ?? null,
      name: row.name,
      aliases: row.aliases ?? [],
      sortOrder: row.sortOrder,
      isActive: true,
    })),
  });

  console.log(
    "Seeded tenant slug=demo, user email=",
    demoEmail,
    "curriculumUnits=",
    curriculumUnitSeeds.length,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
