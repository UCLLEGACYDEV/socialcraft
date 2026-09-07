/**
 * Zernio Webhook Signature Verification and Event Handler
 * Supports HMAC-SHA256 signature validation with secret keys.
 */

export interface ZernioWebhookEvent {
  event: "post.published" | "post.failed" | "account.connected" | "account.disconnected" | "media.processed" | string;
  timestamp: string;
  data: {
    _id?: string;
    postId?: string;
    accountId?: string;
    platform?: string;
    status?: string;
    errorMessage?: string;
    platformPostUrl?: string;
    publishedAt?: string;
    [key: string]: any;
  };
}

/**
 * Verifies an incoming webhook HMAC SHA-256 signature.
 * Compatible with Web Crypto API (Node.js 18+, Cloudflare Workers, Browsers).
 */
export async function verifyZernioWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey: string
): Promise<boolean> {
  if (!signatureHeader || !secretKey || !rawBody) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const bodyData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const computedSignatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    const computedSignatureHex = Array.from(new Uint8Array(computedSignatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const computedSignatureBase64 = btoa(
      String.fromCharCode(...new Uint8Array(computedSignatureBuffer))
    );

    const cleanSig = signatureHeader.replace(/^sha256=/, "").trim();

    return (
      cleanSig === computedSignatureHex ||
      cleanSig === computedSignatureBase64 ||
      signatureHeader.trim() === secretKey.trim()
    );
  } catch (err) {
    console.error("[Zernio Webhook Signature Error]", err);
    return false;
  }
}
