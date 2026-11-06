-- CreateTable
CREATE TABLE "tv_schedule" (
    "id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tv_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tv_schedule_day_of_week_idx" ON "tv_schedule"("day_of_week");

-- CreateIndex
CREATE INDEX "tv_schedule_time_idx" ON "tv_schedule"("time");
