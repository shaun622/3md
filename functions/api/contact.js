// Common spam keywords (case-insensitive)
const SPAM_KEYWORDS = [
  'seo service', 'seo services', 'rank your website', 'rank #1', 'backlinks',
  'guest post', 'link exchange', 'crypto', 'bitcoin', 'investment opportunity',
  'loan offer', 'make money fast', 'viagra', 'casino', 'sex chat',
  'adult site', 'escort', 'cheap hosting', 'web design offer', 'hire us for',
  'outsource', 'increase traffic', 'buy followers',
];

const MAX_URLS = 2;

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  const fail = (msg, status = 400) =>
    new Response(JSON.stringify({ success: false, message: msg }), { status, headers: cors });

  // Always return success-looking response to bots so they don't iterate
  const silentFail = () =>
    new Response(JSON.stringify({ success: true }), { headers: cors });

  try {
    const formData = await request.formData();
    const name = (formData.get('name') || '').trim();
    const email = (formData.get('email') || '').trim();
    const message = (formData.get('message') || '').trim();
    const honeypot1 = formData.get('website');
    const honeypot2 = formData.get('company_url');
    const honeypot3 = formData.get('botcheck');
    const ts = parseInt(formData.get('ts') || '0', 10);
    const turnstileToken = formData.get('cf-turnstile-response');

    // 1. Honeypot check — if any are filled, it's a bot
    if (honeypot1 || honeypot2 || honeypot3) {
      return silentFail();
    }

    // 2. Time-to-submit check — humans take >3 seconds
    if (ts > 0) {
      const elapsed = Date.now() - ts;
      if (elapsed < 3000) {
        return silentFail();
      }
    }

    // 3. Basic validation
    if (!name || !email || !message) {
      return fail('All fields are required.');
    }
    if (name.length < 2 || name.length > 80) return fail('Invalid name.');
    if (message.length < 10 || message.length > 3000) return fail('Message too short or too long.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Invalid email address.');

    // 4. Cloudflare Turnstile verification
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) return silentFail();

      const ip = request.headers.get('CF-Connecting-IP') || '';
      const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }),
      });
      const tsData = await tsRes.json();
      if (!tsData.success) {
        return silentFail();
      }
    }

    // 5. Content heuristics
    const combined = `${name} ${message}`.toLowerCase();

    // URL count check
    const urlMatches = message.match(/https?:\/\/|www\./gi) || [];
    if (urlMatches.length > MAX_URLS) {
      return silentFail();
    }

    // Spam keywords
    for (const keyword of SPAM_KEYWORDS) {
      if (combined.includes(keyword)) {
        return silentFail();
      }
    }

    // Cyrillic / non-Latin alphabet flood (common in spam)
    const nonLatinMatches = message.match(/[\u0400-\u04FF\u0500-\u052F\u4E00-\u9FFF]/g) || [];
    if (nonLatinMatches.length > message.length * 0.3) {
      return silentFail();
    }

    // Repeat character check (e.g. aaaaaa)
    if (/(.)\1{9,}/.test(message)) {
      return silentFail();
    }

    // 6. Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `3MD Website <noreply@${env.FROM_DOMAIN || '3md.com.au'}>`,
        to: [env.CONTACT_EMAIL || 'shaun@3md.com.au'],
        subject: `New enquiry from ${name}`,
        reply_to: email,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #E8873D; margin-bottom: 24px;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>
            <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">Sent from 3md.com.au contact form</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      throw new Error('Email send failed');
    }

    return new Response(JSON.stringify({ success: true }), { headers: cors });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to send message. Please try again.' }),
      { status: 500, headers: cors }
    );
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
