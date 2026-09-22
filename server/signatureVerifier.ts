import crypto from 'crypto';
import { SignatureDetails, SignatureProvider, SignatureStatus } from './types.js';

export function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
  secret?: string,
  configuredProvider: SignatureProvider = 'auto'
): { status: SignatureStatus; details?: SignatureDetails } {
  // Normalize header keys to lowercase
  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v !== undefined) {
      normalizedHeaders[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
    }
  }

  // Auto-detect provider if configured as 'auto'
  let provider = configuredProvider;
  if (provider === 'auto') {
    if (normalizedHeaders['stripe-signature']) {
      provider = 'stripe';
    } else if (normalizedHeaders['x-hub-signature-256'] || normalizedHeaders['x-hub-signature']) {
      provider = 'github';
    } else if (normalizedHeaders['x-shopify-hmac-sha256']) {
      provider = 'shopify';
    } else if (normalizedHeaders['svix-signature'] || normalizedHeaders['clerk-signature']) {
      provider = 'clerk';
    } else if (normalizedHeaders['x-signature'] || normalizedHeaders['x-webhook-signature']) {
      provider = 'custom_hmac_sha256';
    } else {
      provider = 'none';
    }
  }

  if (provider === 'none') {
    return {
      status: 'unsigned',
      details: {
        provider: 'none',
        verified: false,
        message: 'No signature header detected or provider set to none'
      }
    };
  }

  if (!secret) {
    return {
      status: 'missing_secret',
      details: {
        provider,
        verified: false,
        message: `Detected ${provider} signature, but no endpoint secret is configured.`
      }
    };
  }

  try {
    switch (provider) {
      case 'stripe': {
        const header = normalizedHeaders['stripe-signature'];
        if (!header) {
          return {
            status: 'failed',
            details: {
              provider: 'Stripe',
              headerName: 'stripe-signature',
              verified: false,
              message: 'Missing stripe-signature header'
            }
          };
        }

        // Stripe header format: t=1612345678,v1=abc1234...,v0=...
        const parts = header.split(',');
        let timestamp = '';
        const signatures: string[] = [];

        for (const part of parts) {
          const [key, value] = part.split('=');
          if (key.trim() === 't') timestamp = value.trim();
          if (key.trim() === 'v1') signatures.push(value.trim());
        }

        if (!timestamp || signatures.length === 0) {
          return {
            status: 'failed',
            details: {
              provider: 'Stripe',
              headerName: 'stripe-signature',
              receivedSignature: header,
              verified: false,
              message: 'Invalid stripe-signature format (expected t=... and v1=...)'
            }
          };
        }

        const signedPayload = `${timestamp}.${rawBody}`;
        const hmac = crypto.createHmac('sha256', secret);
        const expectedSignature = hmac.update(signedPayload, 'utf8').digest('hex');

        const isValid = signatures.some(sig => {
          try {
            return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSignature, 'hex'));
          } catch {
            return sig.toLowerCase() === expectedSignature.toLowerCase();
          }
        });

        return {
          status: isValid ? 'verified' : 'failed',
          details: {
            provider: 'Stripe',
            headerName: 'stripe-signature',
            receivedSignature: signatures[0],
            expectedSignature,
            verified: isValid,
            message: isValid ? 'Stripe HMAC-SHA256 signature verified successfully.' : 'Stripe signature mismatch.'
          }
        };
      }

      case 'github': {
        const sha256Header = normalizedHeaders['x-hub-signature-256'];
        const sha1Header = normalizedHeaders['x-hub-signature'];
        const header = sha256Header || sha1Header;

        if (!header) {
          return {
            status: 'failed',
            details: {
              provider: 'GitHub',
              headerName: 'x-hub-signature-256',
              verified: false,
              message: 'Missing x-hub-signature-256 header'
            }
          };
        }

        const isSha256 = !!sha256Header;
        const algo = isSha256 ? 'sha256' : 'sha1';
        const prefix = isSha256 ? 'sha256=' : 'sha1=';
        const receivedHex = header.startsWith(prefix) ? header.slice(prefix.length) : header;

        const expectedHex = crypto.createHmac(algo, secret).update(rawBody, 'utf8').digest('hex');
        
        let isValid = false;
        try {
          isValid = crypto.timingSafeEqual(Buffer.from(receivedHex, 'hex'), Buffer.from(expectedHex, 'hex'));
        } catch {
          isValid = receivedHex.toLowerCase() === expectedHex.toLowerCase();
        }

        return {
          status: isValid ? 'verified' : 'failed',
          details: {
            provider: 'GitHub',
            headerName: isSha256 ? 'x-hub-signature-256' : 'x-hub-signature',
            receivedSignature: header,
            expectedSignature: `${prefix}${expectedHex}`,
            verified: isValid,
            message: isValid ? `GitHub ${algo.toUpperCase()} signature verified.` : 'GitHub signature mismatch.'
          }
        };
      }

      case 'shopify': {
        const header = normalizedHeaders['x-shopify-hmac-sha256'];
        if (!header) {
          return {
            status: 'failed',
            details: {
              provider: 'Shopify',
              headerName: 'x-shopify-hmac-sha256',
              verified: false,
              message: 'Missing x-shopify-hmac-sha256 header'
            }
          };
        }

        const expectedBase64 = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
        const isValid = expectedBase64 === header.trim();

        return {
          status: isValid ? 'verified' : 'failed',
          details: {
            provider: 'Shopify',
            headerName: 'x-shopify-hmac-sha256',
            receivedSignature: header,
            expectedSignature: expectedBase64,
            verified: isValid,
            message: isValid ? 'Shopify Base64 HMAC-SHA256 verified.' : 'Shopify signature mismatch.'
          }
        };
      }

      case 'clerk': {
        const svixId = normalizedHeaders['svix-id'] || normalizedHeaders['clerk-id'];
        const svixTimestamp = normalizedHeaders['svix-timestamp'] || normalizedHeaders['clerk-timestamp'];
        const svixSignature = normalizedHeaders['svix-signature'] || normalizedHeaders['clerk-signature'];

        if (!svixSignature || !svixId || !svixTimestamp) {
          return {
            status: 'failed',
            details: {
              provider: 'Clerk / Svix',
              headerName: 'svix-signature',
              verified: false,
              message: 'Missing svix-id, svix-timestamp, or svix-signature header'
            }
          };
        }

        // Secret in Svix starts with "whsec_" and base64 encoded
        const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret;
        const secretBuffer = Buffer.from(secretKey, 'base64');
        
        const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
        const computedHmac = crypto.createHmac('sha256', secretBuffer.length > 0 ? secretBuffer : secret)
          .update(signedContent, 'utf8')
          .digest('base64');

        const passedSignatures = svixSignature.split(' ').map(s => s.startsWith('v1,') ? s.slice(3) : s);
        const isValid = passedSignatures.includes(computedHmac);

        return {
          status: isValid ? 'verified' : 'failed',
          details: {
            provider: 'Clerk / Svix',
            headerName: 'svix-signature',
            receivedSignature: svixSignature,
            expectedSignature: `v1,${computedHmac}`,
            verified: isValid,
            message: isValid ? 'Clerk/Svix signature verified successfully.' : 'Clerk/Svix signature mismatch.'
          }
        };
      }

      case 'custom_hmac_sha256': {
        const headerName = Object.keys(normalizedHeaders).find(k => 
          k.includes('signature') || k.includes('token') || k.includes('hash')
        ) || 'x-signature';
        
        const received = normalizedHeaders[headerName];
        if (!received) {
          return {
            status: 'failed',
            details: {
              provider: 'Custom HMAC',
              headerName,
              verified: false,
              message: `Missing signature header (${headerName})`
            }
          };
        }

        const expectedHex = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
        const isValid = received.toLowerCase() === expectedHex.toLowerCase() ||
                        received === `sha256=${expectedHex}`;

        return {
          status: isValid ? 'verified' : 'failed',
          details: {
            provider: 'Custom HMAC-SHA256',
            headerName,
            receivedSignature: received,
            expectedSignature: expectedHex,
            verified: isValid,
            message: isValid ? 'Custom HMAC-SHA256 verified.' : 'Custom signature mismatch.'
          }
        };
      }

      default:
        return {
          status: 'unsigned',
          details: {
            provider: 'unknown',
            verified: false,
            message: 'Unrecognized signature provider'
          }
        };
    }
  } catch (err: any) {
    return {
      status: 'failed',
      details: {
        provider: String(provider),
        verified: false,
        message: `Verification error: ${err.message}`
      }
    };
  }
}
