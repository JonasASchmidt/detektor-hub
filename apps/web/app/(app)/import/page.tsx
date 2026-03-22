import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ImportWizard from "./_components/ImportWizard";

export const metadata = { title: "Importieren" };

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const sessions = await prisma.fieldSession.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
    orderBy: { dateFrom: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 pb-12">
      <h1 className="text-4xl font-bold mb-1">Importieren</h1>
      <p className="text-muted-foreground mb-8">
        GPX-Dateien (GoTerrain, Garmin) oder geo-getaggte Fotos importieren.
      </p>
      <ImportWizard existingSessions={sessions} />
    </div>
  );
}
