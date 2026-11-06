import { getCurrentUser } from "@/lib/auth/session";
import { LeaveService } from "@/modules/leave/leave.service";
import { redirect } from "next/navigation";
import { HodReviewsClient } from "@/components/dashboard/hod-reviews-client";

export default async function HodDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/hod");
  }

  // Deny-by-default role check
  if (!user.isHOD) {
    redirect("/unauthorized");
  }

  let reviews: any[] = [];
  try {
    reviews = await LeaveService.getHodReviewRequests(user);
  } catch {
    // If DB offline or initial state
  }

  const serializedReviews = JSON.parse(JSON.stringify(reviews));

  return (
    <HodReviewsClient
      initialReviews={serializedReviews}
      departmentName={user.department_name || "Assigned Department"}
      hodName={user.display_name}
    />
  );
}
