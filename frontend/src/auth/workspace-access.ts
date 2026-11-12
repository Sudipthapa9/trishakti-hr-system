// Keep the workspace gate aligned with the existing backend module roles.
// Manager permissions will be enabled only after their scope is defined.
export function hasWorkspaceAccess(roles: readonly string[]) {
  return roles.includes("hr") || roles.includes("hr-head");
}
