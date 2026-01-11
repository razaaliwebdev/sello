import { useState } from "react";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";
import {
  useGetAllRolesQuery,
  useDeleteRoleMutation,
} from "../../redux/services/adminApi";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import RoleDetails from "./RoleDetails";

const RolesList = ({ onCreateRole }) => {
  const { data: rolesData, isLoading, refetch } = useGetAllRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const roles = rolesData || [];

  const handleDelete = async (roleId, roleName) => {
    if (
      !window.confirm(`Are you sure you want to delete the role "${roleName}"?`)
    ) {
      return;
    }

    try {
      await deleteRole(roleId).unwrap();
      toast.success("Role deleted successfully");
      // Force refetch to ensure fresh data
      await refetch();
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error(error?.data?.message || "Failed to delete role");
      // Also refetch on error to get current state
      await refetch();
    }
  };

  const handleViewDetails = (role) => {
    setSelectedRole(role);
    setShowDetails(true);
  };

  const getAccessLevelBadge = (level) => {
    const colors = {
      FULL: "bg-red-100 text-red-800",
      MEDIUM_HIGH: "bg-primary-100 text-primary-800",
      MEDIUM: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          colors[level] || "bg-gray-100 text-gray-800"
        }`}
      >
        {level.replace("_", " ")}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner fullScreen={false} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Roles & Permissions
          </h3>
          <button
            onClick={onCreateRole}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Create Role
          </button>
        </div>

        {roles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiShield size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No roles found. Create your first role to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {roles.map((role) => (
              <div
                key={role._id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {role.displayName}
                      </h4>
                      {getAccessLevelBadge(role.accessLevel)}
                      {role.isPreset && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Preset
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{role.purpose}</p>

                    {/* Restrictions */}
                    {role.restrictions && role.restrictions.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FiAlertCircle
                            className="text-yellow-600 mt-0.5"
                            size={16}
                          />
                          <div>
                            <p className="text-xs font-semibold text-yellow-900 mb-1">
                              What this role can't do:
                            </p>
                            <ul className="text-xs text-yellow-800 space-y-1">
                              {role.restrictions.map((restriction, idx) => (
                                <li key={idx}>• {restriction}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Permission Summary */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(role.permissions || {})
                          .filter(([_, value]) => value === true)
                          .slice(0, 5)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                            >
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          ))}
                        {Object.values(role.permissions || {}).filter(
                          (v) => v === true
                        ).length > 5 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +
                            {Object.values(role.permissions || {}).filter(
                              (v) => v === true
                            ).length - 5}{" "}
                            more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(role)}
                      className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <FiEye size={18} />
                    </button>
                    {!role.isPreset && (
                      <>
                        <button
                          onClick={() => onCreateRole(role)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(role._id, role.displayName)
                          }
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Role"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetails && selectedRole && (
        <RoleDetails
          role={selectedRole}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedRole(null);
          }}
        />
      )}
    </>
  );
};

export default RolesList;
