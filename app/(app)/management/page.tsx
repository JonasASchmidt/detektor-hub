import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldIcon, UsersIcon, BadgeIcon } from "lucide-react";
import Link from "next/link";

// Guard: only ADMIN or OFFICIAL may access management pages
async function requireManagementAccess() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "OFFICIAL") {
    redirect("/findings");
  }
  return session;
}

const cards = [
  {
    title: "Benutzer",
    description: "Alle Benutzer in deiner Verwaltungseinheit einsehen und verwalten.",
    href: "/management/users",
    icon: UsersIcon,
  },
  {
    title: "Rollen",
    description: "Rollen und Berechtigungen für deine Region erstellen und zuweisen.",
    href: "/management/roles",
    icon: BadgeIcon,
  },
];

export default async function ManagementPage() {
  const session = await requireManagementAccess();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="px-6 pb-6 pt-12 md:px-10 md:pb-10 md:pt-16 space-y-8 max-w-[720px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <ShieldIcon className="h-8 w-8 shrink-0" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">Verwaltung</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Plattform-Administration"
              : "Bereichsverwaltung für Beauftragte"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border bg-card p-5 flex flex-col gap-3 hover:border-foreground transition-colors duration-150"
          >
            <card.icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">{card.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
