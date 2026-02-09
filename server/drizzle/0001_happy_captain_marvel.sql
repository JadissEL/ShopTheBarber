CREATE TABLE `shop_members` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'barber',
	`joined_date` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
