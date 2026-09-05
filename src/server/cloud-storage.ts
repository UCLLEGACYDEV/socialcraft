import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export interface CloudStorageConfig {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
}

export function buildS3Client(cfg: CloudStorageConfig): S3Client {
  const rawEndpoint = (cfg.endpoint || "socialgrow.s3.g.megas4.com").trim();
  const bucket = (cfg.bucket || "socialgrow").trim();

  // If endpoint starts with "https://" or "http://", strip it for hostname processing
  let host = rawEndpoint.replace(/^https?:\/\//i, "");

  // If the host starts with the bucket name (e.g. socialgrow.s3.g.megas4.com),
  // strip "socialgrow." so base endpoint is "s3.g.megas4.com"
  if (host.startsWith(`${bucket}.`)) {
    host = host.slice(bucket.length + 1);
  }

  // Mega S4 base endpoint is typically s3.g.megas4.com
  const finalEndpoint = `https://${host}`;

  return new S3Client({
    region: cfg.region || "eu-central-1",
    endpoint: finalEndpoint,
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey,
    },
    forcePathStyle: false,
  });
}

export function extractConfigFromRequest(req: Request, bodyCfg?: Partial<CloudStorageConfig>): CloudStorageConfig | null {
  const env = (typeof process !== "undefined" && process.env) || {};
  const accessKey =
    bodyCfg?.accessKey ||
    req.headers.get("x-cloud-access-key") ||
    env["S4_ACCESS_KEY"] ||
    env["MEGA_S4_ACCESS_KEY"] ||
    "";

  const secretKey =
    bodyCfg?.secretKey ||
    req.headers.get("x-cloud-secret-key") ||
    env["S4_SECRET_KEY"] ||
    env["MEGA_S4_SECRET_KEY"] ||
    "";

  const endpoint =
    bodyCfg?.endpoint ||
    req.headers.get("x-cloud-endpoint") ||
    env["S4_ENDPOINT"] ||
    "socialgrow.s3.g.megas4.com";

  const bucket =
    bodyCfg?.bucket ||
    req.headers.get("x-cloud-bucket") ||
    env["S4_BUCKET"] ||
    "socialgrow";

  const region =
    bodyCfg?.region ||
    req.headers.get("x-cloud-region") ||
    env["S4_REGION"] ||
    "eu-central-1";

  if (!accessKey || !secretKey) {
    return null;
  }

  return { accessKey, secretKey, endpoint, bucket, region };
}

/**
 * Ensures the folder hierarchy and a marker object exists in the bucket for the user.
 * Creates:
 * 1. "USERCONTENT/"
 * 2. "USERCONTENT/admins/" or "USERCONTENT/users/"
 * 3. "${folderPath}/" (directory marker)
 * 4. "${folderPath}/.folder_meta.json" (so Mega S4 and S3 tools immediately recognize and list the folder)
 */
export async function ensureCloudFolder(
  cfg: CloudStorageConfig,
  folderPath: string,
  meta?: { id?: string; name?: string; role?: string; email?: string }
): Promise<{ success: boolean; createdPaths: string[] }> {
  const s3 = buildS3Client(cfg);
  const createdPaths: string[] = [];

  // Normalize folder path: e.g. "USERCONTENT/admins/usr-admin-01"
  const cleanPath = folderPath.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/");

  // Create folder directory markers step by step
  let current = "";
  for (const seg of segments) {
    current = current ? `${current}/${seg}` : seg;
    const dirKey = `${current}/`;
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: dirKey,
          Body: "",
          ContentType: "application/x-directory",
        })
      );
      createdPaths.push(dirKey);
    } catch (err) {
      console.warn(`[CloudStorage] Directory marker notice for ${dirKey}:`, err);
    }
  }

  // Create a metadata marker file inside the user's specific folder
  // This guarantees Mega S4 web console and Cyberduck show the folder immediately!
  const metaKey = `${cleanPath}/.folder_meta.json`;
  const metaContent = JSON.stringify(
    {
      folder: cleanPath,
      user: meta?.name || "User",
      userId: meta?.id || "unknown",
      role: meta?.role || "user",
      email: meta?.email || "",
      initializedAt: new Date().toISOString(),
      generator: "Socialcraft AI Cloud Sync",
    },
    null,
    2
  );

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: metaKey,
        Body: Buffer.from(metaContent, "utf-8"),
        ContentType: "application/json",
      })
    );
    createdPaths.push(metaKey);
  } catch (err) {
    console.warn(`[CloudStorage] Could not write metadata file ${metaKey}:`, err);
  }

  return { success: true, createdPaths };
}

