type SessionClaims = Record<string, unknown>;

export function isMaintenanceModeEnabled(): boolean {
  const maintenanceModeValue = (
    process.env.MAINTENANCE_MODE ?? ""
  ).toLowerCase();
  return maintenanceModeValue === "true" || maintenanceModeValue === "1";
}

const EMAIL_KEYS = ["email", "email_address", "preferred_email"] as const;
const USERNAME_KEYS = ["username", "preferred_username", "user_name"] as const;

export function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .toLowerCase();
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function pushIfString(target: string[], value: unknown) {
  const parsed = toStringValue(value);
  if (parsed) {
    target.push(parsed);
  }
}

function collectEmailAddresses(target: string[], value: unknown) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const entry of value) {
    if (typeof entry === "string") {
      target.push(entry);
      continue;
    }

    if (!entry || typeof entry !== "object") {
      continue;
    }

    const emailObject = entry as Record<string, unknown>;
    pushIfString(target, emailObject.emailAddress);
    pushIfString(target, emailObject.email_address);
    pushIfString(target, emailObject.value);
  }
}

export function getMaintenanceBypassIdentifiers(): Set<string> {
  return new Set(
    (process.env.MAINTENANCE_BYPASS_USER_IDS ?? "")
      .split(",")
      .map(normalizeIdentifier)
      .filter(Boolean)
  );
}

export function getAuthIdentifiers({
  userId,
  sessionClaims,
}: {
  userId?: string | null;
  sessionClaims?: unknown;
}): string[] {
  const claims =
    sessionClaims && typeof sessionClaims === "object"
      ? (sessionClaims as SessionClaims)
      : {};

  const identifiers: string[] = [];

  pushIfString(identifiers, userId);
  pushIfString(identifiers, claims.sub);

  for (const key of USERNAME_KEYS) {
    pushIfString(identifiers, claims[key]);
  }

  for (const key of EMAIL_KEYS) {
    pushIfString(identifiers, claims[key]);
  }

  collectEmailAddresses(identifiers, claims.email_addresses);

  return Array.from(new Set(identifiers.map(normalizeIdentifier)));
}

export function hasMaintenanceBypassAccess({
  userId,
  sessionClaims,
}: {
  userId?: string | null;
  sessionClaims?: unknown;
}): boolean {
  const bypassIdentifiers = getMaintenanceBypassIdentifiers();
  if (bypassIdentifiers.size === 0) {
    return false;
  }

  const authIdentifiers = getAuthIdentifiers({ userId, sessionClaims });
  return authIdentifiers.some((identifier) =>
    bypassIdentifiers.has(identifier)
  );
}
