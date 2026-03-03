const roleSets = {
  read: new Set(['admin', 'editor', 'viewer']),
  write: new Set(['admin', 'editor']),
  delete: new Set(['admin']),
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
