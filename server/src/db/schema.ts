import { pgTable, text, integer, real, serial, boolean, timestamp, varchar, uniqueIndex, index, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    /** Clerk subject (`user_*`) linked for API scope alignment with JWT `users.id` */
    clerk_user_id: text("clerk_user_id").unique(),
    email: text("email").notNull().unique(),
    password_hash: text("password_hash"), // Nullable for OAuth/Legacy compatibility
    full_name: text("full_name"),
    role: text("role", { enum: ["client", "barber", "admin", "shop_owner"] }).default("client"),
    avatar_url: text("avatar_url"),
    phone: text("phone"),
    stripe_account_id: text("stripe_account_id"),
    stripe_connect_status: text("stripe_connect_status").default("unconnected"), // 'unconnected', 'pending', 'active'
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const shops = pgTable("shops", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    location: text("location"),
    image_url: text("image_url"),
    description: text("description"),
    owner_id: text("owner_id").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const barbers = pgTable("barbers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id),
    shop_id: text("shop_id").references(() => shops.id),
    name: text("name").notNull(),
    title: text("title").default("Professional Barber"),
    bio: text("bio"),
    image_url: text("image_url"),
    rating: real("rating").default(0),
    review_count: integer("review_count").default(0),
    location: text("location"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    city: text("city"),
    status: text("status", { enum: ["active", "inactive"] }).default("active"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index("barbers_user_id_idx").on(table.user_id),
    shopIdx: index("barbers_shop_id_idx").on(table.shop_id),
}));

export const services = pgTable("services", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_id: text("shop_id").references(() => shops.id),
    barber_id: text("barber_id").references(() => barbers.id),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"),
    price: real("price").notNull(),
    duration_minutes: integer("duration_minutes").notNull(),
    image_url: text("image_url"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    shopIdx: index("services_shop_id_idx").on(table.shop_id),
    barberIdx: index("services_barber_id_idx").on(table.barber_id),
}));

export const bookings = pgTable("bookings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    client_id: text("client_id").references(() => users.id),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    client_name: text("client_name"),
    barber_name: text("barber_name"),
    service_name: text("service_name"),
    service_snapshot: text("service_snapshot"), // JSON fallback
    created_by: text("created_by"), // email or username
    start_time: text("start_time").notNull(), // ISO string
    end_time: text("end_time").notNull(), // ISO string
    status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled", "no_show"] }).default("pending"),
    payment_status: text("payment_status", { enum: ["unpaid", "paid", "refunded", "failed"] }).default("unpaid"),
    financial_breakdown: text("financial_breakdown"), // JSON string
    price_at_booking: real("price_at_booking"),
    notes: text("notes"),
    /** Normalized promo code applied at booking time (matches promo_codes.code); used for usage limits. */
    discount_code: text("discount_code"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    clientIdx: index("bookings_client_id_idx").on(table.client_id),
    barberTimeIdx: index("bookings_barber_time_idx").on(table.barber_id, table.start_time),
    statusIdx: index("bookings_status_idx").on(table.status),
    discountCodeIdx: index("bookings_discount_code_idx").on(table.discount_code),
}));

export const booking_services = pgTable("booking_services", {
    id: serial("id").primaryKey(),
    booking_id: text("booking_id").references(() => bookings.id).notNull(),
    service_id: text("service_id").references(() => services.id).notNull(),
});

export const shifts = pgTable("shifts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    day: text("day", { enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }).notNull(),
    start_time: text("start_time").notNull(), // "HH:MM"
    end_time: text("end_time").notNull(), // "HH:MM"
}, (table) => ({
    barberDayIdx: index("shifts_barber_day_idx").on(table.barber_id, table.day),
    shopDayIdx: index("shifts_shop_day_idx").on(table.shop_id, table.day),
}));

export const time_blocks = pgTable("time_blocks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    start_datetime: text("start_datetime").notNull(),
    end_datetime: text("end_datetime").notNull(),
    reason: text("reason"),
    note: text("note"),
});

export const loyalty_profiles = pgTable("loyalty_profiles", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull().unique(),
    current_points: integer("current_points").default(0),
    lifetime_points: integer("lifetime_points").default(0),
    tier: text("tier").default("Bronze"),
    joined_date: text("joined_date").default(sql`CURRENT_TIMESTAMP`),
});

export const loyalty_transactions = pgTable("loyalty_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    points: integer("points").notNull(),
    description: text("description"),
    date_text: text("date_text").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = pgTable("messages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sender_id: text("sender_id").references(() => users.id).notNull(),
    sender_email: text("sender_email"),
    receiver_id: text("receiver_id").references(() => users.id).notNull(),
    receiver_email: text("receiver_email"),
    content: text("content").notNull(),
    is_read: boolean("is_read").default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    senderIdx: index("messages_sender_idx").on(table.sender_id),
    receiverReadIdx: index("messages_receiver_read_idx").on(table.receiver_id, table.is_read),
}));

