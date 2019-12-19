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

rule IpIqpm(st p, st q) {
	tt.IpIqp(p, q)
	~ mp(p, I(q, p))
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

rule syll4(st p, st q, st r, st s) {
	syll(p, q, r) ~ syll(p, r, s)
}

rule syllE(st p, st q, st r) {
	Ai(E(p, q), E(q, r))
	~ tt.IAEpqEqrEpr(p, q, r)
	~ mp(A(E(p, q), E(q, r)), E(p, r))
}

rule syllE4(st p, st q, st r, st s) {
	syllE(p, q, r) ~ syllE(p, r, s)
}

rule id(st p) {
	tt.Ipp(p) ~ mp(p, p)
}

rule destroy(st p) {
	Ne(p, F)
	~ mp(p, F)
}

rule contradict(st p) {
	tt.IIpFNp(p)
	~ mp(I(p, F), N(p))
}

#################################
######## PREDICATE LOGIC ########
#################################

typedef class;

[class -> st] Af([class -> st] f, [class -> st] g) {
	(class z) => A(f(z), g(z))
}

[class -> st] Of([class -> st] f, [class -> st] g) {
	(class z) => O(f(z), g(z))
}

[class -> st] If([class -> st] f, [class -> st] g) {
	(class z) => I(f(z), g(z))
}

[class -> st] Ef([class -> st] f, [class -> st] g) {
	(class z) => E(f(z), g(z))
}

[class -> st] Nf([class -> st] f) {
	(class z) => N(f(z))
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

rule VO([class -> st] f, [class -> st] g) {
	|- I(
		O(V(f), V(g)),
		V(Of(f, g))
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
}

rule ttf_IEpqIpq([class -> st] f, [class -> st] g, class x) {
	tt.IEpqIpq(f(x), g(x))
}

rule Ee1V([class -> st] f, [class -> st] g) {
	id(V(Ef(f, g))) ~
	Vi[ttf_IEpqIpq](f, g)
	~ VIm(
		(class x) => (E(f(x), g(x))),
		(class x) => (I(f(x), g(x)))
	) ~ mp(
		V((class x) => E(f(x), g(x))),
		V((class x) => I(f(x), g(x)))
	)
}

rule Ee2V([class -> st] f, [class -> st] g) {
	IVEpqVEqpfm(f, g)
	~ Ee1V(g, f)
}

rule VEm([class -> st] f, [class -> st] g) {
	Ee1V(f, g)
	~ VIm(f, g)
	~ Ee2V(f, g)
	~ VIm(g, f)
	~ Ei(V(f), V(g))
}

rule VE([class -> st] f, [class -> st] g) {
	cp[VEm](f, g)
}

rule ttf_IAIpqIqrIpr([class -> st] f, [class -> st] g, [class -> st] h, class x) {
	tt.IAIpqIqrIpr(f(x), g(x), h(x))
}

rule syllV([class -> st] f, [class -> st] g, [class -> st] h) {
	Ai(
		V(If(f, g)),
		V(If(g, h))
	)
	~ VAm2(
		(class x) => I(f(x), g(x)),
		(class x) => I(g(x), h(x))
	)
	~ Vi[ttf_IAIpqIqrIpr](f, g, h)
	~ VIm(
		(class x) => A(I(f(x), g(x)), I(g(x), h(x))),
		(class x) => I(f(x), h(x))
	)
	~ mp(
		V((class x) => A(I(f(x), g(x)), I(g(x), h(x)))),
		V(If(f, h))
	)
}

rule ttf_IAEpqEqrEpr([class -> st] f, [class -> st] g, [class -> st] h, class x) {
	tt.IAEpqEqrEpr(f(x), g(x), h(x))
}

rule syllVE([class -> st] f, [class -> st] g, [class -> st] h) {
	Ai(
		V((class x) => E(f(x), g(x))),
		V((class x) => E(g(x), h(x)))
	)
	~ VAm2(
		(class x) => E(f(x), g(x)),
		(class x) => E(g(x), h(x))
	)
	~ Vi[ttf_IAEpqEqrEpr](f, g, h)
	~ VIm(
		(class x) => A(E(f(x), g(x)), E(g(x), h(x))),
		(class x) => E(f(x), h(x))
	)
	~ mp(
		V((class x) => A(E(f(x), g(x)), E(g(x), h(x)))),
		V((class x) => E(f(x), h(x)))
	)
}

rule ttf_ENOpqANpNq([class -> st] f, [class -> st] g, class x) {
	tt.ENOpqANpNq(f(x), g(x))
}

rule XO([class -> st] f, [class -> st] g) {
	VA(Nf(f), Nf(g)) ~
	tt.IEpAqrENpONqNr(
		V(Af(Nf(f), Nf(g))), V(Nf(f)), V(Nf(g))
	)
	~ mp(
		E(
			V(Af(Nf(f), Nf(g))),
			A(V(Nf(f)), V(Nf(g)))
		),
		E(
			N(V(Af(Nf(f), Nf(g)))),
			O(N(V(Nf(f))), N(V(Nf(g))))
		)
	)
	~ Vi[ttf_ENOpqANpNq](f, g)
	~ VEm(
		(class x) => N(O(f(x), g(x))),
		(class x) => A(N(f(x)), N(g(x)))
	)
	~ tt.IEpqENpNq(
		V((class x) => N(O(f(x), g(x)))),
		V((class x) => A(N(f(x)), N(g(x))))
	)
	~ mp(
		E(
			V((class x) => N(O(f(x), g(x)))),
			V((class x) => A(N(f(x)), N(g(x))))
		),
		E(
			N(V((class x) => N(O(f(x), g(x))))),
			N(V((class x) => A(N(f(x)), N(g(x)))))
		)
	)
	~ syllE(
		X(Of(f, g)),
		N(V(Af(Nf(f), Nf(g)))),
		O(X(f), X(g))
	)
}

rule XI_([class -> st] f, [class -> st] g) {
	XO(Nf(f), g)
}

rule XI([class -> st] f, [class -> st] g) {
	|- E(
		X(If(f, g)),
		I(
			V(f),
			X(g)
		)
	)
}

rule XA([class -> st] f, [class -> st] g) {
	|- I(
		X(Af(f, g)),
		A(X(f), X(g))
	)
}

rule AeX1([class -> st] f, [class -> st] g) {
	tt.IApqp(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(f)
	)
}

rule AeX2([class -> st] f, [class -> st] g) {
	tt.IApqq(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(g)
	)
}

rule mpV([class -> st] f, [class -> st] g) {
	VIm(f, g)
	~ mp(V(f), V(g))
}

rule mpVE([class -> st] f, [class -> st] g) {
	Ee1V(f, g) ~ mpV(f, g)
}

rule Vgen(st p) {
	p |- V((class x) => p)
}

rule Xgen([class -> st] f, class x) {
	f(x) |- X(f)
}

rule Vinst([class -> st] f, class x) {
	V(f) |- f(x)
}

rule Xinst1([class -> st] f, [class -> st] g) {
	X(f), V(If(f, g)) |- X(g)
}

rule Xinst1E([class -> st] f, [class -> st] g) {
	Ee1V(f, g) ~ Xinst1(f, g)
}

rule Xinst2(st p) {
	cp[Vgen](N(p))
	~ tt.IINpqINqp(p, V((class x) => N(p)))
	~ mp(I(N(p), V((class x) => N(p))), I(N(V((class x) => N(p))), p))
	~ id(I(X((class x) => p), p))
	~ mp(X((class x) => p), p)
}

rule Xinst3([class -> st] f, st p) {
	Xinst1(f, (class x) => p)
	~ Xinst2(p)
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

st in(class x, class y);

st Nin(class x, class y) {
	N(in(x, y))
}

st set(class x) {
	X((class y) =>
		in(x, y)
	)
}

rule set_Xgen(class x, class y) {
	Xgen((class y) => in(x, y), y)
	~ id(set(x))
}

rule set_Xgen_A(class x, class y, class z) {
	Ae1(in(z, x), in(z, y)) ~
	set_Xgen(z, x)
}

rule set_Xgen_O(class x, class y, class z) {
	cp[set_Xgen](z, x)
	~ cp[set_Xgen](z, y)
	~ Oe(in(z, x), in(z, y), set(z))
}

st subseteq(class x, class y) {
	V((class z) => (
		I(
			in(z, x),
			in(z, y)
		)
	))
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
	id(eq(x, y)) ~
	Ae2(
		V((class z) => E(in(z, x), in(z, y))),
		V((class w) => E(in(x, w), in(y, w)))
	)
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

st associative([(class, class) -> class] f) {
	V3((class x, class y, class z) =>
		eq(
			f(f(x, y), z),
			f(x, f(y, z))
		)
	)
}

st commutative([(class, class) -> class] f) {
	V2((class x, class y) =>
		eq(
			f(x, y),
			f(y, x)
		)
	)
}

rule set_is_set_1(class x, class y) {
	id(set(x)) ~
	eq_Ae2(x, y)
	~ Xinst1E(
		(class w) => in(x, w),
		(class w) => in(y, w)
	)
	~ id(set(y))
}

rule set_is_set_2(class x, class y) {
	eq_symmetric_tmp(y, x) ~
	set_is_set_1(x, y)
}

rule subseteq_subseteq(class x, class y, class z) {
	id(subseteq(x, y)) ~
	id(subseteq(y, z)) ~
	syllV(
		(class w) => in(w, x),
		(class w) => in(w, y),
		(class w) => in(w, z)
	)
	~ id(subseteq(x, z))
}

rule extensional(class x, class y) {
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

rule extensional_m(class x, class y) {
	extensional(x, y)
	~ mp(
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
	~ extensional(x, y)
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
	~ Ee1V(
		(class z) => in(z, x),
		(class z) => in(z, y)
	)
	~ id(subseteq(x, y))
}

rule eq_then_subseteq(class x, class y) {
	cp[eq_then_subseteq_m](x, y)
}

rule eq_subseteq(class x, class y, class z) {
	eq_then_subseteq_m(x, y)
	~ subseteq_subseteq(x, y, z)
}

rule subseteq_eq(class x, class y, class z) {
	eq_then_subseteq_m(y, z)
	~ subseteq_subseteq(x, y, z)
}

class setbuilder([class -> st] f);

rule setbuilder_def([class -> st] f) {
	|- V((class z) =>
		E(
			in(z, setbuilder(f)),
			f(z)
		)
	)
}

rule setbuilder_def__([class -> st] f) {
	|- V((class z) =>
		E(
			in(z, setbuilder(f)),
			A(set(z), f(z))
		)
	)
}

rule ttf_IAEpAqrIrqEpr([class -> st] f, [class -> st] g, [class -> st] h, class x) {
	tt.IAEpAqrIrqEpr(f(x), g(x), h(x))
}

rule setbuilder_def__set_1([class -> st] f, [class -> st] g, [class -> st] h) {
	Ai(
		V((class x) => E(f(x), A(g(x), h(x)))),
		V((class x) => I(h(x), g(x)))
	) ~
	VAm2(
		(class x) => E(f(x), A(g(x), h(x))),
		(class x) => I(h(x), g(x))
	) ~
	Vi[ttf_IAEpAqrIrqEpr](f, g, h)
	~ VIm(
		(class x) => A(E(f(x), A(g(x), h(x))), I(h(x), g(x))),
		(class x) => E(f(x), h(x))
	)
	~ mp(
		V((class x) => A(E(f(x), A(g(x), h(x))), I(h(x), g(x)))),
		V((class x) => E(f(x), h(x)))
	)
}

rule setbuilder_def__set([class -> st] f) {
	setbuilder_def__(f) ~
	setbuilder_def__set_1(
		(class z) => in(z, setbuilder(f)),
		set,
		f
	)
}

class cap(class x, class y) {
	setbuilder((class z) => A(
		in(z, x), in(z, y)
	))
}

rule cap_vi(class x, class y) {
	Vi[cp[set_Xgen_A]](x, y) ~
	setbuilder_def__set((class z) => A(
		in(z, x), in(z, y)
	))
	~ id(V((class z) => E(
		in(z, cap(x, y)),
		A(in(z, x), in(z, y))
	)))
}

rule cap(class x, class y, class z) {
	Ve[cap_vi](x, y, z)
}

rule cap_commutative_1(class x, class y, class z) {
	cap(x, y, z)
	~ tt.EApqAqp(in(z, x), in(z, y))
	~ cap(y, x, z)
	~ IEpqEqpm(
		in(z, cap(y, x)),
		A(in(z, y), in(z, x))
	)
	~ syllE4(
		in(z, cap(x, y)),
		A(in(z, x), in(z, y)),
		A(in(z, y), in(z, x)),
		in(z, cap(y, x))
	)
}

rule cap_commutative_2(class x, class y) {
	Vi[cap_commutative_1](x, y)
	~ extensional_m(
		cap(x, y),
		cap(y, x)
	)
}

rule cap_commutative() {
	Vi[Vi[cap_commutative_2]]()
	~ id(commutative(cap))
}

class cup(class x, class y) {
	setbuilder((class z) => O(
		in(z, x), in(z, y)
	))
}

rule cup_vi(class x, class y) {
	Vi[cp[set_Xgen_O]](x, y) ~
	setbuilder_def__set((class z) => O(
		in(z, x), in(z, y)
	))
	~ id(V((class z) => E(
		in(z, cup(x, y)),
		O(in(z, x), in(z, y))
	)))
}

rule cup(class x, class y, class z) {
	Ve[cup_vi](x, y, z)
}

class emptyset() {
	setbuilder((class z) => F)
}

rule emptyset_1(class z) {
	cp[contradict](in(z, emptyset()))
}

rule emptyset_2() {
	Vi[emptyset_1]()
}

rule emptyset_3(class x) {
	tt.IApFF(set(x))
}

rule emptyset_vi() {
	setbuilder_def__((class z) => F)
	~ Ee1V(
		(class z) => in(z, emptyset()),
		(class z) => A(set(z), F)
	)
	~ Vi[emptyset_3]()
	~ syllV(
		(class z) => in(z, emptyset()),
		(class z) => A(set(z), F),
		(class z) => F
	)
	~ emptyset_2()
	~ mpV(
		(class z) => I(in(z, emptyset()), F),
		(class z) => Nin(z, emptyset())
	)
}

rule emptyset(class z) {
	Ve[emptyset_vi](z)
}

class universe() {
	setbuilder((class z) => T)
}

rule setbuilder_is_setbuilder([class -> st] f, class x) {
	eq_Ae1(x, setbuilder(f))
	~ setbuilder_def__(f)
	~ syllVE(
		(class z) => in(z, x),
		(class z) => in(z, setbuilder(f)),
		(class z) => A(set(z), f(z))
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

rule power_def(class x) {
	setbuilder_def((class z) => (
		subseteq(z, x)
	))
	~ id(V((class z) => E(
		in(z, power(x)),
		subseteq(z, x)
	)))
}

rule self_in_power(class x, class z) {
	eq_then_subseteq(z, x)
	~ Ve[power_def](x, z)
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

rule specify([class -> st] f) {
	|-
	V((class x) =>
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	)
}

rule specify_vem([class -> st] f, class x) {
	Ve[specify](f, x)
	~ mp(set(x), set(subsetbuilder(x, f)))
}

rule cap_is_set_1(class x, class y) {
	specify_vem((class z) => in(z, y), x)
	~ id(set(cap(x, y)))
}

rule cap_is_set_2(class x, class y) {
	specify_vem((class z) => in(z, x), y)
	~ cap_commutative_2(y, x)
	~ set_is_set_1(cap(y, x), cap(x, y))
}

rule subset_cap_is_subset_1(class x, class y, class z) {
	tt.IIpqEpApq(in(z, x), in(z, y))
}

rule subset_cap_is_subset(class x, class y) {
	id(subseteq(x, y)) ~
	Vi[subset_cap_is_subset_1](x, y)
	~VIm(
		(class z) => I(in(z, x), in(z, y)),
		(class z) => E(
			in(z, x),
			A(in(z, x), in(z, y))
		)
	)
	~ mp(
		V((class z) => I(in(z, x), in(z, y))),
		V((class z) => E(
			in(z, x),
			A(in(z, x), in(z, y))
		))
	) ~
	cap_vi(x, y) ~ IVEpqVEqpfm(
		(class z) => in(z, cap(x, y)),
		(class z) => A(in(z, x), in(z, y))
	) ~
	syllVE(
		(class z) => in(z, x),
		(class z) => A(in(z, x), in(z, y)),
		(class z) => in(z, cap(x, y))
	)
	~ extensional_m(x, cap(x, y))
}

rule subset_is_set(class x, class y) {
	subset_cap_is_subset(x, y)
	~ cap_is_set_2(x, y)
	~ set_is_set_2(cap(x, y), x)
}

rule subset_is_set_ae(class x, class y) {
	Ae1(set(y), subseteq(x, y))
	~ Ae2(set(y), subseteq(x, y))
	~ subset_is_set(x, y)
}

rule subset_is_set_ae_cvi(class x) {
	Vi[cp[subset_is_set_ae]](x)
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

rule ax_power_vem(class x) {
	Ve[ax_power](x)
	~ mp(
		set(x),
		X((class y) => A(
			set(y),
			V((class z) => I(
				subseteq(z, x),
				in(z, y)
			))
		))
	)
}

rule power_is_set_1(class x, class y) {
	power_def(x)
	~ Ee1V(
		(class z) => in(z, power(x)),
		(class z) => subseteq(z, x)
	)
	~ syllV(
		(class z) => in(z, power(x)),
		(class z) => subseteq(z, x),
		(class z) => in(z, y)
	)
	~ id(subseteq(power(x), y))
}

rule power_is_set_2(class x, class y) {
	cp[power_is_set_1](x, y)
	~ tt.IIpqIArpArq(
		V((class z) => I(
			subseteq(z, x),
			in(z, y)
		)),
		subseteq(power(x), y),
		set(y)
	)
	~ mp(
		I(
			V((class z) => I(
				subseteq(z, x),
				in(z, y)
			)),
			subseteq(power(x), y)
		),
		I(
			A(
				set(y),
				V((class z) => I(
					subseteq(z, x),
					in(z, y)
				))
			),
			A(
				set(y),
				subseteq(power(x), y)
			)
		)
	)
}

rule power_is_set_3(class x) {
	ax_power_vem(x)
	~ Vi[power_is_set_2](x)
	~ Xinst1(
		(class y) => A(
			set(y), V((class z) => I(
				subseteq(z, x), in(z, y)
			))
		),
		(class y) => A(
			set(y), subseteq(power(x), y)
		)
	)
}

rule power_is_set(class x) {
	power_is_set_3(x)
	~ subset_is_set_ae_cvi(power(x))
	~ Xinst3(
		(class y) => A(
			set(y), subseteq(power(x), y)
		),
		set(power(x))
	)
}

rule singleton_is_set(class x) {
	singleton_subseteq_power(x)
	~ power_is_set(x)
	~ subset_is_set(singleton(x), power(x))
}

rule infinity() {
	|- X((class x) => A(
		set(x),
		A(
			in(emptyset(), x),
			V((class z) => I(
				in(z ,x),
				in(cup(z, singleton(z)), x)
			))
		)
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

############################
########## GRAPHS ##########
############################

class v2(class x, class y);

rule v2_eq_def(class x, class y, class z, class w) {
	|- E(
		eq(v2(x, y), v2(z, w)),
		A(eq(x, z), eq(y, w))
	)
}

rule v2_set_def(class x, class y) {
	|- E(
		set(v2(x, y)),
		A(set(x), set(y))
	)
}

class cartesian(class x, class y) {
	setbuilder((class z) => (
		X2((class a, class b) => A(
			eq(z, v2(a, b)),
			A(in(a, x), in(b, y))
		))
	))
}

rule cartesian_def(class x, class y) {
	setbuilder_def__((class z) => (
		X2((class a, class b) => A(
			eq(z, v2(a, b)),
			A(in(a, x), in(b, y))
		))
	))
	~ id(V((class z) => (
		E(
			in(z, cartesian(x, y)),
			A(
				set(z),
				X2((class a, class b) => A(
					eq(z, v2(a, b)),
					A(in(a, x), in(b, y))
				))
			)
		)
	)))
}

st graph(class x) {
	V((class z) => (
		I(
			in(z, x),
			X2((class a, class b) => (
				eq(z, v2(a, b))
			))
		)
	))
}

rule cartesian_is_graph(class x, class y) {
	|- graph(cartesian(x, y))
}

`;