export type SignatureProvider = 
  | 'auto'
  | 'stripe'
  | 'github'
  | 'shopify'
  | 'clerk'
  | 'custom_hmac_sha256'
  | 'none';

export type SignatureStatus = 'verified' | 'failed' | 'unsigned' | 'missing_secret';

export interface SignatureDetails {
  provider: string;
  headerName?: string;
  expectedSignature?: string;
  receivedSignature?: string;
  verified: boolean;
  message: string;
}

export interface ForwardResponse {
  statusCode: number;
  statusText: string;
  timeMs: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
}

export interface WebhookEvent {
  id: string;
  endpointId: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, any>;
  rawBody: string;
  body: any;
  clientIp: string;
  signatureStatus: SignatureStatus;
  signatureDetails?: SignatureDetails;
  timestamp: number;
  sizeBytes: number;
  forwardStatus: 'pending' | 'success' | 'failed' | 'disabled';
  forwardResponse?: ForwardResponse;
}

export interface Endpoint {
  id: string;
  name: string;
  description?: string;
  secret?: string;
  signatureProvider: SignatureProvider;
  forwardUrl?: string;
  forwardEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  totalEventsCount: number;
}

export interface ReplayRequest {
  eventId?: string;
  endpointId: string;
  targetUrl: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

export interface SchemaSynthesisResult {
  typescript: string;
  zod: string;
  pythonPydantic: string;
  goStruct: string;
  verificationSnippet: {
    express: string;
    nextjs: string;
  };
  insights: {
    title: string;
    detectedProvider: string;
    fieldCount: number;
    hasPII: boolean;
    piiFields: string[];
    summary: string;
  };
}
