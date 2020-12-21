module.exports = (DB, { INTEGER, BIGINT, DATE, STRING, ENUM, BOOLEAN, DATEONLY, NOW, DECIMAL }) => {
  const Model = DB.define(
    'account',
    {
      id: {
        type: INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      budget: {
        type: DECIMAL(6, 2),
        allowNull: false,
      },
      test_param: { type: BIGINT, allowNull: false, defaultValue: 1000 },
      first_name: { type: STRING, allowNull: false, defaultValue: 'abc', field: 'first-name' },
      last_name: { type: STRING, allowNull: false, defaultValue: '' },
      nickname: { type: STRING, allowNull: false, defaultValue: '' },
      gender: {
        type: ENUM,
        allowNull: false,
        values: ['male', 'female', 'unknown'],
        defaultValue: 'unknown',
      },
      birth_date: { type: DATEONLY, allowNull: true },
      last_login_dt: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: true, defaultValue: NOW },
      email: { type: STRING, allowNull: false },
      password: { type: STRING, allowNull: false },
      is_deleted: { type: BOOLEAN, allowNull: false, defaultValue: false },
      is_blocked: { type: BOOLEAN, allowNull: false, defaultValue: false },
      // city_id -> city.id
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'account',
    },
  );

  Model.associate = (models) => {
    Model.belongsTo(models.city);
    // Model.hasMany(models.team, { foreignKey: { allowNull: false } })
  };

  return Model;
};
