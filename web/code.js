code = `
# propositional calculus
typedef St;

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

defun St eq(Class x, Class y) =>
	and(
		forall((Class z) =>
			iff(in(z, x), in(z, y))
		),
		forall((Class w) =>
			iff(in(x, w), in(y, w))
		)
	);

defun St notin(Class a, Class b) =>
	not(in(a, b));

defun St setbuildereq(Class x, Class y, [Class -> St] f) =>
	forall((Class z) =>
		iff(in(z, x), and(in(z, y), f(z)))
	);

defrule ext(Class x, Class y) =>
	|- implies(
		forall((Class z) =>
			iff(
				in(z, x),
				in(z, y)
			)
		),
		eq(x, y)
	);

defrule spec([Class -> St] p) =>
	|-
	forall((Class z) =>
		exists((Class y) =>
			setbuildereq(y, z, p)
		)
	);

defrule spec_uinst([Class -> St] f, Class c) =>
	spec(f) ~ uinst((Class z) =>
			exists((Class y) => setbuildereq(y, z, f)
		),
		c
	);

defrule mp2(St p, St q, St r) =>
	mp(p, implies(q, r))
	~ mp(q, r);

defrule mp2b(St p, St q, St r) =>
	mp(p, q)
	~ mp(q, r);

defrule a1i(St p, St q) =>
	luk1(p, q) ~ mp(p, implies(q, p));

defrule mp1i(St p, St q, St r) =>
	mp(p, q) ~ a1i(q, r);

defrule and(St p, St q) =>
	p, q |- and(p, q);

`;