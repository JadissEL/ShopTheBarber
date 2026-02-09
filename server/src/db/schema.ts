import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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

export const shops = sqliteTable("shops", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    location: text("location"),
    image_url: text("image_url"),
    description: text("description"),
    owner_id: text("owner_id").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const barbers = sqliteTable("barbers", {
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
    status: text("status", { enum: ["active", "inactive"] }).default("active"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const services = sqliteTable("services", {
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
});

export const bookings = sqliteTable("bookings", {
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
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const booking_services = sqliteTable("booking_services", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    booking_id: text("booking_id").references(() => bookings.id).notNull(),
    service_id: text("service_id").references(() => services.id).notNull(),
});

export const shifts = sqliteTable("shifts", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    day: text("day", { enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }).notNull(),
    start_time: text("start_time").notNull(), // "HH:MM"
    end_time: text("end_time").notNull(), // "HH:MM"
});

export const time_blocks = sqliteTable("time_blocks", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barber_id: text("barber_id").references(() => barbers.id).notNull(),
    shop_id: text("shop_id").references(() => shops.id),
    start_datetime: text("start_datetime").notNull(),
    end_datetime: text("end_datetime").notNull(),
    reason: text("reason"),
    note: text("note"),
});

export const loyalty_profiles = sqliteTable("loyalty_profiles", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull().unique(),
    current_points: integer("current_points").default(0),
    lifetime_points: integer("lifetime_points").default(0),
    tier: text("tier").default("Bronze"),
    joined_date: text("joined_date").default(sql`CURRENT_TIMESTAMP`),
});

export const loyalty_transactions = sqliteTable("loyalty_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    points: integer("points").notNull(),
    description: text("description"),
    date_text: text("date_text").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sender_id: text("sender_id").references(() => users.id).notNull(),
    sender_email: text("sender_email"),
    receiver_id: text("receiver_id").references(() => users.id).notNull(),
    receiver_email: text("receiver_email"),
    content: text("content").notNull(),
    is_read: integer("is_read", { mode: "boolean" }).default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: text("type"),
    is_read: integer("is_read", { mode: "boolean" }).default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const disputes = sqliteTable("disputes", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    booking_id: text("booking_id").references(() => bookings.id).notNull(),
    reason: text("reason").notNull(),
    status: text("status").default("open"),
    evidence: text("evidence"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const audit_logs = sqliteTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    action: text("action").notNull(),
    resource_type: text("resource_type"),
    resource_id: text("resource_id"),
    actor_id: text("actor_id"),
    changes: text("changes"), // JSON
    details: text("details"), // JSON
    timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const promo_codes = sqliteTable("promo_codes", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(),
    discount_type: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
    discount_value: real("discount_value").notNull(),
    expiry_date: text("expiry_date"),
    is_active: integer("is_active", { mode: "boolean" }).default(true),
});

export const shop_members = sqliteTable("shop_members", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_id: text("shop_id").references(() => shops.id).notNull(),
    user_id: text("user_id").references(() => users.id).notNull(),
    role: text("role", { enum: ["owner", "manager", "barber"] }).default("barber"),
    joined_date: text("joined_date").default(sql`CURRENT_TIMESTAMP`),
    barber_id: text("barber_id").references(() => barbers.id), // Link to barber profile if exists
});

export const pricing_rules = sqliteTable("pricing_rules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    commission_freelancer: real("commission_freelancer").default(0.10),
    commission_shop: real("commission_shop").default(0.05),
    is_active: integer("is_active", { mode: "boolean" }).default(true),
});

export const waiting_list_entries = sqliteTable("waiting_list_entries", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    client_id: text("client_id").references(() => users.id),
    barber_id: text("barber_id").references(() => barbers.id),
    request_date: text("request_date"),
    status: text("status").default("pending"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const staff_service_configs = sqliteTable("staff_service_configs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    shop_member_id: text("shop_member_id").references(() => shop_members.id),
    service_id: text("service_id").references(() => services.id),
    custom_price: real("custom_price"),
    custom_duration: integer("custom_duration"),
    is_enabled: integer("is_enabled", { mode: "boolean" }).default(true),
});

export const reviews = sqliteTable("reviews", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    booking_id: text("booking_id").references(() => bookings.id),
    reviewer_id: text("reviewer_id").references(() => users.id),
    target_id: text("target_id").references(() => barbers.id),
    rating: integer("rating"),
    content: text("content"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = sqliteTable("payouts", {
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

export const favorites = sqliteTable("favorites", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    target_id: text("target_id").notNull(), // ID of barber or shop
    target_type: text("target_type", { enum: ["barber", "shop"] }).notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Elite brands (Michelin-style vendor profiles for marketplace)
export const brands = sqliteTable("brands", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug"), // optional URL-friendly id
    logo_url: text("logo_url"),
    hero_image_url: text("hero_image_url"),
    description: text("description"),
    locations: text("locations"), // e.g. "New York • London • Paris"
    verified_elite: integer("verified_elite", { mode: "boolean" }).default(true),
    price_range: text("price_range"), // e.g. "$$$"
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const brand_accolades = sqliteTable("brand_accolades", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    brand_id: text("brand_id").references(() => brands.id).notNull(),
    icon_key: text("icon_key").notNull(), // trophy, star, leaf, art
    label: text("label").notNull(),
    sort_order: integer("sort_order").default(0),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const brand_collections = sqliteTable("brand_collections", {
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
export const products = sqliteTable("products", {
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
export const cart_items = sqliteTable("cart_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    product_id: text("product_id").references(() => products.id).notNull(),
    quantity: integer("quantity").notNull().default(1),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Product orders (marketplace checkout)
export const orders = sqliteTable("orders", {
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

export const order_items = sqliteTable("order_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: text("order_id").references(() => orders.id).notNull(),
    product_id: text("product_id").references(() => products.id).notNull(),
    product_name: text("product_name").notNull(),
    product_image_url: text("product_image_url"),
    price: real("price").notNull(),
    quantity: integer("quantity").notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// --- Employment / Jobs Ecosystem ---

/** External employers (non-shop companies) for job postings */
export const companies = sqliteTable("companies", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    logo_url: text("logo_url"),
    description: text("description"),
    website: text("website"),
    location: text("location"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Job postings: employer is either a shop (shop_id) or company (company_id) */
export const jobs = sqliteTable("jobs", {
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
    featured: integer("featured", { mode: "boolean" }).default(false),
    image_url: text("image_url"),
    created_by: text("created_by").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Extended applicant profile (one per user) for employment */
export const applicant_profiles = sqliteTable("applicant_profiles", {
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
export const applicant_credentials = sqliteTable("applicant_credentials", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    type: text("type", { enum: ["cv", "certificate", "portfolio"] }).notNull(),
    file_name: text("file_name").notNull(),
    file_path: text("file_path").notNull(), // relative path under uploads/
    file_size: integer("file_size"),
    mime_type: text("mime_type"),
    verified: integer("verified", { mode: "boolean" }).default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Job applications */
export const job_applications = sqliteTable("job_applications", {
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
export const application_documents = sqliteTable("application_documents", {
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
export const interview_schedules = sqliteTable("interview_schedules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    application_id: text("application_id").references(() => job_applications.id).notNull(),
    scheduled_at: text("scheduled_at").notNull(), // ISO datetime
    format: text("format", { enum: ["in_person", "video", "phone"] }).notNull(),
    notes: text("notes"),
    created_by: text("created_by").references(() => users.id),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

/** Saved jobs (bookmarks) for applicants */
export const saved_jobs = sqliteTable("saved_jobs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text("user_id").references(() => users.id).notNull(),
    job_id: text("job_id").references(() => jobs.id).notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
