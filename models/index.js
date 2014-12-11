var fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    lodash = require('lodash'),
    conf = require('../config/config.js');

sequelize = new Sequelize(conf.dbName, conf.dbUserName, conf.dbPassword, {
    dialect: 'mysql',
    // host: '192.241.249.11'
    host: conf.ip
}),
db = {};
fs.readdirSync(__dirname).filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
}).forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
});
Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db)
    }
});
module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize
}, db);
