module.exports = (DB, { INTEGER, STRING, DOUBLE }) => {
  const Model = DB.define(
    'country',
    {
      id: { type: INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      title: { type: STRING, allowNull: false },
      display: { type: STRING, allowNull: false, defaultValue: 'Hi' },
      longitude: {
        type: DOUBLE,
        allowNull: true,
      },
      latitude: {
        type: DOUBLE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'country',
      indexes: [
        { fields: ['title'] },
        { fields: ['display'] },
        { fields: ['longitude'] },
        { fields: ['latitude'] },
      ],
    },
  );

  Model.associate = (models) => {
    Model.hasMany(models.city, { foreignKey: { allowNull: false } });
  };

  return Model;
};
