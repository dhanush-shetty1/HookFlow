import crypto from 'crypto';

export interface MockWebhookTemplate {
  id: string;
  name: string;
  provider: 'stripe' | 'github' | 'shopify' | 'clerk' | 'twilio' | 'discord';
  event: string;
  method: string;
  headers: Record<string, string>;
  getBody: () => any;
}

export const MOCK_TEMPLATES: {
  id: string;
  name: string;
  provider: 'stripe' | 'github' | 'shopify' | 'clerk' | 'twilio' | 'discord';
  event: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}[] = [
  {
    id: 'stripe_payment_succeeded',
    name: 'Stripe: payment_intent.succeeded',
    provider: 'stripe',
    event: 'payment_intent.succeeded',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      'stripe-signature': 't={TIMESTAMP},v1={SIGNATURE}'
    },
    body: {
      id: 'evt_3N8x762eZvKYlo2C1g9Y1234',
      object: 'event',
      api_version: '2023-10-16',
      created: 1700000000,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3N8x762eZvKYlo2C1GHI9876',
          object: 'payment_intent',
          amount: 4999,
          amount_received: 4999,
          currency: 'usd',
          status: 'succeeded',
          customer: 'cus_P92kxlAK189',
          receipt_email: 'alex.developer@example.com',
          payment_method_types: ['card'],
          metadata: {
            order_id: 'ord_9872134',
            tier: 'pro_annual'
          },
          charges: {
            object: 'list',
            total_count: 1,
            data: [
              {
                id: 'ch_3N8x762eZvKYlo2C1xyz',
                paid: true,
                payment_method_details: {
                  card: {
                    brand: 'visa',
                    last4: '4242',
                    exp_month: 12,
                    exp_year: 2028
                  }
                }
              }
            ]
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_8zK1j8KlM',
        idempotency_key: '5f9b4c2e-8e12-4d56-b3a1'
      }
    }
  },
  {
    id: 'stripe_checkout_completed',
    name: 'Stripe: checkout.session.completed',
    provider: 'stripe',
    event: 'checkout.session.completed',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 't={TIMESTAMP},v1={SIGNATURE}'
    },
    body: {
      id: 'evt_1N9y882eZvKYlo2C9901',
      object: 'event',
      type: 'checkout.session.completed',
      created: 1700000000,
      data: {
        object: {
          id: 'cs_test_a1b2c3d4e5f6',
          object: 'checkout.session',
          amount_total: 12900,
          currency: 'usd',
          customer_email: 'sarah.founder@startup.io',
          payment_status: 'paid',
          mode: 'subscription',
          subscription: 'sub_1N9y882eZvKYlo2Csubscription'
        }
      }
    }
  },
  {
    id: 'github_push',
    name: 'GitHub: push (main branch)',
    provider: 'github',
    event: 'push',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'GitHub-Hookshot/1.0',
      'x-github-event': 'push',
      'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
      'x-hub-signature-256': 'sha256={SIGNATURE}'
    },
    body: {
      ref: 'refs/heads/main',
      before: '6113728f27ae82c7b1a12f6793da7fbd4e1e9a3d',
      after: '0000000000000000000000000000000000000000',
      repository: {
        id: 1296269,
        name: 'HookFlow',
        full_name: 'octocat/HookFlow',
        private: false,
        owner: {
          name: 'octocat',
          email: 'octocat@github.com'
        },
        html_url: 'https://github.com/octocat/HookFlow'
      },
      pusher: {
        name: 'octocat',
        email: 'octocat@github.com'
      },
      sender: {
        login: 'octocat',
        id: 1,
        avatar_url: 'https://github.com/images/error/octocat_happy.gif'
      },
      commits: [
        {
          id: '0d1a26e67d8f5eaf1f6ba5c57fc3c7d91ac0fd1c',
          message: 'feat: add real-time webhook proxy & replay engine',
          timestamp: '2026-09-01T14:30:00.000Z',
          author: {
            name: 'Octocat Dev',
            email: 'octocat@github.com'
          },
          added: ['server/index.ts', 'client/src/App.tsx'],
          removed: [],
          modified: ['package.json']
        }
      ]
    }
  },
  {
    id: 'github_pull_request',
    name: 'GitHub: pull_request.opened',
    provider: 'github',
    event: 'pull_request',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'pull_request',
      'x-hub-signature-256': 'sha256={SIGNATURE}'
    },
    body: {
      action: 'opened',
      number: 42,
      pull_request: {
        id: 1347,
        title: 'feat: AI Schema Synthesizer for Zod & TypeScript',
        state: 'open',
        user: {
          login: 'dhanush-dev',
          id: 583231
        },
        body: 'Implements sub-second schema generation and live local replaying.',
        created_at: '2026-09-01T14:30:00.000Z'
      },
      repository: {
        name: 'HookFlow',
        full_name: 'developer/HookFlow'
      }
    }
  },
  {
    id: 'clerk_user_created',
    name: 'Clerk: user.created',
    provider: 'clerk',
    event: 'user.created',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_2NX68z8119X2',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,{SIGNATURE}'
    },
    body: {
      data: {
        id: 'user_2NX68z8119X2K3jLq',
        first_name: 'Jane',
        last_name: 'Developer',
        email_addresses: [
          {
            email_address: 'jane.dev@acme.inc',
            id: 'idn_2NX68y7228Y1',
            verification: {
              status: 'verified',
              strategy: 'ticket'
            }
          }
        ],
        primary_email_address_id: 'idn_2NX68y7228Y1',
        profile_image_url: 'https://images.clerk.dev/static/avatars/user.png',
        created_at: 1700000000,
        updated_at: 1700000000
      },
      object: 'event',
      type: 'user.created'
    }
  },
  {
    id: 'shopify_order_created',
    name: 'Shopify: orders/create',
    provider: 'shopify',
    event: 'orders/create',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-shopify-topic': 'orders/create',
      'x-shopify-shop-domain': 'acme-gear.myshopify.com',
      'x-shopify-hmac-sha256': '{SIGNATURE}'
    },
    body: {
      id: 820982911946154500,
      email: 'customer@buyer.com',
      currency: 'USD',
      current_total_price: '249.00',
      financial_status: 'paid',
      line_items: [
        {
          id: 703073504,
          product_id: 632910392,
          title: 'Ergonomic Mechanical Keyboard',
          price: '249.00',
          quantity: 1,
          sku: 'KB-RGB-01'
        }
      ],
      customer: {
        id: 115315627,
        first_name: 'Alex',
        last_name: 'Smith',
        email: 'customer@buyer.com'
      }
    }
  }
];

