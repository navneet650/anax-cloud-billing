export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export function ok(body) {
  return json(200, body);
}

export function created(body) {
  return json(201, body);
}

export function badRequest(message, details) {
  return json(400, { error: message, details });
}

export function unauthorized(message = "Unauthorized") {
  return json(401, { error: message });
}

export function notFound(message = "Not found") {
  return json(404, { error: message });
}

export function serverError(message = "Internal server error", details) {
  return json(500, { error: message, details });
}

export function handleError(err) {
  console.error("Error:", err);
  const status = err.statusCode || 500;
  return json(status, { error: err.message || "Internal server error" });
}
