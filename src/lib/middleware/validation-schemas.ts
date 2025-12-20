import { z } from "zod";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/utils/i18n-errors";

/**
 * Get translated Zod error messages for a given locale
 */
async function getZodErrorMap(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });

  return (issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx): { message: string } => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.expected === "string") {
          return { message: t("invalidType") };
        }
        if (issue.expected === "number") {
          return { message: t("invalidType") };
        }
        return { message: t("invalidType") };

      case z.ZodIssueCode.too_small:
        if (issue.type === "string") {
          return { message: t("stringMin", { min: Number(issue.minimum) }) };
        }
        if (issue.type === "number") {
          return { message: t("numberMin", { min: Number(issue.minimum) }) };
        }
        return { message: ctx.defaultError };

      case z.ZodIssueCode.too_big:
        if (issue.type === "string") {
          return { message: t("stringMax", { max: Number(issue.maximum) }) };
        }
        if (issue.type === "number") {
          return { message: t("numberMax", { max: Number(issue.maximum) }) };
        }
        return { message: ctx.defaultError };

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === "email") {
          return { message: t("invalidEmail") };
        }
        if (issue.validation === "url") {
          return { message: t("invalidUrl") };
        }
        if (issue.validation === "uuid") {
          return { message: t("invalidUuid") };
        }
        return { message: ctx.defaultError };

      case z.ZodIssueCode.invalid_enum_value:
        return { message: t("invalidEnum") };

      default:
        return { message: ctx.defaultError };
    }
  };
}

/**
 * Create deposit validation schema with translated messages
 */
export async function createDepositSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    amount: z
      .number({
        required_error: t("amount.required"),
        invalid_type_error: t("amount.invalidType"),
        errorMap,
      })
      .positive(t("amount.positive"))
      .max(1000000, t("amount.maxExceeded", { max: "1,000,000" })),
    description: z
      .string({
        required_error: t("description.required"),
        errorMap,
      })
      .min(1, t("description.empty"))
      .max(255, t("description.maxLength", { max: 255 }))
      .trim(),
  });
}

/**
 * Create cash expense validation schema with translated messages
 */
export async function createCashExpenseSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    amount: z
      .number({
        required_error: t("amount.required"),
        invalid_type_error: t("amount.invalidType"),
        errorMap,
      })
      .positive(t("amount.positive"))
      .max(1000000, t("amount.maxExceeded", { max: "1,000,000" })),
    description: z
      .string({
        required_error: t("description.required"),
        errorMap,
      })
      .min(1, t("description.empty"))
      .max(255, t("description.maxLength", { max: 255 }))
      .trim(),
    category: z.enum(["FEED", "VET", "LABOR", "TRANSPORT", "EQUIPMENT", "UTILITIES", "OTHER"], {
      required_error: t("category.required"),
      invalid_type_error: t("category.invalid"),
      errorMap,
    }),
  });
}

/**
 * Create credit expense validation schema with translated messages
 */
export async function createCreditExpenseSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    amount: z
      .number({
        required_error: t("amount.required"),
        invalid_type_error: t("amount.invalidType"),
        errorMap,
      })
      .positive(t("amount.positive"))
      .max(1000000, t("amount.maxExceeded", { max: "1,000,000" })),
    description: z
      .string({
        required_error: t("description.required"),
        errorMap,
      })
      .min(1, t("description.empty"))
      .max(255, t("description.maxLength", { max: 255 }))
      .trim(),
    category: z.enum(["FEED", "VET", "LABOR", "TRANSPORT", "EQUIPMENT", "UTILITIES", "OTHER"], {
      required_error: t("category.required"),
      invalid_type_error: t("category.invalid"),
      errorMap,
    }),
    paidBy: z
      .string({
        required_error: t("paidBy.required"),
        errorMap,
      })
      .uuid(t("paidBy.invalidFormat")),
  });
}

/**
 * Create reimbursement validation schema with translated messages
 */
