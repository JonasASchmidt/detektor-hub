import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import FindingCard from "@/app/(app)/findings/_components/FindingCard";
import { FindingWithRelations } from "@/types/FindingWithRelations";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true },
  });

  if (!user) notFound();

  const findings = (await prisma.finding.findMany({
    where: { userId, status: "COMPLETED" },
    include: { images: true, tags: true, user: true, comments: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  })) as FindingWithRelations[];

  return (
    <div className="px-4 pb-10 pt-12 md:px-10 md:pt-16 max-w-[720px] mx-auto w-full space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-full">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Profil"} />
          <AvatarFallback className="rounded-full bg-[#2d2d2d] text-white text-xl font-bold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.name ?? "Unbekannt"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{findings.length} {findings.length === 1 ? "Fund" : "Funde"}</p>
        </div>
      </div>

      {findings.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch keine Funde veröffentlicht.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
