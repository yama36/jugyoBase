-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('elementary', 'middle', 'high', 'special');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'teacher');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('comment', 'like', 'mention');

-- AlterTable: Tenant に学校種別・都道府県・タイムゾーンを追加
ALTER TABLE "Tenant" ADD COLUMN "schoolType" "SchoolType" NOT NULL DEFAULT 'elementary';
ALTER TABLE "Tenant" ADD COLUMN "prefecture" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo';

-- AlterTable: User にロール・担当情報・プロフィールを追加
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'teacher';
ALTER TABLE "User" ADD COLUMN "subjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "grades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "position" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;

-- AlterTable: Post にカリキュラム紐付け・時数・自己評価・下書きを追加
ALTER TABLE "Post" ADD COLUMN "curriculumUnitId" TEXT;
ALTER TABLE "Post" ADD COLUMN "lessonNumber" INTEGER;
ALTER TABLE "Post" ADD COLUMN "totalLessons" INTEGER;
ALTER TABLE "Post" ADD COLUMN "selfEvaluation" INTEGER;
ALTER TABLE "Post" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: CurriculumUnit に Post リレーション用の外部キーは Post 側に追加済み

-- CreateTable: Comment
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PostLike
CREATE TABLE "PostLike" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable: Bookmark
CREATE TABLE "Bookmark" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable: Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "postId" TEXT,
    "actorId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_curriculumUnitId_idx" ON "Post"("curriculumUnitId");

-- CreateIndex
CREATE INDEX "Post_tenantId_isPublished_idx" ON "Post"("tenantId", "isPublished");

-- AddForeignKey: Comment -> Post
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Comment -> User
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PostLike -> Post
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PostLike -> User
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Bookmark -> Post
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Bookmark -> User
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification -> User
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification -> Post
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Post -> CurriculumUnit
ALTER TABLE "Post" ADD CONSTRAINT "Post_curriculumUnitId_fkey" FOREIGN KEY ("curriculumUnitId") REFERENCES "CurriculumUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
