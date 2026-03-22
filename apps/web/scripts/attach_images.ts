
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const findings = await prisma.finding.findMany({
    include: { images: true }
  });
  const images = await prisma.image.findMany();

  if (images.length === 0) {
    console.log("No images available to attach.");
    return;
  }

  console.log(`Found ${findings.length} findings and ${images.length} images.`);

  for (const finding of findings) {
    if (finding.images.length > 0) {
        console.log(`Skipping finding: ${finding.name || finding.id} - already has ${finding.images.length} images.`);
        continue;
    }

    // Determine how many images to add (randomly between 2 and 5, but capped by available images)
    const count = Math.min(images.length, Math.floor(Math.random() * 4) + 2);
    
    // Pick random images
    const shuffled = [...images].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    console.log(`Attaching ${selected.length} images to finding: ${finding.name || finding.id}`);

    await prisma.finding.update({
      where: { id: finding.id },
      data: {
        images: {
          connect: selected.map(img => ({ id: img.id }))
        },
        thumbnailId: finding.thumbnailId || selected[0].id
      }
    });
  }

  console.log("Done!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
