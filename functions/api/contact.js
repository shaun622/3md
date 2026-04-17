export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const formData = await context.request.formData();
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();

    // Honeypot check
    if (formData.get('botcheck')) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `3MD Website <noreply@${context.env.FROM_DOMAIN || '3md.com.au'}>`,
        to: [context.env.CONTACT_EMAIL || 'hello@3md.com.au'],
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
      const err = await res.json();
      throw new Error(err.message || 'Resend API error');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to send message. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
