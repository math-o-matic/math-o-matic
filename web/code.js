code = `
# propositional calculus
defun St implies(St p, St q);

defun St not(St p);

defun St and(St p, St q) =>
	not(implies(p, not(q)));

defun St iff(St p, St q) =>
	and(implies(p, q), implies(q, p));

defrule luk1(St p, St q) =>
	|- implies(p, implies(q, p));

defrule luk2(St p, St q, St r) =>
	|- implies(implies(p, implies(q, r)), implies(implies(p, q), implies(p, r)));

defrule luk3(St p, St q) =>
	|- implies(implies(not(p), not(q)), implies(q, p));

defrule mp(St p, St q) =>
	p, implies(p, q) |- q;

deflink li1(St p, St q) =>
	luk1(p, q) ~ mp(p, implies(q, p));

# predicate
typedef Class;

defun St forall([Class -> St] f);

defun St exists([Class -> St] f) =>
	not(forall((Class x) => not(f(x))));

# universal instantiation
defrule uinst([Class -> St] f, Class x) =>
	forall(f) |- f(x);

# existential instantiation
defrule einst([Class -> St] f, [Class -> St] g) =>
	and(exists(f), forall((Class x) => implies(f(x), g(x)))) |- exists(g);

defrule exists([Class -> St] f, Class x) =>
	f(x) |- exists(f);

defun St in(Class a, Class b);

defun St notin(Class a, Class b) =>
	not(in(a, b));

defun St setbuildereq(Class x, Class y, [Class -> St] f) =>
	forall((Class z) =>
		iff(in(z, x), and(in(z, y), f(z)))
	);

defrule spe([Class -> St] p) =>
	|-
	forall((Class z) =>
		exists((Class y) =>
			setbuildereq(y, z, p)
		)
	);

deflink uinstspe([Class -> St] f, Class c) =>
	spe(f) ~ uinst((Class z) =>
			exists((Class y) => setbuildereq(y, z, f)
		),
		c
	);
`;