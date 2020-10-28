import Sequelize from 'sequelize';

const { Model } = Sequelize;

export default (sequelize, DataTypes) => {
  class '<%name%>' extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
    }
  }

  '<%name%>'.init(
    {
      // define attributes here
  }, {
    sequelize,
    modelName: '<%name%>',
    underscored: '<%underscored%>'
  });

  return '<%name%>';
};
