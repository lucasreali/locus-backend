ALTER TABLE "ai_uploads" RENAME TO "syllabus_uploads";
--> statement-breakpoint
ALTER TABLE "syllabus_uploads" RENAME CONSTRAINT "ai_uploads_user_id_users_id_fk" TO "syllabus_uploads_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_syllabus_id_ai_uploads_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_syllabus_id_syllabus_uploads_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus_uploads"("id") ON DELETE set null ON UPDATE no action;
