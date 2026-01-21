import { prisma } from "../src/lib/db";

async function checkDemoUser() {
  try {
    const demoUser = await prisma.user.findFirst({
      where: {
        email: "demo@supplr.net",
      },
      include: {
        organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (demoUser) {
      console.log("Demo User Found:");
      console.log("Email:", demoUser.email);
      console.log("Role:", demoUser.role);
      console.log("Status:", demoUser.status);
      console.log("Organization:", demoUser.organization.name);
      console.log(
        "Subscription Plan:",
        demoUser.organization.subscription?.plan || "No subscription"
      );
    } else {
      console.log("Demo user not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoUser();
