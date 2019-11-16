code = `
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

typedef st;

st T;
st F;

st S(st p, st q);

st N(st p);

st A(st p, st q);

st O(st p, st q);

st I(st p, st q);

st E(st p, st q) {
	A(
		I(p, q),
		I(q, p)
	)
}

// st N(st p) {
// 	S(p, p)
// }

// st A(st p, st q) {
// 	N(S(p, q))
// }

// st O(st p, st q) {
// 	S(N(p), N(q))
// }

// st I(st p, st q) {
// 	S(p, N(q))
// }

// st E(st p, st q) {
// 	S(
// 		S(p, q),
// 		S(N(p), N(q))
// 	)
// }

native ruleset tt;
native link cp;

rule mp(st p, st q) {
	p, I(p, q) |- q
}

rule Ai(st p, st q) {
	tt.IqIpApq(p, q) ~ mp(
		q,
		I(p, A(p, q))
	) ~ mp(p, A(p, q))
}

rule A3i(st p, st q, st r) {
	Ai(p, q) ~ Ai(A(p, q), r)
}

rule Ae1(st p, st q) {
	tt.IApqp(p, q) ~ mp(A(p, q), p)
}

rule Ae2(st p, st q) {
	tt.IApqq(p, q) ~ mp(A(p, q), q)
}

rule Oi1(st p, st q) {
	tt.IpOpq(p, q) ~ mp(p, O(p, q))
}

rule Oi2(st p, st q) {
	tt.IqOpq(p, q) ~ mp(q, O(p, q))
}

rule Oe(st p, st q, st r) {
	A3i(
		O(p, q),
		I(p, r),
		I(q, r)
	)
	~ tt.IAAOpqIprIqrr(p, q, r)
	~ mp(
		A(
			A(O(p, q), I(p, r)),
			I(q, r)
		),
		r
	)
}

rule Ni(st p, st q) {
	Ai(
		I(p, q),
		I(p, N(q))
	)
	~ tt.IAIpqIpNqNp(p, q)
	~ mp(
		A(
			I(p, q),
			I(p, N(q))
		),
		N(p)
	)
}

rule Ne(st p, st q) {
	tt.INpIpq(p, q) ~ mp(N(p), I(p, q))
}

rule NNe(st p) {
	tt.INNpp(p)
	~ mp(N(N(p)), p)
}

rule Ei(st p, st q) {
	Ai(I(p, q), I(q, p))
	~ tt.IAIpqIqpEpq(p, q)
	~ mp(
		A(I(p, q), I(q, p)),
		E(p, q)
	)
}

rule Ee1(st p, st q) {
	tt.IEpqIpq(p, q)
	~ mp(E(p, q), I(p, q))
}

rule Ee2(st p, st q) {
	tt.IEpqIqp(p, q)
	~ mp(E(p, q), I(q, p))
}

rule syll(st p, st q, st r) {
	Ai(I(p, q), I(q, r))
	~ tt.IAIpqIqrIpr(p, q, r)
	~ mp(A(I(p, q), I(q, r)), I(p, r))
}

rule id(st p) {
	tt.Ipp(p) ~ mp(p, p)
}

rule destroy(st p) {
	Ai(p, N(p))
	~ tt.IApNpF(p)
	~ mp(
		A(p, N(p)),
		F
	)
}

#################################
######## PREDICATE LOGIC ########
#################################

typedef class;

[class -> st] Af([class -> st] f, [class -> st] g) {
	(class x) => A(f(x), g(x))
}

[class -> st] Of([class -> st] f, [class -> st] g) {
	(class x) => O(f(x), g(x))
}

st V([class -> st] f);

native link Vi;

st V2([(class, class) -> st] f) {
	V((class x) =>
		V((class y) =>
			f(x, y)
		)
	)
}

st V3([(class, class, class) -> st] f) {
	V((class x) =>
		V((class y) =>
			V((class z) =>
				f(x, y, z)
			)
		)
	)
}

st X([class -> st] f) {
	N(V((class x) => N(f(x))))
}

st X2([(class, class) -> st] f) {
	N(V2((class x, class y) => N(f(x, y))))
}

# universal instantiation
rule uinst([class -> st] f, class x) {
	V(f) |- f(x)
}

rule X([class -> st] f, class x) {
	f(x) |- X(f)
}

rule VA([class -> st] f, [class -> st] g) {
	|- E(
		V((class x) => (
			A(f(x), g(x))
		)),
		A(V(f), V(g))
	)
}

rule VI([class -> st] f, [class -> st] g) {
	|- I(
		V((class x) => I(f(x), g(x))),
		I(V(f), V(g))
	)
}

rule VV([(class, class) -> st] f) {
	|- I(
		V2((class x, class y) => f(x, y)),
		V2((class y, class x) => f(x, y))
	)
}

rule VE([class -> st] f, [class -> st] g) {
	VA(
		(class x) => (
			I(f(x), g(x))
		),
		(class x) => (
			I(g(x), f(x))
		)
	)
}

rule VAm1([class -> st] f, [class -> st] g) {
	VA(f, g)
	~ Ee1(
		V(Af(f, g)),
		A(V(f), V(g))
	)
	~ mp(
		V(Af(f, g)),
		A(V(f), V(g))
	)
}

rule VAm2([class -> st] f, [class -> st] g) {
	VA(f, g)
	~ Ee2(
		V(Af(f, g)),
		A(V(f), V(g))
	)
	~ mp(
		A(V(f), V(g)),
		V(Af(f, g))
	)
}

rule VIm([class -> st] f, [class -> st] g) {
	VI(f, g)
	~ mp(
		V((class x) => I(f(x), g(x))),
		I(V(f), V(g))
	)
}

rule VVm([(class, class) -> st] f) {
	VV(f)
	~ mp(
		V2((class x, class y) => f(x, y)),
		V2((class y, class x) => f(x, y))
	)
}

st reflexive([(class, class) -> st] f) {
	V((class x) =>
		f(x, x)
	)
}

st symmetric([(class, class) -> st] f) {
	V2((class x, class y) =>
		I(f(x, y), f(y, x))
	)
}

st transitive([(class, class) -> st] f) {
	V3((class x, class y, class z) =>
		I(
			A(f(x, y), f(y, z)),
			f(x, z)
		)
	)
}

############################
######## SET THEORY ########
############################

st in(class a, class b);

st set(class a) {
	X((class b) =>
		in(a, b)
	)
}

st eq(class x, class y) {
	A(
		V((class z) =>
			E(in(z, x), in(z, y))
		),
		V((class w) =>
			E(in(x, w), in(y, w))
		)
	)
}

rule ext(class x, class y) {
	|- I(
		V((class z) =>
			E(
				in(z, x),
				in(z, y)
			)
		),
		eq(x, y)
	)
}

st subseteq(class x, class y) {
	V((class z) => (
		I(
			in(z, x),
			in(z, y)
		)
	))
}

st Nin(class a, class b) {
	N(in(a, b))
}

class emptyset;

rule emptyset_def() {
	|- V((class x) =>
		Nin(x, emptyset)
	)
}

class setbuilder([class -> st] f);

rule setbuilder_def([class -> st] f) {
	|- V((class x) =>
		E(
			in(x, setbuilder(f)),
			f(x)
		)
	)
}

class subsetbuilder(class x, [class -> st] f) {
	setbuilder((class y) => (
		A(
			in(y, x),
			f(y)
		)
	))
}

class power(class x) {
	setbuilder((class z) => (
		subseteq(z, x)
	))
}

class singleton(class x) {
	setbuilder((class z) => (
		eq(z, x)
	))
}

rule singleton_subseteq_power(class x) {
	|- subseteq(singleton(x), power(x))
}

rule singleton_subseteq_power_(class x) {
	setbuilder_def((class z) => eq(z, x))
}

st subsetbuildereq(class x, class y, [class -> st] f) {
	V((class z) =>
		E(in(z, x), A(in(z, y), f(z)))
	)
}

rule spec([class -> st] f) {
	|-
	V((class x) =>
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	)
}

/*rule infinity() {
	X((class x) =>
		A3(
			set(x),
			in(emptyset, x),
			V((class y) =>

			)
		)
	)
}*/

rule _ttf_IEpqEqp([class -> st] f, [class -> st] g, class x) {
	tt.IEpqEqp(f(x), g(x))
}

rule _tmp0([class -> st] f, [class -> st] g) {
	Vi[_ttf_IEpqEqp](f, g)
	~ VIm(
		(class x) => E(f(x), g(x)),
		(class x) => E(g(x), f(x))
	) ~ mp(
		V((class x) => E(f(x), g(x))),
		V((class x) => E(g(x), f(x)))
	)
}

rule _tmp(class x, class y) {
	Ae1(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	) ~ _tmp0(
		(class z) => in(z, x),
		(class z) => in(z, y)
	)
}

rule _tmp2(class x, class y) {
	Ae2(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	) ~ _tmp0(
		(class w) => in(x, w),
		(class w) => in(y, w)
	)
}

rule _tmp3(class x, class y) {
	_tmp(x, y) ~ _tmp2(x, y) ~ Ai(
		V((class z) => E(in(z, y), in(z, x))),
		V((class w) => E(in(y, w), in(x, w)))
	)
}

rule eq_symmetric() {
	Vi[Vi[cp[_tmp3]]]()
}

`;