function uniqueViolation(constraint) {
  return Object.assign(new Error(`duplicate key value violates unique constraint "${constraint}"`), {
    code: "23505",
    constraint
  });
}

module.exports = { uniqueViolation };
