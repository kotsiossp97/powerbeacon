import * as z from "zod";

export const oidcSchema = z
  .object({
    enabled: z.boolean(),
    server_metadata_url: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const metadataUrl = data.server_metadata_url?.trim();

    if (!metadataUrl && data.enabled) {
      ctx.addIssue({
        code: "custom",
        path: ["server_metadata_url"],
        message: "Server metadata URL is required when OIDC is enabled",
      });
    }

    if (metadataUrl) {
      const result = z.string().url().safeParse(metadataUrl);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["server_metadata_url"],
          message: "Please enter a valid URL",
        });
      }
    }

    if (!data.enabled) return;

    if (!data.client_id?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["client_id"],
        message: "Client ID is required when OIDC is enabled",
      });
    }
  });

export type OIDCFormData = z.infer<typeof oidcSchema>;
