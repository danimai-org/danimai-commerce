import { z } from "zod";

export const checkoutFormSchema = z.object({
	firstName: z.string().trim().min(2, "Name must be at least 2 characters"),
	lastName: z.string().trim().min(2, "Name must be at least 2 characters"),
	company: z.string().default(""),
	address1: z.string().trim().min(1, "Address line 1 is required"),
	address2: z.string().default(""),
	city: z.string().trim().min(1, "City is required"),
	state: z.string().trim().min(1, "State / Province is required"),
	postalCode: z.string().trim().min(1, "Postal code is required"),
	country: z
		.string()
		.trim()
		.min(1, "Country is required")
		.default("United States"),
	phone: z.string().default(""),
	billingSameAsShipping: z.boolean().default(true),
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	shippingMethod: z.string().default("standard-worldwide"),
	paymentMethod: z.string().default("manual"),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema> &
	Record<string, unknown>;
