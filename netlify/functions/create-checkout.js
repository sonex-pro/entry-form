// create-checkout.js
exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    let formData = {};
    try {
      formData = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON body" })
      };
    }

    console.log("Form data received:", formData);

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" })
      };
    }

    const host = event.headers?.host;
    const proto = event.headers?.['x-forwarded-proto'] || 'http';
    const origin = host ? `${proto}://${host}` : '';

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', origin ? `${origin}/?payment=success` : 'https://example.com');
    params.set('cancel_url', origin ? `${origin}/?payment=cancelled` : 'https://example.com');
    params.set('line_items[0][price_data][currency]', 'gbp');
    params.set('line_items[0][price_data][product_data][name]', 'BATTS Tournament Entry');
    params.set('line_items[0][price_data][unit_amount]', '3400');
    params.set('line_items[0][quantity]', '1');

    if (formData.email) params.set('customer_email', String(formData.email));
    if (formData.name) params.set('metadata[name]', String(formData.name));
    if (formData.phone) params.set('metadata[phone]', String(formData.phone));
    if (formData.gender) params.set('metadata[gender]', String(formData.gender));

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const stripeText = await stripeRes.text();
    let stripeJson;
    try {
      stripeJson = JSON.parse(stripeText);
    } catch (e) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Stripe returned non-JSON response' })
      };
    }

    if (!stripeRes.ok) {
      return {
        statusCode: stripeRes.status,
        headers,
        body: JSON.stringify({ error: stripeJson?.error?.message || 'Stripe error' })
      };
    }

    const sessionId = stripeJson.id;
    if (!sessionId) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Stripe did not return a session id' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, sessionId })
    };

  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};