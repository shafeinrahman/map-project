// Import PostgreSQL query helper.
const db = require('../../db/postgres');

// Convert DB category rows to API-safe category objects.
const mapCategoryRow = (row) => ({
  categoryId: Number(row.category_id),
  name: row.name,
  slug: row.slug,
  iconKey: row.icon_key,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// List categories from the category table.
const listCategories = async ({ includeInactive = false } = {}) => {
  const shouldIncludeInactive =
    includeInactive === true || String(includeInactive || '').toLowerCase() === 'true';

  const whereClause = shouldIncludeInactive ? '' : 'WHERE COALESCE(is_active, true) = true';

  const result = await db.query(
    `
      SELECT
        category_id,
        name,
        slug,
        icon_key,
        is_active,
        created_at,
        updated_at
      FROM category
      ${whereClause}
      ORDER BY LOWER(COALESCE(name, '')), category_id ASC
    `
  );

  return {
    items: result.rows.map(mapCategoryRow),
  };
};

// Export postgres category repository operations.
module.exports = {
  listCategories,
};
