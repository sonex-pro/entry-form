export async function handler(event, context) {
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
    // If form data is sent as FormData, it comes as raw text
    const formData = JSON.parse(event.body || "{}"); 

    console.log("Form data received:", formData);

    // Replace with your Google Script URL or Stripe session creation
    // Example: sending form data to Google Script
    const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    const googleResult = await response.json();

    // Simulate Stripe session ID (replace this with real Stripe API call)
    const sessionId = "test-session-123";

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
}