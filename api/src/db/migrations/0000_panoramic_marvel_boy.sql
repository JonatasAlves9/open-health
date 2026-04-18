CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`calories_per_100g` real,
	`protein_per_100g` real,
	`carbs_per_100g` real,
	`fat_per_100g` real,
	`fiber_per_100g` real,
	`source` text DEFAULT 'manual' NOT NULL,
	`barcode` text,
	`default_unit` text DEFAULT 'g' NOT NULL,
	`serving_size` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` integer NOT NULL,
	`food_id` integer NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_template` integer DEFAULT false NOT NULL,
	`logged_at` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
