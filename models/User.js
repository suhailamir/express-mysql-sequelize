module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('User', {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        username: {
            type: DataTypes.STRING,
            unique: true
        },
        password: {
            type: DataTypes.STRING
        },
        Email: DataTypes.STRING,





    }, {
        classMethods: {
            associate: function(models) {
                var Book = models.Book;
                User.hasMany(Book, {
                    as: 'Books'
                });

            }
        }
    })

    return User;
};
