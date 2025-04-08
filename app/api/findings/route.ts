import { findingSchemaCompleted } from "@/schemas/finding";

export async function POST(req: Request) {
  const body = await req.json();
  const parseResult = findingSchemaCompleted.safeParse(body);

  if (!parseResult.success) {
    return Response.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  console.log({ data });
}
