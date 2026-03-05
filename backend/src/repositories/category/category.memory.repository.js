// Return categories in memory mode (empty by default).
const listCategories = async () => {
  return {
    items: [],
  };
};

// Export memory category repository operations.
module.exports = {
  listCategories,
};
