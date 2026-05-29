-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'tried';

-- CreateTable
CREATE TABLE "PostTried" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostTried_pkey" PRIMARY KEY ("postId","userId")
);

-- AddForeignKey
ALTER TABLE "PostTried" ADD CONSTRAINT "PostTried_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTried" ADD CONSTRAINT "PostTried_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
