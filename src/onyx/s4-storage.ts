import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import type { User, UserRole } from "./auth";
import { DEFAULT_API_SETTINGS } from "./defaults";
import type { ApiSettings } from "./types";

export interface S4CloudImage {
  id: string;
  key: string;              
  bucket: string;           
  endpoint: string;         
  url: string;              
  displayUrl: string;       
  filename: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  prompt: string;
  aspectRatio?: string | undefined;
  category: "carousel" | "series" | "direct-prompt" | "ai-clone" | "upload" | string;
  sizeBytes: number;
  createdAt: string;
}

export const S4_DEFAULT_ENDPOINT = "socialgrow.s3.g.megas4.com";
export const S4_DEFAULT_BUCKET = "socialgrow";

function getSettings(): ApiSettings {
  if (typeof window === "undefined") return DEFAULT_API_SETTINGS;
  try {
    const raw = localStorage.getItem("onyx.apiSettings");
    return raw ? { ...DEFAULT_API_SETTINGS, ...JSON.parse(raw) } : DEFAULT_API_SETTINGS;
  } catch {
    return DEFAULT_API_SETTINGS;
  }
}

function getS3Client(): S3Client | null {
  const settings = getSettings();
  if (!settings.s4AccessKey || !settings.s4SecretKey) {
    return null; 
  }
  return new S3Client({
    region: settings.s4Region || "eu-central-1",
    endpoint: `https://${settings.s4Endpoint || S4_DEFAULT_ENDPOINT}`,
    credentials: {
      accessKeyId: settings.s4AccessKey,
      secretAccessKey: settings.s4SecretKey,
    },
    forcePathStyle: false, 
  });
}

export function getUserS4Folder(user: User | null): string {
  if (!user) return "USERCONTENT/users/guest";
  if (user.role === "admin") {
    return `USERCONTENT/admins/${user.id}`;
  }
  return `USERCONTENT/users/${user.id}`;
}

export async function listS4Images(
  user: User | null,
  folderFilter: "my" | "users" | "admins" | "all" = "my",
): Promise<S4CloudImage[]> {
  const client = getS3Client();
  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;

  if (!client) {
    console.warn("Mega S4 ist nicht konfiguriert (Access Key fehlt).");
    return [];
  }

  let prefix = "";
  if (!user) {
    prefix = "USERCONTENT/users/guest/";
  } else if (user.role !== "admin" || folderFilter === "my") {
    prefix = `${getUserS4Folder(user)}/`;
  } else if (folderFilter === "users") {
    prefix = "USERCONTENT/users/";
  } else if (folderFilter === "admins") {
    prefix = "USERCONTENT/admins/";
  } else {
    prefix = "USERCONTENT/";
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const response = await client.send(command);
    
    if (!response.Contents) return [];

    const images: S4CloudImage[] = response.Contents.map((obj) => {
      if (obj.Key?.endsWith("/")) return null;
      const filename = obj.Key!.split("/").pop() || obj.Key!;
      return {
        id: obj.Key!,
        key: obj.Key!,
        bucket: bucket,
        endpoint: settings.s4Endpoint || S4_DEFAULT_ENDPOINT,
        url: `https://${settings.s4Endpoint || S4_DEFAULT_ENDPOINT}/${obj.Key}`,
        displayUrl: `https://${settings.s4Endpoint || S4_DEFAULT_ENDPOINT}/${obj.Key}`,
        filename: filename,
        userId: user?.id || "unknown",
        userName: user?.name || "Unbekannt",
        userRole: user?.role || "free",
        prompt: "Aus Cloud geladen",
        category: "upload",
        sizeBytes: obj.Size || 0,
        createdAt: obj.LastModified?.toISOString() || new Date().toISOString(),
      };
    }).filter(Boolean) as S4CloudImage[];

    return images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Fehler beim Auflisten der S4 Bilder:", error);
    return [];
  }
}

