import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

/**
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK's S3 client
 * pointed at the R2 account endpoint. Credentials live only in server
 * environment variables — never sent to the client. All admin uploads go
 * through this helper from an admin-authenticated Route Handler; the
 * client never talks to R2 directly.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL (public CDN/custom domain the
 *   bucket is served from, e.g. https://pub-xxxx.r2.dev)
 */

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Uploads a file buffer to R2 under a namespaced key and returns its
 * public URL. Caller (an admin route) is responsible for verifying admin
 * auth before calling this — this function does not check auth itself.
 */
export async function uploadToR2(params: {
  buffer: Buffer;
  contentType: string;
  folder: "packages" | "visas" | "blogs" | "flights" | "insurance" | "agents" | "payments";
}) {
  const { buffer, contentType, folder } = params;

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicBase) {
    throw new Error("R2_BUCKET_NAME / R2_PUBLIC_URL are not configured.");
  }

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${publicBase.replace(/\/$/, "")}/${key}`;
}
