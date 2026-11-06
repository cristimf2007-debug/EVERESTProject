-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT,
    "role" VARCHAR(50) NOT NULL DEFAULT 'fan',
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "bio" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_reason" TEXT,
    "last_login" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "artist" VARCHAR(255) NOT NULL DEFAULT 'BIOXIC',
    "genre" VARCHAR(100) NOT NULL,
    "tags" JSONB,
    "lyrics" TEXT,
    "audio_url" TEXT,
    "cover_url" TEXT,
    "download_enabled" BOOLEAN NOT NULL DEFAULT true,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "serve_url" VARCHAR(500) NOT NULL,
    "original_filename" VARCHAR(255),
    "content_type" VARCHAR(100),
    "size" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "username" VARCHAR(100) NOT NULL DEFAULT 'Anonim',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "user_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Anonim',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "cover_url" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_comments" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "user_id" UUID,
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_likes" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subscribed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_content" (
    "id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live" (
    "id" UUID NOT NULL,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "current_track_id" UUID,
    "listeners" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_schedule" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "track_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radio" (
    "id" UUID NOT NULL,
    "is_playing" BOOLEAN NOT NULL DEFAULT false,
    "current_track_id" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "queue" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radio_listeners" (
    "id" UUID NOT NULL,
    "sid" VARCHAR(255) NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radio_listeners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_requests" (
    "id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "user_name" VARCHAR(255) NOT NULL DEFAULT 'Anonim',
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fan_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_subs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" VARCHAR(255) NOT NULL,
    "subscribed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_subs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" UUID NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "last_visit" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_users" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "banned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "banned_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muted_users" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT,
    "muted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "muted_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_bans" (
    "id" UUID NOT NULL,
    "ip" VARCHAR(100) NOT NULL,
    "reason" TEXT,
    "banned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "security_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "ip" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "user_email" VARCHAR(255),
    "description" TEXT,
    "ip" VARCHAR(100),
    "ts" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banned_names" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banned_names_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_identifier_key" ON "login_attempts"("identifier");

-- CreateIndex
CREATE INDEX "login_attempts_identifier_idx" ON "login_attempts"("identifier");

-- CreateIndex
CREATE INDEX "tracks_genre_idx" ON "tracks"("genre");

-- CreateIndex
CREATE INDEX "tracks_created_at_idx" ON "tracks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_path_key" ON "files"("storage_path");

-- CreateIndex
CREATE UNIQUE INDEX "files_serve_url_key" ON "files"("serve_url");

-- CreateIndex
CREATE INDEX "files_storage_path_idx" ON "files"("storage_path");

-- CreateIndex
CREATE INDEX "files_serve_url_idx" ON "files"("serve_url");

-- CreateIndex
CREATE INDEX "chat_created_at_idx" ON "chat"("created_at");

-- CreateIndex
CREATE INDEX "comments_track_id_idx" ON "comments"("track_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "reviews_is_approved_idx" ON "reviews"("is_approved");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");

-- CreateIndex
CREATE INDEX "videos_created_at_idx" ON "videos"("created_at");

-- CreateIndex
CREATE INDEX "video_comments_video_id_idx" ON "video_comments"("video_id");

-- CreateIndex
CREATE INDEX "video_comments_user_id_idx" ON "video_comments"("user_id");

-- CreateIndex
CREATE INDEX "video_likes_video_id_idx" ON "video_likes"("video_id");

-- CreateIndex
CREATE INDEX "video_likes_user_id_idx" ON "video_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_likes_video_id_user_id_key" ON "video_likes"("video_id", "user_id");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_created_at_idx" ON "announcements"("created_at");

-- CreateIndex
CREATE INDEX "contacts_is_read_idx" ON "contacts"("is_read");

-- CreateIndex
CREATE INDEX "contacts_created_at_idx" ON "contacts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_email_key" ON "newsletter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "site_content_key_key" ON "site_content"("key");

-- CreateIndex
CREATE UNIQUE INDEX "live_current_track_id_key" ON "live"("current_track_id");

-- CreateIndex
CREATE INDEX "live_is_live_idx" ON "live"("is_live");

-- CreateIndex
CREATE INDEX "live_schedule_start_time_idx" ON "live_schedule"("start_time");

-- CreateIndex
CREATE INDEX "live_schedule_end_time_idx" ON "live_schedule"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "radio_current_track_id_key" ON "radio"("current_track_id");

-- CreateIndex
CREATE UNIQUE INDEX "radio_listeners_sid_key" ON "radio_listeners"("sid");

-- CreateIndex
CREATE INDEX "radio_listeners_sid_idx" ON "radio_listeners"("sid");

-- CreateIndex
CREATE INDEX "song_requests_track_id_idx" ON "song_requests"("track_id");

-- CreateIndex
CREATE INDEX "song_requests_status_idx" ON "song_requests"("status");

-- CreateIndex
CREATE INDEX "fan_favorites_user_id_idx" ON "fan_favorites"("user_id");

-- CreateIndex
CREATE INDEX "fan_favorites_track_id_idx" ON "fan_favorites"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "fan_favorites_user_id_track_id_key" ON "fan_favorites"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "channel_subs_user_id_idx" ON "channel_subs"("user_id");

-- CreateIndex
CREATE INDEX "channel_subs_channel_id_idx" ON "channel_subs"("channel_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "visits_path_idx" ON "visits"("path");

-- CreateIndex
CREATE INDEX "banned_users_user_id_idx" ON "banned_users"("user_id");

-- CreateIndex
CREATE INDEX "muted_users_user_id_idx" ON "muted_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "security_bans_ip_key" ON "security_bans"("ip");

-- CreateIndex
CREATE INDEX "security_bans_ip_idx" ON "security_bans"("ip");

-- CreateIndex
CREATE INDEX "security_events_type_idx" ON "security_events"("type");

-- CreateIndex
CREATE INDEX "security_events_ip_idx" ON "security_events"("ip");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "security_events"("created_at");

-- CreateIndex
CREATE INDEX "activity_log_type_idx" ON "activity_log"("type");

-- CreateIndex
CREATE INDEX "activity_log_ts_idx" ON "activity_log"("ts");

-- CreateIndex
CREATE UNIQUE INDEX "banned_names_name_key" ON "banned_names"("name");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_identifier_fkey" FOREIGN KEY ("identifier") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live" ADD CONSTRAINT "live_current_track_id_fkey" FOREIGN KEY ("current_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_schedule" ADD CONSTRAINT "live_schedule_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radio" ADD CONSTRAINT "radio_current_track_id_fkey" FOREIGN KEY ("current_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_requests" ADD CONSTRAINT "song_requests_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_favorites" ADD CONSTRAINT "fan_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_favorites" ADD CONSTRAINT "fan_favorites_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_subs" ADD CONSTRAINT "channel_subs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muted_users" ADD CONSTRAINT "muted_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
