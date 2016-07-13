def product(n, term):
  if n==1:
    return term(n)
  return n*product(n-1, term)