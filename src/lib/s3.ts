import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getClient(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region: process.env.S3_REGION!,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    // ブラウザ直 PUT の presigned URL に CRC32 クエリが付くと MinIO が 403 になるため無効化
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export async function presignPutObject(params: {
  tenantId: string;
  postId: string;
  originalFilename: string;
  mimeType: string;
}): Promise<{ storageKey: string; uploadUrl: string }> {
  const bucket = process.env.S3_BUCKET!;
  const safeName = params.originalFilename.replace(/[^\w.\-一-龥ぁ-んァ-ン]/g, "_");
  const storageKey = `${params.tenantId}/${params.postId}/${randomUUID()}-${safeName}`;

  const client = getClient();
  // ContentType は付けない（host のみ署名の presigned URL とブラウザの Content-Type 不一致で MinIO が 403 になる）
  // MIME は DB（registerAttachment）で保持する
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });
  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 15 });
  return { storageKey, uploadUrl };
}

export async function presignGetObject(storageKey: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  const client = getClient();
  const get = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return getSignedUrl(client, get, { expiresIn: 60 * 10 });
}

export async function getObjectForStream(storageKey: string): Promise<{
  body: import("stream").Readable;
  contentType: string;
  contentLength: number | undefined;
}> {
  const bucket = process.env.S3_BUCKET!;
  const client = getClient();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
  );
  if (!response.Body) {
    throw new Error("Empty S3 object body");
  }
  return {
    body: response.Body as import("stream").Readable,
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength,
  };
}

export async function deleteObject(storageKey: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: storageKey,
    }),
  );
}
