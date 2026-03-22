import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in database!");
    return;
  }

  // Generate 20 mock images of detector finds
  for (let i = 0; i < 20; i++) {
    await prisma.image.create({
      data: {
        userId: user.id,
        url: `https://picsum.photos/seed/detector${i}/400/400`,
        publicId: `mock_detector_find_${i}`,
        originalFilename: `detector_find_${i}.jpg`,
        fileSize: 45000 + Math.floor(Math.random() * 50000),
        width: 400,
        height: 400,
        title: `Typischer Fund ${i+1}`,
        description: `Dies ist ein generierter Testfund Nummer ${i+1}`,
      }
    });
  }
  console.log("20 mock images added.");
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