export const notifications = pgTable("notifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: text("type"),
    is_read: boolean("is_read").default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userReadIdx: index("notifications_user_read_idx").on(table.user_id, table.is_read),
}));

export const disputes = pgTable("disputes", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    booking_id: text("booking_id").references(() => bookings.id).notNull(),
    reason: text("reason").notNull(),
    status: text("status").default("open"),
    evidence: text("evidence"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const audit_logs = pgTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    action: text("action").notNull(),
    resource_type: text("resource_type"),
    resource_id: text("resource_id"),
    actor_id: text("actor_id"),
    changes: text("changes"), // JSON
    details: text("details"), // JSON
    timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const promo_codes = pgTable("promo_codes", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    discount_type: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
    discount_value: real("discount_value").notNull(),
    /** When set, code applies to that shop only; when null, platform-wide. */
    shop_id: text("shop_id").references(() => shops.id),
    expiry_date: text("expiry_date"),
    is_active: boolean("is_active").default(true),
}, (table) => ({
    shopIdx: index("promo_codes_shop_id_idx").on(table.shop_id),
}));

export const shop_members = pgTable("shop_members", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_id: text("shop_id").references(() => shops.id).notNull(),
    user_id: text("user_id").references(() => users.id).notNull(),
    role: text("role", { enum: ["owner", "manager", "barber"] }).default("barber"),
    joined_date: text("joined_date").default(sql`CURRENT_TIMESTAMP`),
    barber_id: text("barber_id").references(() => barbers.id), // Link to barber profile if exists
});

export const pricing_rules = pgTable("pricing_rules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    commission_freelancer: real("commission_freelancer").default(0.10),
    commission_shop: real("commission_shop").default(0.05),
    is_active: boolean("is_active").default(true),
});

