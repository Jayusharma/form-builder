import * as z from "zod";



















//auth



export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  isTwoFactorEnabled: z.optional(z.boolean()),
  Newpassword: z.optional(z.string().min(6)),
  bio: z.optional(z.string()),
}).refine((data) => {
  // If either password field is filled, both must be filled
  if (data.password || data.Newpassword) {
    if (!data.password || !data.Newpassword) {
      return false;
    }
    // Add minimum length check only if passwords are provided
    if (data.password && data.password.length < 6) {
      return false;
    }
    if (data.Newpassword && data.Newpassword.length < 6) {
      return false;
    }
  }
  return true;
}, {
  message: "Both current and new password are required to change password",
  path: ["password"]
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required ",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code:z.optional(z.string()),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required ",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required ",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});
