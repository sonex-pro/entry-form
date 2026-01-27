export async function handler(event, context) {
  try {
    // Only accept POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // Log form data for debugging
    console.log("Form data received:", event.body);

    // Return dummy response
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, sessionId: "test-session-123" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}