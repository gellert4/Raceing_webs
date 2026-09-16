CREATE TABLE `waitlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`language` text DEFAULT 'EN' NOT NULL,
	`source` text DEFAULT 'drop-001' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_waitlist_email` ON `waitlist` (`email`);