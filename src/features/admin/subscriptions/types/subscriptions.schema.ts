import { z } from "zod";

export const subscriptionFormSchema = z.object({
  tier: z
    .string()
    .trim()
    .min(1, "Tên gói là bắt buộc.")
    .max(120, "Tên gói không được vượt quá 120 ký tự."),
  description: z
    .string()
    .trim()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự."),
  price: z.coerce
    .number({ error: "Giá gói phải là số." })
    .min(0, "Giá gói phải lớn hơn hoặc bằng 0."),
  duration: z.coerce
    .number({ error: "Thời hạn phải là số." })
    .min(0, "Thời hạn phải lớn hơn hoặc bằng 0."),
  durationUnit: z.enum(["Days", "Months", "Years"], {
    error: "Đơn vị thời hạn chỉ được là Ngày, Tháng hoặc Năm.",
  }),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;
