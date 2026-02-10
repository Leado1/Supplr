-- CreateTable
CREATE TABLE "notification_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_states_userId_notificationId_key" ON "notification_states"("userId", "notificationId");

-- CreateIndex
CREATE INDEX "notification_states_userId_deleted_idx" ON "notification_states"("userId", "deleted");

-- AddForeignKey
ALTER TABLE "notification_states" ADD CONSTRAINT "notification_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
