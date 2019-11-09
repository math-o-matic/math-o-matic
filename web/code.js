code = `
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

typedef St;

St verum;
St falsum;

St nand(St p, St q);

St not(St p) {
	nand(p, p)
}

St and(St p, St q) {
	not(nand(p, q))
}

St or(St p, St q) {
	nand(not(p), not(q))
}

St implies(St p, St q) {
	or(not(p), q)
}

St iff(St p, St q) {
	and(implies(p, q), implies(q, p))
}

native ruleset tt;

rule mp(St p, St q) {
	p, implies(p, q) |- q
}

rule andi(St p, St q) {
	tt.IqIpApq(p, q) ~ mp(
		q,
		implies(p, and(p, q))
	) ~ mp(p, and(p, q))
}

rule and3i(St p, St q, St r) {
	andi(p, q) ~ andi(and(p, q), r)
}

rule ande1(St p, St q) {
	tt.IApqp(p, q) ~ mp(and(p, q), p)
}

rule ande2(St p, St q) {
	tt.IApqq(p, q) ~ mp(and(p, q), q)
}

rule ori1(St p, St q) {
	tt.IpOpq(p, q) ~ mp(p, or(p, q))
}

rule ori2(St p, St q) {
	tt.IqOpq(p, q) ~ mp(q, or(p, q))
}

rule ore(St p, St q, St r) {
	and3i(
		or(p, q),
		implies(p, r),
		implies(q, r)
	)
	~ tt.IAAOpqIprIqrr(p, q, r)
	~ mp(
		and(
			and(or(p, q), implies(p, r)),
			implies(q, r)
		),
		r
	)
}

rule noti(St p, St q) {
	andi(
		implies(p, q),
		implies(p, not(q))
	)
	~ tt.IAIpqIpNqNp(p, q)
	~ mp(
		and(
			implies(p, q),
			implies(p, not(q))
		),
		not(p)
	)
}

rule note(St p, St q) {
	tt.INpIpq(p, q) ~ mp(not(p), implies(p, q))
}

rule notnote(St p) {
	tt.INNpp(p)
	~ mp(not(not(p)), p)
}

rule iffi(St p, St q) {
	andi(implies(p, q), implies(q, p))
	~ tt.IAIpqIqpEpq(p, q)
	~ mp(
		and(implies(p, q), implies(q, p)),
		iff(p, q)
	)
}

rule iffe1(St p, St q) {
	tt.IEpqIpq(p, q)
	~ mp(iff(p, q), implies(p, q))
}

rule iffe2(St p, St q) {
	tt.IEpqIqp(p, q)
	~ mp(iff(p, q), implies(q, p))
}

rule destroy(St p) {
	andi(p, not(p))
	~ tt.IApNpF(p)
	~ mp(
		and(p, not(p)),
		falsum
	)
}

#################################
######## PREDICATE LOGIC ########
#################################

typedef Class;

St forall([Class -> St] f);

St forall2([(Class, Class) -> St] f) {
	forall((Class x) =>
		forall((Class y) =>
			f(x, y)
		)
	)
}

St exists([Class -> St] f) {
	not(forall((Class x) => not(f(x))))
}

St exists2([(Class, Class) -> St] f) {
	not(forall2((Class x, Class y) => not(f(x, y))))
}

# universal instantiation
rule uinst([Class -> St] f, Class x) {
	forall(f) |- f(x)
}

# existential instantiation
rule einst([Class -> St] f, [Class -> St] g) {
	and(exists(f), forall((Class x) => implies(f(x), g(x)))) |- exists(g)
}

rule exists([Class -> St] f, Class x) {
	f(x) |- exists(f)
}

St in(Class a, Class b);

St eq(Class x, Class y) {
	and(
		forall((Class z) =>
			iff(in(z, x), in(z, y))
		),
		forall((Class w) =>
			iff(in(x, w), in(y, w))
		)
	)
}

St notin(Class a, Class b) {
	not(in(a, b))
}

St setbuildereq(Class x, Class y, [Class -> St] f) {
	forall((Class z) =>
		iff(in(z, x), and(in(z, y), f(z)))
	)
}

rule ext(Class x, Class y) {
	|- implies(
		forall((Class z) =>
			iff(
				in(z, x),
				in(z, y)
			)
		),
		eq(x, y)
	)
}

rule spec([Class -> St] p) {
	|-
	forall((Class z) =>
		exists((Class y) =>
			setbuildereq(y, z, p)
		)
	)
}

St sym([(Class, Class) -> St] f) {
	forall2((Class x, Class y) =>
		implies(f(x, y), f(y, x))
	)
}

rule eq_sym() {
	|- sym(eq)
}

`;