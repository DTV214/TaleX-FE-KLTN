import { z } from "zod";
import type { EngagementServiceRequest } from "./engagement-services.types";

export const engagementServiceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên dịch vụ không được để trống.")
    .max(120, "Tên dịch vụ không được vượt quá 120 ký tự."),
  description: z
    .string()
    .trim()
    .min(1, "Mô tả không được để trống.")
    .max(1000, "Mô tả không được vượt quá 1000 ký tự."),
  engagementType: z.enum(["BROAD", "TARGETED"], {
    error: "Loại dịch vụ không hợp lệ.",
  }),
  engagementTarget: z.enum(["VIEW", "FOLLOW", "LIKE"], {
    error: "Mục tiêu tương tác không hợp lệ.",
  }),
  price: z.coerce
    .number({ error: "Giá tiền phải là số." })
    .min(1000, "Giá tiền tối thiểu là 1.000 VNĐ.")
    .max(1000000, "Giá tiền tối đa là 1.000.000 VNĐ."),
  targetValue: z.coerce
    .number({ error: "Số lượng mục tiêu phải là số." })
    .int("Số lượng mục tiêu phải là số nguyên.")
    .min(1, "Số lượng mục tiêu tối thiểu là 1.")
    .max(1000, "Số lượng mục tiêu tối đa là 1.000."),
  isActive: z.boolean(),
}) satisfies z.ZodType<EngagementServiceRequest>;

export type EngagementServiceFormValues = z.infer<
  typeof engagementServiceFormSchema
>;
