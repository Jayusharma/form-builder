import { auth as getAuth } from "@/auth";
import { db } from "@/lib/db";

export async function CurrentUser() {
  const session = await getAuth();

  if (!session?.user) {
    return null;
  }

  // Fetch user with admin code
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isTwoFactorEnabled: true,
      adminCodes: {
        select: {
          code: true,
        },
        take: 1, // Get the first admin code
      },
    },
  });

  if (!user) {
    return null;
  }

  // Transform the user data to include the admin code and isOAuth
  return {
    ...user,
    adminCode: user.adminCodes?.[0]?.code || null,
    isOAuth: session.user.isOAuth,
  };
}