export const waiting_list_entries = pgTable("waiting_list_entries", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    client_id: text("client_id").references(() => users.id),
    barber_id: text("barber_id").references(() => barbers.id),
    request_date: text("request_date"),
    status: text("status").default("pending"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const staff_service_configs = pgTable("staff_service_configs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_member_id: text("shop_member_id").references(() => shop_members.id),
    service_id: text("service_id").references(() => services.id),
    custom_price: real("custom_price"),
    custom_duration: integer("custom_duration"),
    is_enabled: boolean("is_enabled").default(true),
});

export const reviews = pgTable("reviews", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    booking_id: text("booking_id").references(() => bookings.id),
    reviewer_id: text("reviewer_id").references(() => users.id),
    target_id: text("target_id").references(() => barbers.id),
    rating: integer("rating"),
    content: text("content"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = pgTable("payouts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    provider_id: text("provider_id").references(() => barbers.id),
    amount: real("amount"),
    status: text("status").default("Pending"),
    stripe_payout_id: text("stripe_payout_id"),
    failure_reason: text("failure_reason"),
    paid_date: text("paid_date"),
    period_start: text("period_start"),
    period_end: text("period_end"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const favorites = pgTable("favorites", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    target_id: text("target_id").notNull(), // ID of barber or shop
    target_type: text("target_type", { enum: ["barber", "shop"] }).notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userTargetUniq: uniqueIndex("favorites_user_target_uniq").on(table.user_id, table.target_id, table.target_type),
}));

// Elite brands (Michelin-style vendor profiles for marketplace)
export const brands = pgTable("brands", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug"), // optional URL-friendly id
    logo_url: text("logo_url"),
    hero_image_url: text("hero_image_url"),
    description: text("description"),
    locations: text("locations"), // e.g. "New York • London • Paris"
    verified_elite: boolean("verified_elite").default(true),
    price_range: text("price_range"), // e.g. "$$$"
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const brand_accolades = pgTable("brand_accolades", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    brand_id: text("brand_id").references(() => brands.id).notNull(),
    icon_key: text("icon_key").notNull(), // trophy, star, leaf, art
    label: text("label").notNull(),
    sort_order: integer("sort_order").default(0),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const brand_collections = pgTable("brand_collections", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    brand_id: text("brand_id").references(() => brands.id).notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle"),
    image_url: text("image_url"),
    tag: text("tag"), // e.g. "LIMITED RELEASE"
    sort_order: integer("sort_order").default(0),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Marketplace: elite/luxury products from barbers, platform, and external vendors
export const products = pgTable("products", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    price: real("price").notNull(),
    image_url: text("image_url"),
    category: text("category"), // Hair, Beard, Skincare, Tools, Fragrance
    seller_type: text("seller_type", { enum: ["barber", "platform", "vendor"] }).notNull(),
    barber_id: text("barber_id").references(() => barbers.id),
    shop_id: text("shop_id").references(() => shops.id),
    vendor_name: text("vendor_name"), // for external merchants
    brand_id: text("brand_id").references(() => brands.id), // link to elite brand profile
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Cart: per-user cart items (product_id + quantity)
export const cart_items = pgTable("cart_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    product_id: text("product_id").references(() => products.id).notNull(),
    quantity: integer("quantity").notNull().default(1),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userProductUniq: uniqueIndex("cart_items_user_product_uniq").on(table.user_id, table.product_id),
}));

// Product orders (marketplace checkout)
export const orders = pgTable("orders", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    status: text("status", { enum: ["pending", "paid", "shipped", "cancelled"] }).default("pending"),
    subtotal: real("subtotal").notNull(),
    shipping_amount: real("shipping_amount").default(0),
    tax_amount: real("tax_amount").default(0),
    total: real("total").notNull(),
    shipping_full_name: text("shipping_full_name"),
    shipping_street: text("shipping_street"),
    shipping_city: text("shipping_city"),
    shipping_zip: text("shipping_zip"),
    shipping_phone: text("shipping_phone"),
    payment_status: text("payment_status", { enum: ["unpaid", "paid", "refunded"] }).default("unpaid"),
    stripe_checkout_session_id: text("stripe_checkout_session_id"),
    order_number: text("order_number"), // Display id e.g. EMG-882914
    fulfillment_status: text("fulfillment_status", { enum: ["confirmed", "preparing", "in_transit", "delivered"] }).default("confirmed"),
    estimated_delivery_at: text("estimated_delivery_at"), // ISO date
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const order_items = pgTable("order_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: text("order_id").references(() => orders.id).notNull(),
    product_id: text("product_id").references(() => products.id).notNull(),
    product_name: text("product_name").notNull(),
    product_image_url: text("product_image_url"),
    price: real("price").notNull(),
    quantity: integer("quantity").notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    orderIdx: index("order_items_order_id_idx").on(table.order_id),
}));

// --- Employment / Jobs Ecosystem ---

/** External employers (non-shop companies) for job postings */
export const companies = pgTable("companies", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    logo_url: text("logo_url"),
    description: text("description"),
    website: text("website"),
    location: text("location"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Job postings: employer is either a shop (shop_id) or company (company_id) */
export const jobs = pgTable("jobs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    category: text("category").notNull(), // grooming, stylisme, management, logistics, branding, accounting, etc.
    employer_type: text("employer_type", { enum: ["shop", "company"] }).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    company_id: text("company_id").references(() => companies.id),
    employment_type: text("employment_type", { enum: ["full_time", "part_time", "contract", "freelance"] }).notNull(),
    location_type: text("location_type", { enum: ["on_site", "remote", "hybrid"] }).notNull(),
    location_text: text("location_text"), // e.g. "London, UK"
    description: text("description"),
    responsibilities: text("responsibilities"), // rich text or JSON
    required_experience_skills: text("required_experience_skills"),
    salary_min: real("salary_min"),
    salary_max: real("salary_max"),
    salary_currency: text("salary_currency").default("USD"),
    application_deadline: text("application_deadline"), // ISO date
    status: text("status", { enum: ["draft", "published", "closed"] }).default("draft"),
    featured: boolean("featured").default(false),
    image_url: text("image_url"),
    created_by: text("created_by").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Extended applicant profile (one per user) for employment */
export const applicant_profiles = pgTable("applicant_profiles", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull().unique(),
    professional_summary: text("professional_summary"),
    work_experience: text("work_experience"), // JSON array
    skills: text("skills"), // JSON array or comma-separated
    certifications: text("certifications"), // JSON array
    portfolio_links: text("portfolio_links"), // JSON array of {url, label}
    availability: text("availability"),
    preferred_job_types: text("preferred_job_types"), // JSON array
    years_experience: integer("years_experience"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Applicant credentials: CV, certificates, portfolio files */
export const applicant_credentials = pgTable("applicant_credentials", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    type: text("type", { enum: ["cv", "certificate", "portfolio"] }).notNull(),
    file_name: text("file_name").notNull(),
    file_path: text("file_path").notNull(), // relative path under uploads/
    file_size: integer("file_size"),
    mime_type: text("mime_type"),
    verified: boolean("verified").default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Job applications */
export const job_applications = pgTable("job_applications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    job_id: text("job_id").references(() => jobs.id).notNull(),
    user_id: text("user_id").references(() => users.id).notNull(),
    status: text("status", { enum: ["received", "under_review", "shortlisted", "rejected", "hired"] }).default("received"),
    cover_letter: text("cover_letter"),
    custom_data: text("custom_data"), // JSON for job-specific answers
    match_score: integer("match_score"), // 0-100 optional
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Documents attached to an application (CV, certs, etc.) */
export const application_documents = pgTable("application_documents", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    application_id: text("application_id").references(() => job_applications.id).notNull(),
    type: text("type", { enum: ["cv", "certificate", "portfolio", "other"] }).notNull(),
    file_name: text("file_name").notNull(),
    file_path: text("file_path").notNull(),
    file_size: integer("file_size"),
    mime_type: text("mime_type"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Interview scheduling (employer → applicant) */
export const interview_schedules = pgTable("interview_schedules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    application_id: text("application_id").references(() => job_applications.id).notNull(),
    scheduled_at: text("scheduled_at").notNull(), // ISO datetime
    format: text("format", { enum: ["in_person", "video", "phone"] }).notNull(),
    notes: text("notes"),
    created_by: text("created_by").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Saved jobs (bookmarks) for applicants */
export const saved_jobs = pgTable("saved_jobs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    job_id: text("job_id").references(() => jobs.id).notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userJobUniq: uniqueIndex("saved_jobs_user_job_uniq").on(table.user_id, table.job_id),
}));

export const inspiration_posts = pgTable("inspiration_posts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    author_name: text("author_name"),
    author_id: text("author_id").references(() => users.id),
    image_url: text("image_url"),
    video_url: text("video_url"),
    post_type: text("post_type", { enum: ["image", "video"] }).default("image"),
    category: text("category"),
    likes: integer("likes").default(0),
    published: boolean("published").default(true),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const articles = pgTable("articles", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug"),
    excerpt: text("excerpt"),
    content: text("content"),
    category: text("category"),
    image_url: text("image_url"),
    author_id: text("author_id").references(() => users.id),
    author_name: text("author_name"),
    published: boolean("published").default(false),
    featured: boolean("featured").default(false),
    views: integer("views").default(0),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    slugIdx: uniqueIndex("articles_slug_uniq").on(table.slug),
    publishedIdx: index("articles_published_idx").on(table.published),
}));

export const gift_cards = pgTable("gift_cards", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    purchaser_id: text("purchaser_id").references(() => users.id),
    recipient_email: text("recipient_email"),
    original_amount: real("original_amount").notNull(),
    balance: real("balance").notNull(),
    currency: text("currency").default("EUR"),
    expiry_date: text("expiry_date"),
    status: text("status", { enum: ["active", "redeemed", "expired", "cancelled"] }).default("active"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const referrals = pgTable("referrals", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    referrer_id: text("referrer_id").references(() => users.id).notNull(),
    referral_code: text("referral_code").notNull(),
    referred_user_id: text("referred_user_id").references(() => users.id),
    reward_amount: real("reward_amount").default(10),
    status: text("status", { enum: ["pending", "completed", "paid"] }).default("pending"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    codeIdx: index("referrals_code_idx").on(table.referral_code),
    referrerIdx: index("referrals_referrer_idx").on(table.referrer_id),
}));

export const wallet_accounts = pgTable("wallet_accounts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull().unique(),
    balance: real("balance").default(0),
    currency: text("currency").default("EUR"),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const wallet_transactions = pgTable("wallet_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    wallet_id: text("wallet_id").references(() => wallet_accounts.id).notNull(),
    user_id: text("user_id").references(() => users.id).notNull(),
    amount: real("amount").notNull(),
    type: text("type", { enum: ["credit", "debit", "refund", "top_up", "referral"] }).notNull(),
    description: text("description"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index("wallet_tx_user_idx").on(table.user_id),
}));

export const wishlist_items = pgTable("wishlist_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    product_id: text("product_id").references(() => products.id).notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userProductUniq: uniqueIndex("wishlist_user_product_uniq").on(table.user_id, table.product_id),
}));

export const barber_videos = pgTable("barber_videos", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    title: text("title").notNull(),
    video_url: text("video_url").notNull(),
    thumbnail_url: text("thumbnail_url"),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
    views: integer("views").default(0),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    barberIdx: index("barber_videos_barber_idx").on(table.barber_id),
}));

export const feature_flags = pgTable("feature_flags", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    key: text("key").notNull().unique(),
    label: text("label"),
    description: text("description"),
    enabled: boolean("enabled").default(true),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const shop_inventory_items = pgTable("shop_inventory_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_id: text("shop_id").references(() => shops.id).notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    quantity: integer("quantity").default(0),
    unit_cost: real("unit_cost"),
    reorder_level: integer("reorder_level").default(5),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    shopIdx: index("shop_inventory_shop_idx").on(table.shop_id),
}));

export const shop_expenses = pgTable("shop_expenses", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_id: text("shop_id").references(() => shops.id).notNull(),
    category: text("category"),
    amount: real("amount").notNull(),
    description: text("description"),
    expense_date: text("expense_date"),
    created_by: text("created_by").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    shopIdx: index("shop_expenses_shop_idx").on(table.shop_id),
}));

export const legal_documents = pgTable("legal_documents", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: text("content"),
    version: text("version"),
    published: boolean("published").default(true),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
