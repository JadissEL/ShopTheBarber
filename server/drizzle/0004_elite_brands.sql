-- Elite brands (Michelin-style vendor profiles)
CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo_url` text,
	`hero_image_url` text,
	`description` text,
	`locations` text,
	`verified_elite` integer DEFAULT 1,
	`price_range` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `brand_accolades` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`icon_key` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `brand_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`image_url` text,
	`tag` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);

-- Link products to brand (optional)
ALTER TABLE `products` ADD COLUMN `brand_id` text;
