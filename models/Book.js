
module.exports = function(sequelize, DataTypes) {
    var Book = sequelize.define('User', {
        title: DataTypes.STRING,
        author: DataTypes.STRING,    
    }, {
        classMethods: {
            associate: function(models) {
                var User = models.User;
                Book.belongsTo(User);
            }
        }
    })

    return Book;
};