export async function createReimbursementSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    creditExpenseId: z
      .string({
        required_error: t("creditExpenseId.required"),
        errorMap,
      })
      .uuid(t("creditExpenseId.invalidFormat")),
    amount: z
      .number({
        required_error: t("reimbursementAmount.required"),
        invalid_type_error: t("reimbursementAmount.invalidType"),
        errorMap,
      })
      .positive(t("reimbursementAmount.positive"))
      .max(1000000, t("reimbursementAmount.maxExceeded", { max: "1,000,000" })),
    description: z
      .string({ errorMap })
      .max(255, t("description.maxLength", { max: 255 }))
      .trim()
      .optional(),
  });
}

/**
 * Create animal creation validation schema with translated messages
 */
export async function createAnimalCreateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z
    .object({
      type: z.enum(["INDIVIDUAL", "LOT"], {
        required_error: t("animalType.required"),
        invalid_type_error: t("animalType.invalid"),
      }),
      species: z
        .string({
          required_error: t("species.required"),
        })
        .min(1, t("species.empty"))
        .max(100, t("species.maxLength", { max: 100 }))
        .trim(),
      sex: z
        .enum(["MALE", "FEMALE"], {
          invalid_type_error: t("sex.invalid"),
        })
        .optional(),
      birthDate: z.string({ errorMap }).datetime(t("birthDate.invalid")).optional(),
      estimatedAge: z
        .number({
          invalid_type_error: t("estimatedAge.invalidType"),
        })
        .int(t("estimatedAge.int"))
        .min(0, t("estimatedAge.negative"))
        .max(7000, t("estimatedAge.maxExceeded", { max: 7000 }))
        .optional(),
      status: z
        .enum(["ACTIVE", "SOLD", "DEAD"], {
          invalid_type_error: t("status.invalid"),
        })
        .default("ACTIVE"),
      photoUrl: z.string({ errorMap }).url(t("photoUrl.invalidUrl")).optional(),
      lotCount: z
        .number({
          invalid_type_error: t("lotCount.invalidType"),
        })
        .int(t("lotCount.int"))
        .positive(t("lotCount.positive"))
        .max(10000, t("lotCount.maxExceeded", { max: 10000 }))
        .optional(),
    })
    .refine(
      (data) => {
        if (data.type === "LOT" && !data.lotCount) return false;
        if (data.type === "INDIVIDUAL" && data.lotCount) return false;
        return true;
      },
      {
        message: t("lotCount.required"),
        path: ["lotCount"],
      }
    );
}

/**
 * Create animal update validation schema with translated messages
 */
export async function createAnimalUpdateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    species: z
      .string({ errorMap })
      .min(1, t("species.empty"))
      .max(100, t("species.maxLength", { max: 100 }))
      .trim()
      .optional(),
    sex: z
      .enum(["MALE", "FEMALE"], {
        invalid_type_error: t("sex.invalid"),
        errorMap,
      })
      .optional(),
    birthDate: z.string({ errorMap }).datetime(t("birthDate.invalid")).optional(),
    estimatedAge: z
      .number({
        invalid_type_error: t("estimatedAge.invalidType"),
        errorMap,
      })
      .int(t("estimatedAge.int"))
      .min(0, t("estimatedAge.negative"))
      .max(50, t("estimatedAge.maxExceeded", { max: 50 }))
      .optional(),
    status: z
      .enum(["ACTIVE", "SOLD", "DEAD"], {
        invalid_type_error: t("status.invalid"),
        errorMap,
      })
      .optional(),
    photoUrl: z.string({ errorMap }).url(t("photoUrl.invalidUrl")).optional(),
    lotCount: z
      .number({
        invalid_type_error: t("lotCount.invalidType"),
        errorMap,
      })
      .int(t("lotCount.int"))
      .positive(t("lotCount.positive"))
      .max(10000, t("lotCount.maxExceeded", { max: 10000 }))
      .optional(),
  });
}

/**
 * Create event creation validation schema with translated messages
 */
