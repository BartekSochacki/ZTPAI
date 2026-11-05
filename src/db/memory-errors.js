function pgError(code, message, constraint) {
  return Object.assign(new Error(message), { code, constraint });
}

function uniqueViolation(constraint) {
  return pgError("23505", `duplicate key value violates unique constraint "${constraint}"`, constraint);
}

function foreignKeyViolation(constraint) {
  return pgError("23503", `update or delete violates foreign key constraint "${constraint}"`, constraint);
}

module.exports = { uniqueViolation, foreignKeyViolation };
