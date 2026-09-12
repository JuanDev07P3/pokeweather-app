/**
 * Minimal HTTP layer shared by every service.
 * Kept tiny on purpose — swap in axios here and every service keeps working.
 */

export class ApiError extends Error {
  status: number;
  url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
  }
}

export async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError("Sin conexión: revisa tu red e inténtalo de nuevo.", 0, url);
  }
  if (!res.ok) {
    throw new ApiError(
      `La API respondió ${res.status} ${res.statusText}`,
      res.status,
      url,
    );
  }
  return (await res.json()) as T;
}
