import { login, logout } from "@/server/auth/doctor";
import { fail, ok, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await readJson(request)) as { email?: string; password?: string };
    await login(String(body.email ?? ""), String(body.password ?? ""));
    return ok({ signedIn: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  await logout();
  return ok({ signedIn: false });
}
