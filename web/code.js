code = `
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

typedef st;

st verum;
st falsum;

st nand(st p, st q);

st not(st p) {
	nand(p, p)
}

st and(st p, st q) {
	not(nand(p, q))
}

st or(st p, st q) {
	nand(not(p), not(q))
}

st implies(st p, st q) {
	or(not(p), q)
}

st iff(st p, st q) {
	and(implies(p, q), implies(q, p))
}

native ruleset tt;
native link cp;

rule mp(st p, st q) {
	p, implies(p, q) |- q
}

rule andi(st p, st q) {
	tt.IqIpApq(p, q) ~ mp(
		q,
		implies(p, and(p, q))
	) ~ mp(p, and(p, q))
}

rule and3i(st p, st q, st r) {
	andi(p, q) ~ andi(and(p, q), r)
}

rule ande1(st p, st q) {
	tt.IApqp(p, q) ~ mp(and(p, q), p)
}

rule ande2(st p, st q) {
	tt.IApqq(p, q) ~ mp(and(p, q), q)
}

rule ori1(st p, st q) {
	tt.IpOpq(p, q) ~ mp(p, or(p, q))
}

rule ori2(st p, st q) {
	tt.IqOpq(p, q) ~ mp(q, or(p, q))
}

rule ore(st p, st q, st r) {
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

rule noti(st p, st q) {
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

rule note(st p, st q) {
	tt.INpIpq(p, q) ~ mp(not(p), implies(p, q))
}

rule notnote(st p) {
	tt.INNpp(p)
	~ mp(not(not(p)), p)
}

rule iffi(st p, st q) {
	andi(implies(p, q), implies(q, p))
	~ tt.IAIpqIqpEpq(p, q)
	~ mp(
		and(implies(p, q), implies(q, p)),
		iff(p, q)
	)
}

rule iffe1(st p, st q) {
	tt.IEpqIpq(p, q)
	~ mp(iff(p, q), implies(p, q))
}

rule iffe2(st p, st q) {
	tt.IEpqIqp(p, q)
	~ mp(iff(p, q), implies(q, p))
}

rule id(st p) {
	tt.Ipp(p) ~ mp(p, p)
}

rule destroy(st p) {
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

typedef class;

[class -> st] andf([class -> st] f, [class -> st] g) {
	(class x) => and(f(x), g(x))
}

[class -> st] orf([class -> st] f, [class -> st] g) {
	(class x) => or(f(x), g(x))
}

st forall([class -> st] f);

native link foralli;

st forall2([(class, class) -> st] f) {
	forall((class x) =>
		forall((class y) =>
			f(x, y)
		)
	)
}

st exists([class -> st] f) {
	not(forall((class x) => not(f(x))))
}

st exists2([(class, class) -> st] f) {
	not(forall2((class x, class y) => not(f(x, y))))
}

# universal instantiation
rule uinst([class -> st] f, class x) {
	forall(f) |- f(x)
}

# existential instantiation
rule einst([class -> st] f, [class -> st] g) {
	and(exists(f), forall((class x) => implies(f(x), g(x)))) |- exists(g)
}

rule exists([class -> st] f, class x) {
	f(x) |- exists(f)
}

rule forall_and([class -> st] f, [class -> st] g) {
	|- iff(
		forall(andf(f, g)),
		and(forall(f), forall(g))
	)
}

rule forall_implies([class -> st] f, [class -> st] g) {
	|- implies(
		forall((class x) => implies(f(x), g(x))),
		implies(forall(f), forall(g))
	)
}

rule forall_forall([(class, class) -> st] f) {
	|- implies(
		forall2((class x, class y) => f(x, y)),
		forall2((class y, class x) => f(x, y))
	)
}

rule forall_and_mp1([class -> st] f, [class -> st] g) {
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

rule forall_and_mp2([class -> st] f, [class -> st] g) {
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

rule forall_implies_mp([class -> st] f, [class -> st] g) {
	forall_implies(f, g)
	~ mp(
		forall((class x) => implies(f(x), g(x))),
		implies(forall(f), forall(g))
	)
}

rule forall_forall_mp([(class, class) -> st] f) {
	forall_forall(f)
	~ mp(
		forall2((class x, class y) => f(x, y)),
		forall2((class y, class x) => f(x, y))
	)
}

st sym([(class, class) -> st] f) {
	forall2((class x, class y) =>
		implies(f(x, y), f(y, x))
	)
}

############################
######## SET THEORY ########
############################

st in(class a, class b);

st eq(class x, class y) {
	and(
		forall((class z) =>
			iff(in(z, x), in(z, y))
		),
		forall((class w) =>
			iff(in(x, w), in(y, w))
		)
	)
}

st notin(class a, class b) {
	not(in(a, b))
}

st setbuildereq(class x, class y, [class -> st] f) {
	forall((class z) =>
		iff(in(z, x), and(in(z, y), f(z)))
	)
}

rule ext(class x, class y) {
	|- implies(
		forall((class z) =>
			iff(
				in(z, x),
				in(z, y)
			)
		),
		eq(x, y)
	)
}

rule spec([class -> st] p) {
	|-
	forall((class z) =>
		exists((class y) =>
			setbuildereq(y, z, p)
		)
	)
}

rule _ttf_IEpqEqp([class -> st] f, [class -> st] g, class x) {
	tt.IEpqEqp(f(x), g(x))
}

rule _tmp0([class -> st] f, [class -> st] g) {
	foralli[_ttf_IEpqEqp](f, g)
	~ forall_implies_mp(
		(class x) => iff(f(x), g(x)),
		(class x) => iff(g(x), f(x))
	) ~ mp(
		forall((class x) => iff(f(x), g(x))),
		forall((class x) => iff(g(x), f(x)))
	)
}

rule _tmp(class x, class y) {
	ande1(
		forall((class z) => iff(in(z, x), in(z, y))),
		forall((class w) => iff(in(x, w), in(y, w)))
	) ~ _tmp0(
		(class z) => in(z, x),
		(class z) => in(z, y)
	)
}

rule _tmp2(class x, class y) {
	ande2(
		forall((class z) => iff(in(z, x), in(z, y))),
		forall((class w) => iff(in(x, w), in(y, w)))
	) ~ _tmp0(
		(class w) => in(x, w),
		(class w) => in(y, w)
	)
}

rule _tmp3(class x, class y) {
	_tmp(x, y) ~ _tmp2(x, y) ~ andi(
		forall((class z) => iff(in(z, y), in(z, x))),
		forall((class w) => iff(in(y, w), in(x, w)))
	)
}

rule _tmp4(class x, class y) {
	cp[_tmp3](x, y)
}

rule _tmp5(class x) {
	foralli[_tmp4](x)
}

rule eq_sym() {
	foralli[_tmp5]()
}

`;