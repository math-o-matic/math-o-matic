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
native link cp;

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

rule id(St p) {
	tt.Ipp(p) ~ mp(p, p)
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

[Class -> St] andf([Class -> St] f, [Class -> St] g) {
	(Class x) => and(f(x), g(x))
}

[Class -> St] orf([Class -> St] f, [Class -> St] g) {
	(Class x) => or(f(x), g(x))
}

St forall([Class -> St] f);

native link foralli;

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

rule forall_and([Class -> St] f, [Class -> St] g) {
	|- iff(
		forall(andf(f, g)),
		and(forall(f), forall(g))
	)
}

rule forall_implies([Class -> St] f, [Class -> St] g) {
	|- implies(
		forall((Class x) => implies(f(x), g(x))),
		implies(forall(f), forall(g))
	)
}

rule forall_forall([(Class, Class) -> St] f) {
	|- implies(
		forall2((Class x, Class y) => f(x, y)),
		forall2((Class y, Class x) => f(x, y))
	)
}

rule forall_and_mp1([Class -> St] f, [Class -> St] g) {
	forall_and(f, g)
	~ iffe1(
		forall(andf(f, g)),
		and(forall(f), forall(g))
	)
	~ mp(
		forall(andf(f, g)),
		and(forall(f), forall(g))
	)
}

rule forall_and_mp2([Class -> St] f, [Class -> St] g) {
	forall_and(f, g)
	~ iffe2(
		forall(andf(f, g)),
		and(forall(f), forall(g))
	)
	~ mp(
		and(forall(f), forall(g)),
		forall(andf(f, g))
	)
}

rule forall_implies_mp([Class -> St] f, [Class -> St] g) {
	forall_implies(f, g)
	~ mp(
		forall((Class x) => implies(f(x), g(x))),
		implies(forall(f), forall(g))
	)
}

rule forall_forall_mp([(Class, Class) -> St] f) {
	forall_forall(f)
	~ mp(
		forall2((Class x, Class y) => f(x, y)),
		forall2((Class y, Class x) => f(x, y))
	)
}

St sym([(Class, Class) -> St] f) {
	forall2((Class x, Class y) =>
		implies(f(x, y), f(y, x))
	)
}

############################
######## SET THEORY ########
############################

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

rule _ttf_IEpqEqp([Class -> St] f, [Class -> St] g, Class x) {
	tt.IEpqEqp(f(x), g(x))
}

rule _tmp0([Class -> St] f, [Class -> St] g) {
	foralli[_ttf_IEpqEqp](f, g)
	~ forall_implies_mp(
		(Class x) => iff(f(x), g(x)),
		(Class x) => iff(g(x), f(x))
	) ~ mp(
		forall((Class x) => iff(f(x), g(x))),
		forall((Class x) => iff(g(x), f(x)))
	)
}

rule _tmp(Class x, Class y) {
	ande1(
		forall((Class z) => iff(in(z, x), in(z, y))),
		forall((Class w) => iff(in(x, w), in(y, w)))
	) ~ _tmp0(
		(Class z) => in(z, x),
		(Class z) => in(z, y)
	)
}

rule _tmp2(Class x, Class y) {
	ande2(
		forall((Class z) => iff(in(z, x), in(z, y))),
		forall((Class w) => iff(in(x, w), in(y, w)))
	) ~ _tmp0(
		(Class w) => in(x, w),
		(Class w) => in(y, w)
	)
}

rule _tmp3(Class x, Class y) {
	_tmp(x, y) ~ _tmp2(x, y) ~ andi(
		forall((Class z) => iff(in(z, y), in(z, x))),
		forall((Class w) => iff(in(y, w), in(x, w)))
	)
}

rule _tmp4(Class x, Class y) {
	cp[_tmp3](x, y)
}

rule _tmp5(Class x) {
	foralli[_tmp4](x)
}

rule eq_sym() {
	foralli[_tmp5]()
}

`;