/**
 * Uploads an image (data URL, base64 or remote URL) directly into the S3 bucket.
 */
export async function uploadCloudImage(
  cfg: CloudStorageConfig,
  params: {
    imageUrl: string;
    key: string;
    contentType?: string;
  }
): Promise<{ success: boolean; url: string; key: string; size: number }> {
  const s3 = buildS3Client(cfg);

  let imageBuffer: Buffer;
  let contentType = params.contentType || "image/jpeg";

  if (params.imageUrl.startsWith("data:")) {
    const [header, b64] = params.imageUrl.split(",");
    const match = header ? header.match(/:(.*?);/) : null;
    if (match && match[1]) {
      contentType = match[1];
    }
    imageBuffer = Buffer.from(b64 || "", "base64");
  } else {
    // Fetch remote image on server (avoiding browser CORS)
    const res = await fetch(params.imageUrl);
    if (!res.ok) {
      throw new Error(`Konnte Bild nicht laden (${res.status} ${res.statusText})`);
    }
    contentType = res.headers.get("content-type") || contentType;
    imageBuffer = Buffer.from(await res.arrayBuffer());
  }

  // Make sure parent folder exists
  const folderParts = params.key.split("/");
  if (folderParts.length > 1) {
    const parentFolder = folderParts.slice(0, -1).join("/") + "/";
    await s3
      .send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: parentFolder,
          Body: "",
          ContentType: "application/x-directory",
        })
      )
      .catch(() => {});
  }

  // Put image into S3
  await s3.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: params.key,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `https://${cfg.endpoint}/${params.key}`;
  return {
    success: true,
    url: publicUrl,
    key: params.key,
    size: imageBuffer.length,
  };
}

/**
 * Lists all objects for a given prefix in the bucket
 */
export async function listCloudObjects(
  cfg: CloudStorageConfig,
  prefix: string
): Promise<
  Array<{
    key: string;
    size: number;
    lastModified: string;
    url: string;
    filename: string;
  }>
> {
  const s3 = buildS3Client(cfg);

  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: cfg.bucket,
      Prefix: prefix,
    })
  );

  const objects = (res.Contents || [])
    .filter((obj) => {
      if (!obj.Key) return false;
      // Filter out directory markers and hidden metadata markers
      if (obj.Key.endsWith("/")) return false;
      if (obj.Key.endsWith("/.folder_meta.json")) return false;
      return true;
    })
    .map((obj) => {
      const key = obj.Key!;
      const filename = key.split("/").pop() || key;
      return {
        key,
        size: obj.Size || 0,
        lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
        url: `https://${cfg.endpoint}/${key}`,
        filename,
      };
    });

  return objects;
}

/**
 * Deletes one or more objects by key
 */
export async function deleteCloudObjects(
  cfg: CloudStorageConfig,
  keys: string[]
): Promise<{ success: boolean; deletedCount: number }> {
  if (keys.length === 0) return { success: true, deletedCount: 0 };
  const s3 = buildS3Client(cfg);

  if (keys.length === 1) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: keys[0],
      })
    );
    return { success: true, deletedCount: 1 };
  }

  const res = await s3.send(
    new DeleteObjectsCommand({
      Bucket: cfg.bucket,
      Delete: {
        Objects: keys.map((k) => ({ Key: k })),
        Quiet: false,
      },
    })
  );

  return { success: true, deletedCount: res.Deleted?.length || keys.length };
}

/**
 * Tests connection to the cloud storage bucket
 */
export async function testCloudConnection(
  cfg: CloudStorageConfig
): Promise<{ success: boolean; message: string }> {
  const s3 = buildS3Client(cfg);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
    return { success: true, message: `Erfolgreich mit Cloud-Bucket „${cfg.bucket}“ verbunden` };
  } catch {
    // If HeadBucket fails, try ListObjects with maxKeys=1
    try {
      await s3.send(new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 1 }));
      return { success: true, message: `Erfolgreich mit Cloud-Speicher verbunden` };
    } catch (listErr: unknown) {
      const msg = listErr instanceof Error ? listErr.message : "Verbindung fehlgeschlagen";
      return { success: false, message: msg };
    }
  }
}
