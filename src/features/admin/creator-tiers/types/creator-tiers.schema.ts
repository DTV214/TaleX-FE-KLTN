import { z } from "zod";

export const creatorTierFormSchema = z
  .object({
    tierName: z
      .string()
      .trim()
      .min(1, "Tên cấp là bắt buộc.")
      .max(120, "Tên cấp không được vượt quá 120 ký tự."),
    tierLevel: z.coerce
      .number({ error: "Cấp phải là số." })
      .int("Cấp phải là số nguyên.")
      .min(0, "Cấp không được âm."),
    minFollowerRequired: z.coerce
      .number({ error: "Số follower tối thiểu phải là số." })
      .int("Số follower tối thiểu phải là số nguyên.")
      .min(0, "Số follower tối thiểu không được âm."),
    minViewsRequired: z.coerce
      .number({ error: "Số lượt xem tối thiểu phải là số." })
      .int("Số lượt xem tối thiểu phải là số nguyên.")
      .min(0, "Số lượt xem tối thiểu không được âm."),
    minWatchTimeRequired: z.coerce
      .number({ error: "Thời lượng xem tối thiểu phải là số." })
      .min(0, "Thời lượng xem tối thiểu không được âm."),
    premiumFundShareRatio: z.coerce
      .number({ error: "Tỷ lệ chia quỹ Premium phải là số." })
      .min(0, "Tỷ lệ chia quỹ Premium phải từ 0% đến 100%.")
      .max(100, "Tỷ lệ chia quỹ Premium phải từ 0% đến 100%."),
    directPurchaseShareRatio: z.coerce
      .number({ error: "Tỷ lệ mua trực tiếp phải là số." })
      .min(0, "Tỷ lệ mua trực tiếp phải từ 0% đến 100%.")
      .max(100, "Tỷ lệ mua trực tiếp phải từ 0% đến 100%."),
    isDefault: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.isDefault) {
      return;
    }

    const defaultOnlyFields = [
      "tierLevel",
      "minFollowerRequired",
      "minViewsRequired",
      "minWatchTimeRequired",
    ] as const;

    defaultOnlyFields.forEach((field) => {
      if (value[field] !== 0) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Cấp mặc định bắt buộc có giá trị 0.",
        });
      }
    });
  });

export type CreatorTierFormValues = z.infer<typeof creatorTierFormSchema>;
