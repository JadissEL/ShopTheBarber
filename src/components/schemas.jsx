import { z } from "zod";

// Common schemas
export const emailSchema = z.string().email("Invalid email address");
export const requiredString = (name, min = 1) => z.string().min(min, `${name} is required`);

// Feature Toggle & Experiment Schemas
export const experimentSchema = z.object({
  name: z.string().min(2, "Experiment name must be at least 2 characters"),
  distribution: z.enum(["50-50", "80-20"], {
    required_error: "Please select a distribution",
  }),
  duration: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration cannot exceed 365 days"),
  audience: z.enum(["all", "new", "returning"], {
    required_error: "Please select a target audience",
  }),
});

// Contact Form Schema
export const contactSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: emailSchema,
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Shop Registration Schema
export const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

// Campaign Schema
export const campaignSchema = z.object({
  title: z.string().min(5, "Campaign title must be at least 5 characters"),
  description: z.string().optional(),
  budget: z.string().min(1, "Budget is required"), // Assuming string input like "$500" or just "500"
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  audience: z.string().min(2, "Target audience is required"),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Service Schema
export const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  category: z.string().min(1, "Category is required"),
  price_text: z.string().min(1, "Price is required (e.g. $30)"),
  duration_text: z.string().min(1, "Duration is required (e.g. 30m)"),
});

// Promotion/Offer Schema
export const promotionSchema = z.object({
  title: z.string().min(5, "Offer name must be at least 5 characters"),
  discountType: z.enum(["percentage", "fixed"]),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid number"),
  terms: z.string().min(10, "Terms must be at least 10 characters"),
});

// Inventory Schema
export const inventorySchema = z.object({
  name: z.string().min(2, "Product name is required"),
  stock: z.coerce.number({ invalid_type_error: "Stock must be a number" }).min(0, "Stock cannot be negative"),
  reorder: z.coerce.number({ invalid_type_error: "Reorder point must be a number" }).min(0, "Reorder point cannot be negative"),
  supplier: z.string().min(2, "Supplier name is required"),
});

// Employee Schema
export const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: emailSchema,
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  role: z.string().default("Barber"),
  status: z.enum(["Active", "Inactive"]),
  services: z.string().min(2, "Services are required"),
  availability: z.string().default("Available"),
});

// Profile Schema
export const profileSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: emailSchema, 
  phone: z.string().optional(),
  address: z.string().optional(),
  hair_type: z.string().optional(),
  beard_style: z.string().optional(),
});

// Payment Schema
export const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format must be MM/YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),
  cardName: z.string().min(2, "Name on card is required"),
});

// Waiting List Schema
export const waitingListSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  service: z.string().min(2, "Service is required"),
  wait: z.string().min(1, "Estimated wait time is required"),
});

// Gift Card Schemas
export const giftCardPurchaseSchema = z.object({
  amount: z.string({ required_error: "Please select an amount" }).min(1, "Please select an amount"),
  recipientEmail: emailSchema,
  senderName: z.string().min(2, "Sender name is required"),
  message: z.string().optional(),
});

export const giftCardRedeemSchema = z.object({
  code: z.string().min(5, "Invalid code format"),
});

// Shop Branding Schema
export const shopBrandingSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
});