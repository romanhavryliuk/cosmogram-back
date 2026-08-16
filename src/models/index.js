const { User, schemas: userSchemas } = require('./user');
const { Profile, schemas: profileSchemas } = require('./profile');

module.exports = {
  User,
  Profile,
  schemas: { ...userSchemas, ...profileSchemas },
};
