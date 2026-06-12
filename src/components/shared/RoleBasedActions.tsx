import { Button } from "@/components/ui/button";

type UserRole =
  | "super-admin"
  | "executive-admin"
  | "cluster-head"
  | "user-head"
  | "nurse"
  | "technician"
  | "doctor"
  | "user";

interface RoleBasedActionsProps {
  currentUserRole: UserRole;
  onAction: (action: string) => void;
}

const RoleBasedActions = ({
  currentUserRole,
  onAction,
}: RoleBasedActionsProps) => {
  const canCreateRole = (role: UserRole): boolean => {
    switch (currentUserRole) {
      case "super-admin":
        return true;
      case "executive-admin":
        return !["super-admin", "executive-admin"].includes(role);
      case "cluster-head":
        return ["user-head", "nurse", "technician", "doctor", "user"].includes(
          role
        );
      case "user-head":
        return ["nurse", "technician", "doctor", "user"].includes(role);
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canCreateRole("executive-admin") && (
        <Button
          variant="default"
          onClick={() => onAction("create-executive-admin")}
        >
          Add Executive Admin
        </Button>
      )}
      {canCreateRole("cluster-head") && (
        <Button
          variant="default"
          onClick={() => onAction("create-cluster-head")}
        >
          Add Cluster Head
        </Button>
      )}
      {canCreateRole("user-head") && (
        <Button variant="default" onClick={() => onAction("create-user-head")}>
          Add User Head
        </Button>
      )}
      {canCreateRole("doctor") && (
        <Button variant="default" onClick={() => onAction("create-doctor")}>
          Add Doctor
        </Button>
      )}
      {canCreateRole("nurse") && (
        <Button variant="default" onClick={() => onAction("create-nurse")}>
          Add Nurse
        </Button>
      )}
      {canCreateRole("technician") && (
        <Button variant="default" onClick={() => onAction("create-technician")}>
          Add Technician
        </Button>
      )}
      {canCreateRole("user") && (
        <Button variant="default" onClick={() => onAction("create-patient")}>
          Add Patient
        </Button>
      )}
    </div>
  );
};

export default RoleBasedActions;
