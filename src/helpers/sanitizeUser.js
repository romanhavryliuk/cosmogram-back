/**
 * Shapes a user document the way the frontend `User` type expects it:
 * `id` instead of `_id`, and never the password or the stored tokens.
 */
const sanitizeUser = ({ _id, name, email }) => ({
  id: _id.toString(),
  name,
  email,
});

module.exports = sanitizeUser;