export async function createEventCreateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z
    .object({
      targetId: z
        .string({
          required_error: t("targetId.required"),
          errorMap,
        })
        .uuid(t("targetId.invalidFormat")),
      targetType: z.enum(["ANIMAL", "LOT"], {
        required_error: t("targetType.required"),
        invalid_type_error: t("targetType.invalid"),
        errorMap,
      }),
      eventType: z.enum(["BIRTH", "VACCINATION", "TREATMENT", "WEIGHT", "SALE", "DEATH", "NOTE"], {
        required_error: t("eventType.required"),
        invalid_type_error: t("eventType.invalid"),
        errorMap,
      }),
      eventDate: z
        .string({
          required_error: t("eventDate.required"),
          errorMap,
        })
        .datetime(t("eventDate.invalid")),
      payload: z.record(z.any()).default({}),
      note: z
        .string({ errorMap })
        .max(1000, t("note.maxLength", { max: 1000 }))
        .trim()
        .optional(),
      cost: z
        .number({
          invalid_type_error: t("cost.invalidType"),
          errorMap,
        })
        .min(0, t("cost.negative"))
        .max(1000000, t("cost.maxExceeded", { max: "1,000,000" }))
        .optional(),
      nextDueDate: z.string({ errorMap }).datetime(t("nextDueDate.invalid")).optional(),
      attachmentUrl: z.string({ errorMap }).url(t("attachmentUrl.invalidUrl")).optional(),
    })
    .refine(
      (data) => {
        if (data.eventType === "SALE" && (!data.cost || data.cost <= 0)) return false;
        return true;
      },
      {
        message: t("cost.saleRequired"),
        path: ["cost"],
      }
    );
}

/**
 * Create event update validation schema with translated messages
 */
export async function createEventUpdateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    eventDate: z.string({ errorMap }).datetime(t("eventDate.invalid")).optional(),
    payload: z.record(z.any()).optional(),
    note: z
      .string({ errorMap })
      .max(1000, t("note.maxLength", { max: 1000 }))
      .trim()
      .optional(),
    cost: z
      .number({
        invalid_type_error: t("cost.invalidType"),
        errorMap,
      })
      .min(0, t("cost.negative"))
      .max(1000000, t("cost.maxExceeded", { max: "1,000,000" }))
      .optional(),
    nextDueDate: z.string({ errorMap }).datetime(t("nextDueDate.invalid")).optional(),
    attachmentUrl: z.string({ errorMap }).url(t("attachmentUrl.invalidUrl")).optional(),
  });
}

/**
 * Create farm creation validation schema with translated messages
 */
export async function createFarmCreateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    name: z
      .string({
        required_error: t("farmName.required"),
        errorMap,
      })
      .min(1, t("farmName.empty"))
      .max(100, t("farmName.maxLength", { max: 100 }))
      .trim(),
    currency: z.string({ errorMap }).length(3, t("currency.length")).default("TND"),
    timezone: z.string({ errorMap }).default("Africa/Tunis"),
  });
}

/**
 * Create farm update validation schema with translated messages
 */
export async function createFarmUpdateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    name: z
      .string({ errorMap })
      .min(1, t("farmName.empty"))
      .max(100, t("farmName.maxLength", { max: 100 }))
      .trim()
      .optional(),
    currency: z.string({ errorMap }).length(3, t("currency.length")).optional(),
    timezone: z.string({ errorMap }).optional(),
  });
}

/**
 * Create member invite validation schema with translated messages
 */
export async function createMemberInviteSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    email: z
      .string({
        required_error: t("email.required"),
        errorMap,
      })
      .email(t("email.invalid"))
      .toLowerCase(),
    role: z.enum(["OWNER", "ASSOCIATE", "WORKER"], {
      required_error: t("role.required"),
      invalid_type_error: t("role.invalid"),
      errorMap,
    }),
  });
}

/**
 * Create member update validation schema with translated messages
 */
export async function createMemberUpdateSchema(locale: Locale = "fr") {
  const t = await getTranslations({ locale, namespace: "validation" });
  const errorMap = await getZodErrorMap(locale);

  return z.object({
    role: z.enum(["OWNER", "ASSOCIATE", "WORKER"], {
      required_error: t("role.required"),
      invalid_type_error: t("role.invalid"),
      errorMap,
    }),
  });
}
