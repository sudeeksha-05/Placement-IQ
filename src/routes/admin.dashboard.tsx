import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardRedirect,
});

function AdminDashboardRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/dashboard/admin", replace: true }); }, [navigate]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
