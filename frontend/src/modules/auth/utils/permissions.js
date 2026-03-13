const roleSets = {
  read: new Set(['super-admin', 'business-admin', 'delivery']),
  write: new Set(['super-admin', 'business-admin']),
  delete: new Set(['super-admin']),
}

export function getRoleCapabilities(user) {
  const role = user?.role || null

  return {
    role,
    canRead: role ? roleSets.read.has(role) : false,
    canWrite: role ? roleSets.write.has(role) : false,
    canDelete: role ? roleSets.delete.has(role) : false,
  }
}
