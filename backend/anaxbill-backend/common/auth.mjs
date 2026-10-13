export function getCompanyId(event) {
  const claims =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims ||
    null;

  if (!claims) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const companyId = claims.sub;
  if (!companyId) {
    throw Object.assign(new Error("Missing sub claim"), { statusCode: 401 });
  }

  return {
    companyId,
    email: claims.email || null,
    name: claims.name || null,
  };
}
