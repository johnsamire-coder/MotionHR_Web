import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "اسم المستخدم مطلوب" })
    .min(3, { message: "اسم المستخدم قصير جداً" }),
  password: z
    .string()
    .min(1, { message: "كلمة المرور مطلوبة" })
    .min(6, { message: "كلمة المرور قصيرة جداً" }),
  remember_me: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
