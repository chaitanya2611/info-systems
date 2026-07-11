function publicUser(user) {
  if (!user) return null;
  return { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

module.exports = { publicUser };