export interface SaveImageToS4Params {
  imageUrl: string;
  prompt?: string | undefined;
  category: S4CloudImage["category"];
  aspectRatio?: string | undefined;
  user: User | null;
  customFilename?: string | undefined;
}

export async function saveImageToS4(params: SaveImageToS4Params): Promise<S4CloudImage | null> {
  const { imageUrl, prompt = "Generiertes Visual", category, aspectRatio = "4:5", user, customFilename } = params;
  const client = getS3Client();
  const settings = getSettings();
  const bucket = settings.s4Bucket || S4_DEFAULT_BUCKET;

  if (!client) {
    console.warn("Mega S4 ist nicht konfiguriert (Access Key fehlt). Abbruch.");
    return null;
  }

  const folder = getUserS4Folder(user);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = Date.now().toString().slice(-6);
  const cleanCategory = category.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = customFilename || `${dateStr}_${cleanCategory}_${timestamp}.jpg`;
  const key = `${folder}/${filename}`;

  try {
    let bodyData: Blob | Buffer | string;
    let contentType = "image/jpeg";
    
    if (imageUrl.startsWith("data:")) {
      const arr = imageUrl.split(",");
      const mime = (arr[0] && arr[0].match(/:(.*?);/)?.[1]) || "image/jpeg";
      contentType = mime;
      const bstr = atob(arr[1] || "");
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      bodyData = new Blob([u8arr], { type: mime });
    } else {
      const response = await fetch(imageUrl);
      bodyData = await response.blob();
      contentType = response.headers.get("content-type") || "image/jpeg";
    }

    const folderCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: `${folder}/`,
      Body: "",
    });
    await client.send(folderCommand).catch(() => {});

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyData as any,
      ContentType: contentType,
    });

    await client.send(command);
    window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: 1 } }));

    return {
      id: key,
      key,
      bucket,
      endpoint: settings.s4Endpoint || S4_DEFAULT_ENDPOINT,
      url: `https://${settings.s4Endpoint || S4_DEFAULT_ENDPOINT}/${key}`,
      displayUrl: `https://${settings.s4Endpoint || S4_DEFAULT_ENDPOINT}/${key}`,
      filename,
      userId: user?.id || "guest",
      userName: user?.name || "Gast",
      userRole: user?.role || "free",
      prompt,
      aspectRatio,
      category,
      sizeBytes: (bodyData as Blob).size || 2000000,
      createdAt: now.toISOString(),
    };
  } catch (error) {
    console.error("Fehler beim Upload zu S4:", error);
    return null;
  }
}

export async function deleteS4Image(key: string): Promise<boolean> {
  const client = getS3Client();
  const settings = getSettings();
  if (!client) return false;
  try {
    const command = new DeleteObjectCommand({
      Bucket: settings.s4Bucket || S4_DEFAULT_BUCKET,
      Key: key,
    });
    await client.send(command);
    window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: -1 } }));
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des S4 Bildes:", error);
    return false;
  }
}

export async function deleteBatchS4Images(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const client = getS3Client();
  const settings = getSettings();
  if (!client) return 0;
  try {
    const command = new DeleteObjectsCommand({
      Bucket: settings.s4Bucket || S4_DEFAULT_BUCKET,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      }
    });
    const response = await client.send(command);
    window.dispatchEvent(new CustomEvent("onyx:s4-update", { detail: { count: -keys.length } }));
    return response.Deleted?.length || 0;
  } catch (error) {
    console.error("Fehler beim Batch-Löschen der S4 Bilder:", error);
    return 0;
  }
}

export async function getS4StorageStats(user: User | null, folderFilter: "my" | "users" | "admins" | "all" = "my") {
  const images = await listS4Images(user, folderFilter);
  const totalBytes = images.reduce((acc, img) => acc + img.sizeBytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const folder = getUserS4Folder(user);
  return {
    count: images.length,
    totalBytes,
    formattedSize: `${totalMB} MB`,
    folder,
  };
}
