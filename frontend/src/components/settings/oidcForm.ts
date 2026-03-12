import * as z from "zod";

export const oidcSchema = z
  .object({
    enabled: z.boolean(),
    server_metadata_url: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) return;

    if (!data.server_metadata_url?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["server_metadata_url"],
        message: "Server metadata URL is required when OIDC is enabled",
      });
    }

    if (data.server_metadata_url) {
      const result = z.string().url().safeParse(data.server_metadata_url);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["server_metadata_url"],
          message: "Please enter a valid URL",
        });
      }
    }

    if (!data.client_id?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["client_id"],
        message: "Client ID is required when OIDC is enabled",
      });
    }
  });

export type OIDCFormData = z.infer<typeof oidcSchema>;
