module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.addColumn('users', 'avatar_id', {
    type: Sequelize.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    references: {
      model: 'files',
      key: 'id',
    },
  }),

  down: async (queryInterface) => queryInterface.removeColumn('users', 'avatar_id'),
};