export function buildMockPayload(templateId: string, secret?: string) {
  const template = MOCK_TEMPLATES.find(t => t.id === templateId) || MOCK_TEMPLATES[0];
  const now = Math.floor(Date.now() / 1000);
  
  // Clone body and update dynamic timestamp
  const body = JSON.parse(JSON.stringify(template.body));
  if (body.created) body.created = now;
  if (body.data?.object?.created) body.data.object.created = now;

  const rawBody = JSON.stringify(body);
  const headers: Record<string, string> = { ...template.headers };

  // Always use a valid secret key
  const effectiveSecret = (secret && secret.trim().length > 0) 
    ? secret.trim() 
    : 'whsec_test_secret_1234567890abcdef';

  if (template.provider === 'stripe') {
    const timestamp = String(now);
    const signedPayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', effectiveSecret).update(signedPayload, 'utf8').digest('hex');
    headers['stripe-signature'] = `t=${timestamp},v1=${hmac}`;
  } else if (template.provider === 'github') {
    const hmac = crypto.createHmac('sha256', effectiveSecret).update(rawBody, 'utf8').digest('hex');
    headers['x-hub-signature-256'] = `sha256=${hmac}`;
  } else if (template.provider === 'shopify') {
    const hmac = crypto.createHmac('sha256', effectiveSecret).update(rawBody, 'utf8').digest('base64');
    headers['x-shopify-hmac-sha256'] = hmac;
  } else if (template.provider === 'clerk') {
    const svixId = 'msg_' + Math.random().toString(36).substring(2, 10);
    const svixTimestamp = String(now);
    headers['svix-id'] = svixId;
    headers['svix-timestamp'] = svixTimestamp;

    const secretKey = effectiveSecret.startsWith('whsec_') ? effectiveSecret.slice(6) : effectiveSecret;
    let secretBuffer = Buffer.from(secretKey, 'base64');
    if (secretBuffer.length === 0) {
      secretBuffer = Buffer.from(effectiveSecret, 'utf8');
    }
    
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', secretBuffer.length > 0 ? secretBuffer : effectiveSecret)
      .update(signedContent, 'utf8')
      .digest('base64');
    headers['svix-signature'] = `v1,${hmac}`;
  }

  return {
    template,
    headers,
    body,
    rawBody,
    effectiveSecret
  };
}
