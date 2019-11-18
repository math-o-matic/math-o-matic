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

st E(st p, st q);

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

rule IEpqEqpm(st p, st q) {
	tt.IEpqEqp(p, q)
	~ mp(E(p, q), E(q, p))
}

rule mpE(st p, st q) {
	Ee1(p, q)
	~ mp(p, q)
}

rule syll(st p, st q, st r) {
	Ai(I(p, q), I(q, r))
	~ tt.IAIpqIqrIpr(p, q, r)
	~ mp(A(I(p, q), I(q, r)), I(p, r))
}

rule syllE(st p, st q, st r) {
	Ai(E(p, q), E(q, r))
	~ tt.IAEpqEqrEpr(p, q, r)
	~ mp(A(E(p, q), E(q, r)), E(p, r))
}

rule id(st p) {
	tt.Ipp(p) ~ mp(p, p)
}

rule destroy(st p) {
	Ne(p, F)
	~ mp(p, F)
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

[class -> st] If([class -> st] f, [class -> st] g) {
	(class x) => I(f(x), g(x))
}

[class -> st] Ef([class -> st] f, [class -> st] g) {
	(class x) => E(f(x), g(x))
}

st V([class -> st] f);

native link Vi;
native link Ve;

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

rule X([class -> st] f, class x) {
	f(x) |- X(f)
}

rule VA([class -> st] f, [class -> st] g) {
	|- E(
		V(Af(f, g)),
		A(V(f), V(g))
	)
}

rule VI([class -> st] f, [class -> st] g) {
	|- I(
		V(If(f, g)),
		I(V(f), V(g))
	)
}

rule VV([(class, class) -> st] f) {
	|- I(
		V2((class x, class y) => f(x, y)),
		V2((class y, class x) => f(x, y))
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

rule ttf_IEpqEqp([class -> st] f, [class -> st] g, class x) {
	tt.IEpqEqp(f(x), g(x))
}

rule IVEpqVEqpfm([class -> st] f, [class -> st] g) {
	id(V(Ef(f, g))) ~
	Vi[ttf_IEpqEqp](f, g)
	~ VIm(
		(class x) => E(f(x), g(x)),
		(class x) => E(g(x), f(x))
	) ~ mp(
		V((class x) => E(f(x), g(x))),
		V((class x) => E(g(x), f(x)))
	)
	~ id(V(Ef(g, f)))
}

rule ttf_IEpqIpq([class -> st] f, [class -> st] g, class x) {
	tt.IEpqIpq(f(x), g(x))
}

rule IVEpqVIpqfm([class -> st] f, [class -> st] g) {
	id(V(Ef(f, g))) ~
	Vi[ttf_IEpqIpq](f, g)
	~ VIm(
		(class x) => (E(f(x), g(x))),
		(class x) => (I(f(x), g(x)))
	) ~ mp(
		V((class x) => E(f(x), g(x))),
		V((class x) => I(f(x), g(x)))
	)
	~ id(V(If(f, g)))
}

rule IVEpqVIqpfm([class -> st] f, [class -> st] g) {
	IVEpqVEqpfm(f, g)
	~ IVEpqVIpqfm(g, f)
}

rule VEm([class -> st] f, [class -> st] g) {
	IVEpqVIpqfm(f, g)
	~ VIm(f, g)
	~ IVEpqVIqpfm(f, g)
	~ VIm(g, f)
	~ Ei(V(f), V(g))
}

rule VE([class -> st] f, [class -> st] g) {
	cp[VEm](f, g)
}

rule uinst([class -> st] f, class x) {
	V(f) |- f(x)
}

rule einst([class -> st] f, [class -> st] g) {
	X(f), V(If(f, g)) |- X(g)
}

rule einstE([class -> st] f, [class -> st] g) {
	IVEpqVIpqfm(f, g) ~ einst(f, g)
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

st Nin(class a, class b) {
	N(in(a, b))
}

st set(class a) {
	X((class b) =>
		in(a, b)
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

class emptyset;

rule emptyset_def() {
	|- V((class x) =>
		Nin(x, emptyset)
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

rule eq_Ae1(class x, class y) {
	id(eq(x, y))
	~ Ae1(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	)
}

rule eq_Ae2(class x, class y) {
// 	id(set(x)) ~
	id(eq(x, y)) ~
	Ae2(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	)
}

rule set_is_set(class x, class y) {
	id(set(x)) ~
	eq_Ae2(x, y)
	~ einstE(
		(class w) => in(x, w),
		(class w) => in(y, w)
	)
	~ id(set(y))
}

rule ax_extensional(class x, class y) {
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

rule eq_simple(class x, class y) {
	cp[eq_Ae1](x, y)
	~ ax_extensional(x, y)
	~ Ei(
		eq(x, y),
		V((class z) => E(in(z, x), in(z, y)))
	)
}

rule eq_then_subseteq_m(class x, class y) {
	eq_simple(x, y)
	~ mpE(
		eq(x, y),
		V((class z) => E(in(z, x), in(z, y)))
	)
	~ IVEpqVIpqfm(
		(class z) => in(z, x),
		(class z) => in(z, y)
	)
	~ id(subseteq(x, y))
}

rule eq_then_subseteq(class x, class y) {
	cp[eq_then_subseteq_m](x, y)
}

rule eq_reflexive_tmp1(class x, class z) {
	tt.Epp(in(z, x))
}

rule eq_reflexive_tmp2(class x, class w) {
	tt.Epp(in(x, w))
}

rule eq_reflexive_tmp3(class x) {
	Vi[eq_reflexive_tmp1](x)
	~ Vi[eq_reflexive_tmp2](x)
	~ Ai(
		V((class z) => E(in(z, x), in(z, x))),
		V((class w) => E(in(x, w), in(x, w)))
	)
}

rule eq_reflexive() {
	Vi[eq_reflexive_tmp3]()
	~ id(reflexive(eq))
}

rule eq_symmetric_tmp(class x, class y) {
	id(eq(x, y)) ~
	Ae1(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	) ~ IVEpqVEqpfm(
		(class z) => in(z, x),
		(class z) => in(z, y)
	) ~ Ae2(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	) ~ IVEpqVEqpfm(
		(class w) => in(x, w),
		(class w) => in(y, w)
	) ~ Ai(
		V((class z) => E(in(z, y), in(z, x))),
		V((class w) => E(in(y, w), in(x, w)))
	)
	~ id(eq(y, x))
}

rule eq_symmetric() {
	Vi[Vi[cp[eq_symmetric_tmp]]]()
	~ id(symmetric(eq))
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

rule self_in_power_1(class x) {
	setbuilder_def((class z) => (
		subseteq(z, x)
	))
	~ id(
		V((class z) => (
			E(
				in(z, power(x)),
				subseteq(z, x)
			)
		))
	)
}

rule self_in_power_2(class x, class z) {
	Ve[self_in_power_1](x, z)
}

rule self_in_power(class x, class z) {
	eq_then_subseteq(z, x)
	~ self_in_power_2(x, z)
	~ Ee2(
		in(z, power(x)),
		subseteq(z, x)
	)
	~ syll(
		eq(z, x),
		subseteq(z, x),
		in(z, power(x))
	)
}

class singleton(class x) {
	setbuilder((class z) => (
		eq(z, x)
	))
}

rule singleton_subseteq_power_1(class x) {
	setbuilder_def((class z) => eq(z, x))
	~ id(
		V((class z) => (
			E(
				in(z, singleton(x)),
				eq(z, x)
			)
		))
	)
}

rule singleton_subseteq_power_2(class x, class z) {
	Ve[singleton_subseteq_power_1](x, z)
	~ Ee1(
		in(z, singleton(x)),
		eq(z, x)
	)
	~ self_in_power(x, z)
	~ syll(
		in(z, singleton(x)),
		eq(z, x),
		in(z, power(x))
	)
}

rule singleton_subseteq_power(class x) {
	Vi[singleton_subseteq_power_2](x)
	~ id(
		subseteq(singleton(x), power(x))
	)
}

rule ax_specify([class -> st] f) {
	|-
	V((class x) =>
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	)
}

rule ax_power() {
	|- V((class x) => (
		I(
			set(x),
			X((class y) => (
				A(
					set(y),
					V((class z) => (
						I(subseteq(z, x), in(z, y))
					))
				)
			))
		)
	))
}

rule ax_power_ve(class x) {
	Ve[ax_power](x)
}

rule power_is_set_2(class x) {
	|- I(
		set(x),
		V((class y) => (
			I(
				A(
					set(y),
					V((class z) => (
						I(
							subseteq(z, x),
							in(z, y)
						)
					))
				),
				A(
					set(y),
					eq(y, power(x))
				)
			)
		))
	)
}

// rule power_is_set_1_(class x, class y) {
// }

rule power_is_set_1(class x) {
	|- I(set(x), set(power(x)))
}

rule power_is_set() {
	|- V((class x) => (
		I(set(x), set(power(x)))
	))
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

`;