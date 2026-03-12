export type RoleValue = string | string[] | null | undefined

export function hasAdminRole(role: RoleValue) {
  if (!role) return false
  if (Array.isArray(role)) return role.includes("admin")
  return role
    .split(",")
    .map((item) => item.trim())
    .includes("admin")
}
