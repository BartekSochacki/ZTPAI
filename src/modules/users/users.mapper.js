const toIso = value => (value ? new Date(value).toISOString() : null);

function toUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: toIso(user.createdAt)
  };
}

module.exports = { toUserResponse };
