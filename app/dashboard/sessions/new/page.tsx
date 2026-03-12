import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SessionForm from "../_components/SessionForm";

export default async function NewSessionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const detectors = await prisma.detector.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 max-w-[720px] mx-auto w-full">
      <SessionForm detectors={detectors} />
    </div>
  );
}
