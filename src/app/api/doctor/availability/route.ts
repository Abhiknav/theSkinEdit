import { requireDoctor } from "@/server/auth/doctor";
import { addBlock, getSchedule, removeBlock, saveAvailabilityRules } from "@/server/booking/admin";
import { fail, ok, readJson } from "@/server/http";
import { availabilityPayloadSchema, blockSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDoctor();
    const { rules, blocks } = await getSchedule();
    return ok({ rules, blocks });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireDoctor();
    const { rules } = availabilityPayloadSchema.parse(await readJson(request));
    const saved = await saveAvailabilityRules(rules);
    return ok({ rules: saved });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireDoctor();
    const input = blockSchema.parse(await readJson(request));
    const { block, conflicts } = await addBlock(input.startAt, input.endAt, input.reason ?? null);
    return ok({ block, conflicts }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireDoctor();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return ok({ error: "Missing block id" }, { status: 400 });
    await removeBlock(id);
    return ok({ removed: true });
  } catch (error) {
    return fail(error);
  }
}
