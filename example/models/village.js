module.exports = (DB, { INTEGER, STRING, BOOLEAN, DOUBLE }) => {
  const Model = DB.define(
    'village',
    {
      id: { type: INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      title: { type: STRING, allowNull: false },
      display: { type: BOOLEAN, allowNull: false, defaultValue: true },
      latitude: {
        type: DOUBLE,
        allowNull: true,
      },
      // country_id -> country.id
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'village',
      indexes: [{ fields: ['country_id'] }, { fields: ['title'] }, { fields: ['latitude'] }],
    },
  );

  Model.associate = (models) => {
    Model.hasMany(models.account, { foreignKey: { allowNull: false } });
    Model.belongsTo(models.country);
  };

  return Model;
};
