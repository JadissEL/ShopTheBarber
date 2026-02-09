CREATE TABLE `payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text,
	`amount` real,
	`status` text DEFAULT 'Pending',
	`period_start` text,
	`period_end` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`provider_id`) REFERENCES `barbers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`commission_freelancer` real DEFAULT 0.1,
	`commission_shop` real DEFAULT 0.05,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text,
	`reviewer_id` text,
	`target_id` text,
	`rating` integer,
	`content` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_id`) REFERENCES `barbers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `staff_service_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_member_id` text,
	`service_id` text,
	`custom_price` real,
	`custom_duration` integer,
	`is_enabled` integer DEFAULT true,
	FOREIGN KEY (`shop_member_id`) REFERENCES `shop_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `waiting_list_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`barber_id` text,
	`request_date` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`barber_id`) REFERENCES `barbers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `shop_members` ADD `barber_id` text REFERENCES barbers(id);--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;