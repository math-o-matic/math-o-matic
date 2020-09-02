code = String.raw`
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

"문장 타입."
base type st;

"verum (T). 즉 임의의 항진명제를 표시한다."
$<<\top>>$
st T;

"falsum (F). 즉 임의의 모순명제를 표시한다."
$<<\bot>>$
st F;

"not (FT)."
$\left(<<\neg>>#1\right)$
st N(st p);

"and (TFFF)."
$\left(#1<<\land>>#2\right)$
st A(st p, st q);

"or (TTTF)."
$\left(#1<<\lor>>#2\right)$
st O(st p, st q);

"implies (TFTT)."
$\left(#1<<\to>>#2\right)$
st I(st p, st q);

"iff (TFFT)."
$\left(#1<<\leftrightarrow>>#2\right)$
st E(st p, st q);

"진리표를 만들어 봤을 때 값이 항상 참인 명제 [$p]에 대하여 [$\vdash p]를 포함한다. 어떤 규칙에 접근하려면 Polish notation으로 된 이름을 만들어야 한다.

[ul
	[*] 말단
		[ul
			[*] p, q, r, s, t, u, v, w, x, y, z: 순서대로 1~11번째의 st 타입 입력항.
			[*] T: verum ([$\top]). true의 T.
			[*] F: falsum ([$\bot]). false의 F.
		]
	[*] 일항 연산자
		[ul
			[*] N: not ([$\neg]).
		]
	[*] 이항 연산자
		[ul
			[*] A: and ([$\land]).
			[*] O: or ([$\lor]).
			[*] I: implies ([$\to]).
			[*] E: iff ([$\leftrightarrow]). equivalent의 E인 것으로 하자.
		]
]

대소문자를 구분하고 괄호를 사용하지 않으며 연산자를 맨 앞에 쓰고 인자를 이어 쓴다.

[> 예를 들어 [$\vdash p \land q]는 Apq, [$\vdash \neg (p \land q) \leftrightarrow (\neg p \lor \neg q)]는 ENApqONpNq가 된다.]

tt에 포함되어 있는 규칙의 [$\vdash]의 좌변에는 아무 것도 없으므로, 뭔가를 좌변에 넣으려면 modus ponens를 적용해야 한다.

이후 이것을 없애고 한정된 몇 가지의 규칙만을 사용하여 공리계를 구축하여야 할 것이다.

[~(href=./tt.html)인터랙티브 페이지]"
axiomatic native ruleset tt;

"sequent calculus의 cut 규칙. 즉
[$$\frac{\Delta\vdash p\quad \Sigma_1,p,\Sigma_2\vdash q}{\Sigma_1,\Delta,\Sigma_2\vdash q}]
이다. 단 [$p]의 첫 번째 일치가 [$\Delta]로 치환된다. 즉 [$\Sigma_1]에는 [$p]가 없다.

1계층 reduction 구문을 도입한다면 그로부터 증명할 수 있다."
axiomatic native schema cut;

"함의 도입(implication introduction). conditional proof를 가능케 한다. 힐베르트 체계(Hilbert system)에서는 메타정리(metatheorem)이며 연역 정리(deduction theorem)라 부른다. 즉
[$$\frac{\Delta, p\vdash q}{\Delta\vdash p\to q}]
에 해당한다."
axiomatic native schema cp;

"modus ponens. 함의 소거(implication elimination) 또는 전건 긍정이라고도 한다."
axiomatic schema mp(st p, st q) {
	(p, I(p, q) |- q)
}

"mp의 다른 버전. 즉
[$$\frac{\Delta\vdash p\to q}{\Delta, p\vdash q}]
이다. mp보다 적용하는 것이 간단하다. mp로부터 증명할 수 있으나 아직 표현할 수 있는 방법이 없다."
axiomatic native schema mpu;

"연언 도입(conjunction introduction)."
schema Ai(st p, st q) {
	mpu[mpu[tt.IpIqApq(p, q)]]
}

"연언 도입 2번."
schema A3i(st p, st q, st r) {
	Ai(p, q) ~ Ai(A(p, q), r)
}

"연언 소거(conjunction elimination) 1."
schema Ae1(st p, st q) {
	mpu[tt.IApqp(p, q)]
}

"연언 소거(conjunction elimination) 2."
schema Ae2(st p, st q) {
	mpu[tt.IApqq(p, q)]
}

"선언 도입(disjunction introduction) 1."
schema Oi1(st p, st q) {
	mpu[tt.IpOpq(p, q)]
}

"선언 도입(disjunction introduction) 2."
schema Oi2(st p, st q) {
	mpu[tt.IqOpq(p, q)]
}

"선언 소거(disjunction elimination). proof by cases라고도 한다."
schema Oe(st p, st q, st r) {
	A3i(
		O(p, q),
		I(p, r),
		I(q, r)
	)
	~ mpu[tt.IAAOpqIprIqrr(p, q, r)]
}

"부정 도입(negation introduction). 귀류법(reductio ad absurdum)이라고도 한다."
schema Ni(st p) {
	mpu[tt.IIpFNp(p)]
}

"부정 소거(negation elimination). 폭발률(ex falso quodlibet)이라고도 한다."
schema Ne(st p, st q) {
	mpu[mpu[tt.IpINpq(p, q)]]
}

"이중부정 도입(double negation introduction)."
schema NNi(st p) {
	mpu[tt.IpNNp(p)]
}

"이중부정 소거(double negation elimination)."
schema NNe(st p) {
	mpu[tt.INNpp(p)]
}

"쌍조건문 도입(biconditional introduction)."
schema Ei(st p, st q) {
	Ai(I(p, q), I(q, p))
	~ mpu[tt.IAIpqIqpEpq(p, q)]
}

"쌍조건문 소거(biconditional elimination) 1."
schema Ee1(st p, st q) {
	mpu[tt.IEpqIpq(p, q)]
}

"쌍조건문 소거(biconditional elimination) 2."
schema Ee2(st p, st q) {
	mpu[tt.IEpqIqp(p, q)]
}

schema IEpqEqpm(st p, st q) {
	mpu[tt.IEpqEqp(p, q)]
}

schema IpIqpm(st p, st q) {
	mpu[tt.IpIqp(p, q)]
}

"E를 위한 mp."
schema mpE(st p, st q) {
	mpu[Ee1(p, q)]
}

"가언적 삼단논법(hypothetical syllogism)."
schema syll(st p, st q, st r) {
	Ai(I(p, q), I(q, r))
	~ mpu[tt.IAIpqIqrIpr(p, q, r)]
}

"syll을 두 번 적용한 것. 사단논법이라 해도 좋을 것이다."
schema syll4(st p, st q, st r, st s) {
	syll(p, q, r) ~ syll(p, r, s)
}

"E를 위한 syll."
schema syllE(st p, st q, st r) {
	Ai(E(p, q), E(q, r))
	~ mpu[tt.IAEpqEqrEpr(p, q, r)]
}

schema syllE4(st p, st q, st r, st s) {
	syllE(p, q, r) ~ syllE(p, r, s)
}

"sequent calculus의 I 규칙 같은 것. 표현형식을 바꾸는 데 쓰이고 있다."
schema id(st p) {
	mpu[tt.Ipp(p)]
}

"[$\bot]을 도입한다. falsum introduction이라 불러도 좋을 것이다."
schema Fi(st p) {
	Ne(p, F)
}

"[$\bot]을 소거한다. falsum elimination이라 불러도 좋을 것이다. Ne와 마찬가지로 폭발률을 나타낸다 할 수 있다."
schema Fe(st p) {
	mpu[tt.IFp(p)]
}

"대우명제(contrapositive)를 유도한다."
schema contrapose(st p, st q) {
	mpu[tt.IIpqINqNp(p, q)]
}

"후건 부정(modus tollens)."
schema mt(st p, st q) {
	mpu[contrapose(p, q)]
}

schema swap_c(st p, st q, st r) {
	tt.IIpIqrIqIpr(p, q, r)
}

schema swap(st p, st q, st r) {
	mpu[swap_c(p, q, r)]
}

schema swap_m(st p, st q, st r) {
	mpu[swap(p, q, r)]
}

#################################
######## PREDICATE LOGIC ########
#################################

"클래스 타입. 술어 논리에서 쓰인다."
type cls;

"class 하나를 받는 술어 타입."
type [cls -> st] pr;

"class 두 개를 받는 술어 타입."
type [(cls, cls) -> st] pr2;

"class 세 개를 받는 술어 타입."
type [(cls, cls, cls) -> st] pr3;

"pr 타입을 위한 A."
$\left(#1<<\land>>#2\right)$
pr Af(pr f, pr g) {
	(cls z) => { A(f(z), g(z)) }
}

"pr 타입을 위한 O."
$\left(#1<<\lor>>#2\right)$
pr Of(pr f, pr g) {
	(cls z) => { O(f(z), g(z)) }
}

"pr 타입을 위한 I."
$\left(#1<<\to>>#2\right)$
pr If(pr f, pr g) {
	(cls z) => { I(f(z), g(z)) }
}

"pr 타입을 위한 E."
$\left(#1<<\leftrightarrow>>#2\right)$
pr Ef(pr f, pr g) {
	(cls z) => { E(f(z), g(z)) }
}

"pr 타입을 위한 N."
$\left(<<\neg>>#1\right)$
pr Nf(pr f) {
	(cls z) => { N(f(z)) }
}

"보편 양화(universal quantification). 일반적인 표기법과는 다르게 pr을 입력으로 받는다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\forall>>#1\right)$
st V(pr f);

"pr2를 위한 보편 양화."
$\left(<<\forall>>#1\right)$
st V2(pr2 f) {
	V((cls x) => {
		V((cls y) => {
			f(x, y)
		})
	})
}

"pr3을 위한 보편 양화."
$\left(<<\forall>>#1\right)$
st V3(pr3 f) {
	V((cls x) => {
		V((cls y) => {
			V((cls z) => {
				f(x, y, z)
			})
		})
	})
}

"존재 양화(existential quantification). 일반적인 표기법과는 다르게 pr을 입력으로 받으며 V에 의존한다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\exists>>#1\right)$
st X(pr f) {
	N(V((cls x) => { N(f(x)) }))
}

"pr2를 위한 존재 양화. V2에 의존한다."
$\left(<<\exists>>#1\right)$
st X2(pr2 f) {
	N(V2((cls x, cls y) => { N(f(x, y)) }))
}

"보편 양화 도입(universal introduction)."
axiomatic schema Vi(pr f) {
	(f |- V(f))
}

schema Vi_p(st p) {
	// 에러난다
	// (p |- Vi((cls x) => { p })[(cls x) => { p }])
	(p |- V((cls x) => { p }))
}

schema Vi_c(st p) {
	cp[Vi_p(p)]
}

"보편 양화 소거(universal elimination)."
axiomatic schema Ve(pr f, cls x) {
	(V(f) |- f(x))
}

"Vi의 다른 버전."
axiomatic schema Viu(pr f) {
	((cls x) => { (|- f(x)) } |- (|- V(f)))
}

"Ve의 다른 버전."
axiomatic schema Veu(pr f, cls x) {
	((|- V(f)) |- (|- f(x)))
}

"[$\forall]과 [$\land] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VI만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
axiomatic schema VA(pr f, pr g) {
	(|- E(
		V(Af(f, g)),
		A(V(f), V(g))
	))
}

"[$\forall]과 [$\to] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VA만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
axiomatic schema VI(pr f, pr g) {
	(|- I(
		V(If(f, g)),
		I(V(f), V(g))
	))
}

axiomatic schema VO(pr f, pr g) {
	(|- I(
		O(V(f), V(g)),
		V(Of(f, g))
	))
}

"[$\forall x\forall y]랑 [$\forall y\forall x]가 같다는 것. 특이하게도 Viu 및 Veu로부터 유도할 수 있는 것으로 보이나 아직 표현할 방식이 없다."
axiomatic schema VV(pr2 f) {
	(|- I(
		V2((cls x, cls y) => { f(x, y) }),
		V2((cls y, cls x) => { f(x, y) })
	))
}

"VA의 m1형."
schema VAm1(pr f, pr g) {
	mpu[VA(f, g)
	~ Ee1(
		V(Af(f, g)),
		A(V(f), V(g))
	)]
}

"VA의 m2형."
schema VAm2(pr f, pr g) {
	mpu[VA(f, g)
	~ Ee2(
		V(Af(f, g)),
		A(V(f), V(g))
	)]
}

"VI의 m형."
schema VIm(pr f, pr g) {
	mpu[VI(f, g)]
}

"VV의 m형."
schema VVm(pr2 f) {
	mpu[VV(f)]
}

"IEpqEqpm의 V형."
schema IVEpqVEqpfm(pr f, pr g) {
	mpu[
		Viu((cls x) => {
			I(E(f(x), g(x)), E(g(x), f(x)))
		})[(cls x) => { tt.IEpqEqp(f(x), g(x)) }]
		~ VIm(
			(cls x) => { E(f(x), g(x)) },
			(cls x) => { E(g(x), f(x)) }
		)
	]
}

"Ee1의 V형."
schema Ee1V(pr f, pr g) {
	mpu[
		Viu((cls x) => {
			I(E(f(x), g(x)), I(f(x), g(x)))
		})[(cls x) => {tt.IEpqIpq(f(x), g(x))}]
		~ VIm(
			(cls z) => { E(f(z), g(z)) },
			(cls z) => { I(f(z), g(z)) }
		)
	]
}

"Ee2의 V형."
schema Ee2V(pr f, pr g) {
	IVEpqVEqpfm(f, g)
	~ Ee1V(g, f)
}

schema VEm(pr f, pr g) {
	Ee1V(f, g)
	~ VIm(f, g)
	~ Ee2V(f, g)
	~ VIm(g, f)
	~ Ei(V(f), V(g))
}

schema VE(pr f, pr g) {
	cp[VEm(f, g)]
}

schema syllV(pr f, pr g, pr h) {
	Ai(
		V(If(f, g)),
		V(If(g, h))
	)
	~ VAm2(
		(cls x) => { I(f(x), g(x)) },
		(cls x) => { I(g(x), h(x)) }
	)
	~ mpu[
		Viu((cls x) => {
			I(A(I(f(x), g(x)), I(g(x), h(x))), I(f(x), h(x)))
		})[(cls x) => {tt.IAIpqIqrIpr(f(x), g(x), h(x))}]
		~ VIm(
			(cls x) => { A(I(f(x), g(x)), I(g(x), h(x))) },
			(cls x) => { I(f(x), h(x)) }
		)
	]
}

schema syllVE(pr f, pr g, pr h) {
	Ai(
		V((cls w) => { E(f(w), g(w)) }),
		V((cls w) => { E(g(w), h(w)) })
	)
	~ VAm2(
		(cls w) => { E(f(w), g(w)) },
		(cls w) => { E(g(w), h(w)) }
	)
	~ mpu[
		Viu((cls x) => {
			I(A(E(f(x), g(x)), E(g(x), h(x))), E(f(x), h(x)))
		})[(cls x) => {tt.IAEpqEqrEpr(f(x), g(x), h(x))}]
		~ VIm(
			(cls w) => { A(E(f(w), g(w)), E(g(w), h(w))) },
			(cls w) => { E(f(w), h(w)) }
		)
	]
}

schema VI_Vi(st p, pr f) {
	Vi_c(p) ~
	VIm((cls z) => {p}, f)
	~ syll(
		p,
		V((cls z) => {p}),
		V(f)
	)
}

schema VI_Vi_c(st p, pr f) {
	cp[VI_Vi(p, f)]
}

schema VI_Vi_V2(pr f, pr2 g, cls z) {
	VI_Vi_c(f(z), (cls w) => {g(z, w)})
}

schema VI_Vi_V2_Vi(pr f, pr2 g) {
	Viu((cls z) => {
		I(V((cls w) => {I(f(z), g(z, w))}), I(f(z), V((cls w) => {g(z, w)})))
	})[(cls z) => {VI_Vi_V2(f, g, z)}]
}

schema VI_Vi_V2_Vi_VI(pr f, pr2 g) {
	VI_Vi_V2_Vi(f, g)
	~ VIm(
		(cls z) => {
			V((cls w) => {
				I(f(z), g(z, w))
			})
		},
		(cls z) => {
			I(
				f(z),
				V((cls w) => {
					g(z, w)
				})
			)
		}
	)
}

schema VI_Vi_V2_Vi_VI_m(pr f, pr2 g) {
	id(V2((cls z, cls w) => {
		I(f(z), g(z, w))
	})) ~
	mpu[VI_Vi_V2_Vi_VI(f, g)]
}

"존재 양화 도입(existential introduction). Ve와 합치면 [$\forall f \vdash \exists f]가 될 것도 같으나 어떤 class x가 있어야 한다."
schema Xi(pr f, cls x) {
	NNi(f(x)) ~
	mpu[
		cp[Ve(Nf(f), x)]
		~ contrapose(V(Nf(f)), N(f(x)))
	] ~ id(X(f))
}

"존재 양화 소거(existential elimination) 같은 것 1."
schema Xinst1(pr f, pr g) {
	(X(f), V(If(f, g)) |- X(g))
}

schema Xinst1E(pr f, pr g) {
	Ee1V(f, g) ~ Xinst1(f, g)
}

"존재 양화 소거(existential elimination) 같은 것 2."
schema Xinst2(st p) {
	id(X((cls x) => {p})) ~
	mpu[cp[Vi_p(N(p))]
	~ mpu[tt.IINpqINqp(p, V((cls x) => { N(p) }))]]
}

schema Xinst3(pr f, st p) {
	Xinst1(f, (cls x) => { p })
	~ Xinst2(p)
}

"[$\exists]과 [$\lor] 간의 분배법칙 같은 것. VA로부터 증명할 수 있다."
schema XO(pr f, pr g) {
	(VA(Nf(f), Nf(g)) ~
	mpu[tt.IEpAqrENpONqNr(
		V(Af(Nf(f), Nf(g))), V(Nf(f)), V(Nf(g))
	)])
	~ ((
		Viu((cls x) => {
			E(N(O(f(x), g(x))), A(N(f(x)), N(g(x))))
		})[(cls x) => {tt.ENOpqANpNq(f(x), g(x))}]
		~ VEm(
			(cls x) => { N(O(f(x), g(x))) },
			(cls x) => { A(N(f(x)), N(g(x))) }
		)
	)
	~ mpu[tt.IEpqENpNq(
		V((cls x) => { N(O(f(x), g(x))) }),
		V((cls x) => { A(N(f(x)), N(g(x))) })
	)])
	~ syllE(
		X(Of(f, g)),
		N(V(Af(Nf(f), Nf(g)))),
		O(X(f), X(g))
	)
}

schema XA(pr f, pr g) {
	(|- I(
		X(Af(f, g)),
		A(X(f), X(g))
	))
}

schema AeX1(pr f, pr g) {
	tt.IApqp(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(f)
	)
}

schema AeX2(pr f, pr g) {
	tt.IApqq(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(g)
	)
}

schema mpV(pr f, pr g) {
	mpu[VIm(f, g)]
}

schema mpVE(pr f, pr g) {
	Ee1V(f, g) ~ mpV(f, g)
}

############################
######## SET THEORY ########
############################

"집합론에서 정의하는 in 연산자."
$\left(#1<<\in>>#2\right)$
st in(cls x, cls y);

"not in 연산자."
$\left(#1<<\notin>>#2\right)$
st Nin(cls x, cls y) {
	N(in(x, y))
}

"어떤 class 내에서의 forall."
$\left(<<\forall>>_{#1}#2\right)$
st Vin(cls a, pr f) {
	V((cls z) => {
		I(
			in(z, a),
			f(z)
		)
	})
}

schema VVin_m(cls a, pr2 f) {
	id(V((cls z) => {
		Vin(a, (cls w) => {f(z, w)})
	})) ~
	VVm((cls z, cls w) => {
		I(in(w, a), f(z, w))
	}) ~ VI_Vi_V2_Vi_VI_m(
		(cls y) => {in(y, a)},
		(cls y, cls x) => {f(x, y)}
	) ~ id(Vin(a, (cls w) => {
		V((cls z) => {f(z, w)})
	}))
}

"V와 Vin은 순서를 바꿀 수 있다."
schema VVin(cls a, pr2 f) {
	cp[VVin_m(a, f)]
}

"어떤 class 내에서의 exists. Vin과 달리 and로 연결된다."
$\left(<<\exists>>_{#1}#2\right)$
st Xin(cls a, pr f) {
	X((cls z) => {
		A(
			in(z, a),
			f(z)
		)
	})
}

"어떤 class가 집합이라는 것. 어떤 class의 원소면 된다."
$\left(<<\mathop\mathrm{set}>> #1\right)$
st set(cls x) {
	X((cls y) => {
		in(x, y)
	})
}

schema set_Xi(cls x, cls y) {
	Xi((cls y) => { in(x, y) }, y)
	~ id(set(x))
}

schema set_Xi_A(cls x, cls y, cls z) {
	Ae1(in(z, x), in(z, y)) ~
	set_Xi(z, x)
}

schema set_Xi_O(cls x, cls y, cls z) {
	cp[set_Xi(z, x)]
	~ cp[set_Xi(z, y)]
	~ Oe(in(z, x), in(z, y), set(z))
}

"[$\subseteq]."
$\left(#1<<\subseteq>>#2\right)$
st subseteq(cls x, cls y) {
	V((cls z) => {
		I(
			in(z, x),
			in(z, y)
		)
	})
}

"[$=] 연산자. [$\in]에 의존한다."
$\left(#1<<=>>#2\right)$
st eq(cls x, cls y) {
	A(
		V((cls z) => {
			E(in(z, x), in(z, y))
		}),
		V((cls w) => {
			E(in(x, w), in(y, w))
		})
	)
}

schema eq_Ae1(cls x, cls y) {
	id(eq(x, y))
	~ Ae1(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	)
}

schema eq_Ae1_Ve(cls x, cls y, cls z) {
	eq_Ae1(x, y)
	~ Ve((cls z) => {
		E(in(z, x), in(z, y))
	}, z)
}

schema eq_Ae1_Ve_Ee1(cls x, cls y, cls z) {
	eq_Ae1_Ve(x, y, z)
	~ Ee1(in(z, x), in(z, y))
}

schema eq_Ae2(cls x, cls y) {
	id(eq(x, y)) ~
	Ae2(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	)
}

schema eq_Ae2_Ve(cls x, cls y, cls z) {
	eq_Ae2(x, y)
	~ Ve((cls z) => {
		E(in(x, z), in(y, z))
	}, z)
}

schema eq_Ae2_Ve_Ee1(cls x, cls y, cls z) {
	eq_Ae2_Ve(x, y, z)
	~ Ee1(in(x, z), in(y, z))
}

schema eq_Ae2_Ve_Ee1_c(cls x, cls y, cls z) {
	cp[eq_Ae2_Ve_Ee1(x, y, z)]
}

schema swapV_1(pr f, pr g, pr h, cls w) {
	swap_c(f(w), g(w), h(w))
}

schema swapV_c(pr f, pr g, pr h) {
	Viu((cls w) => {
		I(I(f(w), I(g(w), h(w))), I(g(w), I(f(w), h(w))))
	})[(cls w) => {swapV_1(f, g, h, w)}]
	~ VIm(
		(cls w) => {I(f(w), I(g(w), h(w)))},
		(cls w) => {I(g(w), I(f(w), h(w)))}
	)
}

schema swapV(pr f, pr g, pr h) {
	mpu[swapV_c(f, g, h)]
}

schema swapV2_1(pr2 f, pr2 g, pr2 h, cls z) {
	swapV_c(
		(cls w) => {f(z, w)},
		(cls w) => {g(z, w)},
		(cls w) => {h(z, w)}
	)
}

schema swapV2_c(pr2 f, pr2 g, pr2 h) {
	Viu((cls z) => {
		I(
			V((cls w) => {I(f(z, w), I(g(z, w), h(z, w)))}),
			V((cls w) => {I(g(z, w), I(f(z, w), h(z, w)))})
		)
	})[(cls z) => {swapV2_1(f, g, h, z)}]
	~ VIm(
		(cls z) => {
			V((cls w) => {
				I(f(z, w), I(g(z, w), h(z, w)))
			})
		},
		(cls z) => {
			V((cls w) => {
				I(g(z, w), I(f(z, w), h(z, w)))
			})
		}
	)
	~ id(I(
		V2((cls z, cls w) => {
			I(f(z, w), I(g(z, w), h(z, w)))
		}),
		V2((cls z, cls w) => {
			I(g(z, w), I(f(z, w), h(z, w)))
		})
	))
}

schema swapV2(pr2 f, pr2 g, pr2 h) {
	mpu[swapV2_c(f, g, h)]
}

schema eq_Ae2_Ve_Ee1_c_swap(cls x, cls y, cls z) {
	eq_Ae2_Ve_Ee1_c(x, y, z)
	~ swap(
		eq(x, y),
		in(x, z),
		in(y, z)
	)
}

schema eq_reflexive_tmp1(cls x, cls z) {
	tt.Epp(in(z, x))
}

schema eq_reflexive_tmp2(cls x, cls w) {
	tt.Epp(in(x, w))
}

schema eq_reflexive(cls x) {
	Viu((cls z) => {
		E(in(z, x), in(z, x))
	})[(cls z) => {eq_reflexive_tmp1(x, z)}]
	~ Viu((cls w) => {
		E(in(x, w), in(x, w))
	})[(cls w) => {eq_reflexive_tmp2(x, w)}]
	~ Ai(
		V((cls z) => { E(in(z, x), in(z, x)) }),
		V((cls w) => { E(in(x, w), in(x, w)) })
	)
	~ id(eq(x, x))
}

schema eq_symmetric(cls x, cls y) {
	id(eq(x, y)) ~
	Ae1(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	) ~ IVEpqVEqpfm(
		(cls z) => { in(z, x) },
		(cls z) => { in(z, y) }
	) ~ Ae2(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	) ~ IVEpqVEqpfm(
		(cls w) => { in(x, w) },
		(cls w) => { in(y, w) }
	) ~ Ai(
		V((cls z) => { E(in(z, y), in(z, x)) }),
		V((cls w) => { E(in(y, w), in(x, w)) })
	)
	~ id(eq(y, x))
}

schema eq_transitive(cls x, cls y, cls z) {
	id(eq(y, z)) ~
	Ae1(
		V((cls w) => {E(in(w, y), in(w, z))}),
		V((cls w) => {E(in(y, w), in(z, w))})
	) ~
	Ae2(
		V((cls w) => {E(in(w, y), in(w, z))}),
		V((cls w) => {E(in(y, w), in(z, w))})
	) ~
	id(eq(x, y)) ~
	Ae1(
		V((cls w) => {E(in(w, x), in(w, y))}),
		V((cls w) => {E(in(x, w), in(y, w))})
	) ~
	Ae2(
		V((cls w) => {E(in(w, x), in(w, y))}),
		V((cls w) => {E(in(x, w), in(y, w))})
	) ~
	syllVE(
		(cls w) => {in(w, x)},
		(cls w) => {in(w, y)},
		(cls w) => {in(w, z)}
	)
	~ syllVE(
		(cls w) => {in(x, w)},
		(cls w) => {in(y, w)},
		(cls w) => {in(z, w)}
	)
	~ Ai(
		V((cls w) => {E(in(w, x), in(w, z))}),
		V((cls w) => {E(in(x, w), in(z, w))})
	)
	~ id(eq(x, z))
}

schema eq_transitive_3(cls x, cls y, cls z) {
	eq_transitive(x, y, z)
	~ eq_symmetric(x, z)
}

schema eq_transitive_2(cls x, cls y, cls z) {
	eq_symmetric(z, y) ~
	eq_transitive(x, y, z)
}

schema eq_transitive_23(cls x, cls y, cls z) {
	eq_symmetric(z, y) ~
	eq_transitive(x, y, z)
	~ eq_symmetric(x, z)
}

schema eq_transitive_1(cls x, cls y, cls z) {
	eq_symmetric(y, x)
	~ eq_transitive(x, y, z)
}

schema eq_transitive_13(cls x, cls y, cls z) {
	eq_symmetric(y, x)
	~ eq_transitive(x, y, z)
	~ eq_symmetric(x, z)
}

"uniqueness quantification."
$\left(<<\exists!>>#1\right)$
st Q(pr f) {
	X((cls x) => {
		V((cls y) => {
			E(f(y), eq(y, x))
		})
	})
}

schema set_is_set_1(cls x, cls y) {
	id(set(x)) ~
	eq_Ae2(x, y)
	~ Xinst1E(
		(cls w) => { in(x, w) },
		(cls w) => { in(y, w) }
	)
	~ id(set(y))
}

schema set_is_set_2(cls x, cls y) {
	eq_symmetric(y, x) ~
	set_is_set_1(x, y)
}

schema subseteq_subseteq(cls x, cls y, cls z) {
	id(subseteq(x, y)) ~
	id(subseteq(y, z)) ~
	syllV(
		(cls w) => { in(w, x) },
		(cls w) => { in(w, y) },
		(cls w) => { in(w, z) }
	)
	~ id(subseteq(x, z))
}

"axiom of extensionality."
axiomatic schema extensional(cls x, cls y) {
	(|- I(
		V((cls z) => {
			E(
				in(z, x),
				in(z, y)
			)
		}),
		eq(x, y)
	))
}

schema extensional_m(cls x, cls y) {
	mpu[extensional(x, y)]
}

schema eq_simple(cls x, cls y) {
	cp[eq_Ae1(x, y)]
	~ extensional(x, y)
	~ Ei(
		eq(x, y),
		V((cls z) => { E(in(z, x), in(z, y)) })
	)
}

schema eq_then_subseteq_m(cls x, cls y) {
	eq_simple(x, y)
	~ mpE(
		eq(x, y),
		V((cls z) => { E(in(z, x), in(z, y)) })
	)
	~ Ee1V(
		(cls z) => { in(z, x) },
		(cls z) => { in(z, y) }
	)
	~ id(subseteq(x, y))
}

schema eq_then_subseteq(cls x, cls y) {
	cp[eq_then_subseteq_m(x, y)]
}

schema eq_subseteq(cls x, cls y, cls z) {
	eq_then_subseteq_m(x, y)
	~ subseteq_subseteq(x, y, z)
}

schema subseteq_eq(cls x, cls y, cls z) {
	eq_then_subseteq_m(y, z)
	~ subseteq_subseteq(x, y, z)
}

"술어를 만족하는 set들의 class를 만든다. 일반적으로는 [$\{z: f(z)\}]라고 쓰는 것."
$\left\{<<:>>#1\right\}$
cls setbuilder(pr f);

"setbuilder의 defining property. f를 만족하는 임의의 [**집합]의 class를 만들게 해 준다."
axiomatic schema setbuilder_def(pr f) {
	(|- V((cls w) => {
		E(
			in(w, setbuilder(f)),
			A(set(w), f(w))
		)
	}))
}

schema setbuilder_def_Ve(pr f, cls z) {
	Veu((cls w) => {
		E(in(w, setbuilder(f)), A(set(w), f(w)))
	}, z)[setbuilder_def(f)]
}

schema setbuilder_def_Ve_Ee(pr f, cls z) {
	setbuilder_def_Ve(f, z)
	~ mpu[tt.IEpAqrIpr(
		in(z, setbuilder(f)),
		set(z),
		f(z)
	)]
}

schema setbuilder_def_set_1(pr f, pr g, pr h) {
	Ai(
		V((cls x) => { E(f(x), A(g(x), h(x))) }),
		V((cls x) => { I(h(x), g(x)) })
	) ~
	VAm2(
		(cls x) => { E(f(x), A(g(x), h(x))) },
		(cls x) => { I(h(x), g(x)) }
	) ~
	mpu[
		Viu((cls x) => {
			I(A(E(f(x), A(g(x), h(x))), I(h(x), g(x))), E(f(x), h(x)))
		})[(cls x) => {tt.IAEpAqrIrqEpr(f(x), g(x), h(x))}]
		~ VIm(
			(cls x) => { A(E(f(x), A(g(x), h(x))), I(h(x), g(x))) },
			(cls x) => { E(f(x), h(x)) }
		)
	]
}

schema setbuilder_def_set(pr f) {
	setbuilder_def(f) ~
	setbuilder_def_set_1(
		(cls z) => { in(z, setbuilder(f)) },
		set,
		f
	)
}

"[$\cap]."
$\left(#1<<\cap>>#2\right)$
cls cap(cls x, cls y) {
	setbuilder((cls z) => {
		A(in(z, x), in(z, y))
	})
}

schema set_Xi_A_c(cls x, cls y, cls z) {
	cp[set_Xi_A(x, y, z)]
}

schema cap_def_vi(cls x, cls y) {
	Viu((cls z) => {
		I(A(in(z, x), in(z, y)), set(z))
	})[(cls z) => { set_Xi_A_c(x, y, z) }] ~
	setbuilder_def_set((cls z) => {
		A(in(z, x), in(z, y))
	})
	~ id(V((cls z) => {
		E(
			in(z, cap(x, y)),
			A(in(z, x), in(z, y))
		)
	}))
}

schema cap_def(cls x, cls y, cls z) {
	Veu((cls z) => {
		E(in(z, cap(x, y)), A(in(z, x), in(z, y)))
	}, z)[cap_def_vi(x, y)]
}

schema cap_commutative_1(cls x, cls y, cls z) {
	cap_def(x, y, z)
	~ tt.EApqAqp(in(z, x), in(z, y))
	~ cap_def(y, x, z)
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

schema cap_commutative_2(cls x, cls y) {
	Viu((cls z) => {
		E(in(z, cap(x, y)), in(z, cap(y, x)))
	})[(cls z) => { cap_commutative_1(x, y, z) }]
	~ extensional_m(
		cap(x, y),
		cap(y, x)
	)
}

"[$\cup]."
$\left(#1<<\cup>>#2\right)$
cls cup(cls x, cls y) {
	setbuilder((cls z) => {
		O(in(z, x), in(z, y))
	})
}

schema set_Xi_O_c(cls x, cls y, cls z) {
	cp[set_Xi_O(x, y, z)]
}

schema cup_def_vi(cls x, cls y) {
	Viu((cls z) => {
		I(O(in(z, x), in(z, y)), set(z))
	})[(cls z) => { set_Xi_O_c(x, y, z) }] ~
	setbuilder_def_set((cls z) => {
		O(in(z, x), in(z, y))
	})
	~ id(V((cls z) => {
		E(
			in(z, cup(x, y)),
			O(in(z, x), in(z, y))
		)
	}))
}

schema cup_def(cls x, cls y, cls z) {
	Veu((cls z) => {
		E(in(z, cup(x, y)), O(in(z, x), in(z, y)))
	}, z)[cup_def_vi(x, y)]
}

"empty class."
$<<\varnothing>>$
cls emptyset() {
	setbuilder((cls z) => { F })
}

schema emptyset_1(cls z) {
	cp[Ni(in(z, emptyset()))]
}

schema emptyset_2() {
	Viu((cls z) => {
		I(I(in(z, emptyset()), F), N(in(z, emptyset())))
	})[emptyset_1]
}

schema emptyset_3(cls x) {
	tt.IApFF(set(x))
}

schema emptyset_vi() {
	setbuilder_def((cls z) => { F })
	~ Ee1V(
		(cls z) => { in(z, emptyset()) },
		(cls z) => { A(set(z), F) }
	)
	~ Viu((cls x) => {
		I(A(set(x), F), F)
	})[emptyset_3]
	~ syllV(
		(cls z) => { in(z, emptyset()) },
		(cls z) => { A(set(z), F) },
		(cls z) => { F }
	)
	~ emptyset_2()
	~ mpV(
		(cls z) => { I(in(z, emptyset()), F) },
		(cls z) => { Nin(z, emptyset()) }
	)
}

"emptyset의 defining property."
schema emptyset_def(cls z) {
	Veu((cls z) => {
		Nin(z, emptyset())
	}, z)[emptyset_vi()]
}

"universal class."
$<<V>>$
cls universe() {
	setbuilder((cls z) => { T })
}

schema setbuilder_is_setbuilder(pr f, cls x) {
	eq_Ae1(x, setbuilder(f))
	~ setbuilder_def(f)
	~ syllVE(
		(cls z) => { in(z, x) },
		(cls z) => { in(z, setbuilder(f)) },
		(cls z) => { A(set(z), f(z)) }
	)
}

"술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.
일반적으로는 [$\{z \in x: f(z)\}]라고 쓰는 것인데 더미 변수를 없애버렸다."
$\left\{#1<<:>>#2\right\}$
cls subsetbuilder(cls x, pr f) {
	setbuilder((cls y) => {
		A(
			in(y, x),
			f(y)
		)
	})
}

"axiom schema of specification. 어떤 집합에서 임의 술어를 만족시키는 원소들의 class를 만들었을 때 이 class가 집합이라는 뜻이다."
axiomatic schema specify(pr f) {
	(|-
	V((cls x) => {
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	}))
}

schema specify_vem(pr f, cls x) {
	mpu[Veu((cls x) => {
		I(set(x), set(subsetbuilder(x, f)))
	}, x)[specify(f)]]
}

schema cap_is_set_1(cls x, cls y) {
	specify_vem((cls z) => { in(z, y) }, x)
	~ id(set(cap(x, y)))
}

schema cap_is_set_2(cls x, cls y) {
	specify_vem((cls z) => { in(z, x) }, y)
	~ cap_commutative_2(y, x)
	~ set_is_set_1(cap(y, x), cap(x, y))
}

schema subset_cap_is_subset(cls x, cls y) {
	id(subseteq(x, y)) ~
	mpu[Viu((cls z) => {
		I(I(in(z, x), in(z, y)), E(in(z, x), A(in(z, x), in(z, y))))
	})[(cls z) => {
		tt.IIpqEpApq(in(z, x), in(z, y))
	}]
	~VIm(
		(cls z) => { I(in(z, x), in(z, y)) },
		(cls z) => {
			E(
				in(z, x),
				A(in(z, x), in(z, y))
			)
		}
	)] ~
	cap_def_vi(x, y) ~ IVEpqVEqpfm(
		(cls z) => { in(z, cap(x, y)) },
		(cls z) => { A(in(z, x), in(z, y)) }
	) ~
	syllVE(
		(cls z) => { in(z, x) },
		(cls z) => { A(in(z, x), in(z, y)) },
		(cls z) => { in(z, cap(x, y)) }
	)
	~ extensional_m(x, cap(x, y))
}

schema subset_is_set(cls x, cls y) {
	subset_cap_is_subset(x, y)
	~ cap_is_set_2(x, y)
	~ set_is_set_2(cap(x, y), x)
}

schema subset_is_set_ae(cls x, cls y) {
	Ae1(set(y), subseteq(x, y))
	~ Ae2(set(y), subseteq(x, y))
	~ subset_is_set(x, y)
}

schema subset_is_set_ae_c(cls x, cls y) {
	cp[subset_is_set_ae(x, y)]
}

schema subset_is_set_ae_cvi(cls x) {
	Viu((cls y) => {
		I(A(set(y), subseteq(x, y)), set(x))
	})[(cls y) => { subset_is_set_ae_c(x, y) }]
}

"power class."
$<<\mathcal P>>(#1)$
cls power(cls x) {
	setbuilder((cls z) => {
		subseteq(z, x)
	})
}

schema IAEpAqrIAsrqIsEprmAi(st p, st q, st r, st s) {
	Ai(
		E(p, A(q, r)),
		I(A(s, r), q)
	) ~
	mpu[tt.IAEpAqrIAsrqIsEpr(p, q, r, s)]
}

schema power_def_1(cls x, cls y) {
	subset_is_set_ae_c(y, x)
	~ setbuilder_def_Ve((cls z) => {
		subseteq(z, x)
	}, y)
	~ IAEpAqrIAsrqIsEprmAi(
		in(y, power(x)),
		set(y),
		subseteq(y, x),
		set(x)
	)
}

"얘는 power_def보다 강력하다. 즉 power_def는 얘를
유도할 수 없다. 아마?"
schema power_def_Ve(cls x, cls y) {
	mpu[power_def_1(x, y)]
}

"생각해 보니 얘는 멱집합의 defining property라고 부를 만큼 강력하지 않다. 이름을 적당히 바꿔야 할지도 모른다."
schema power_def(cls x) {
	Vi_p(set(x)) ~
	mpu[Viu((cls y) => {
		I(set(x), E(in(y, power(x)), subseteq(y, x)))
	})[(cls y) => { power_def_1(x, y) }]
	~ VIm(
		(cls z) => { set(x) },
		(cls z) => {
			E(
				in(z, power(x)),
				subseteq(z, x)
			)
		}
	)]
}

"x가 집합일 때, x와 같은 것은 x의 power class에 속한다."
schema self_in_power(cls x, cls z) {
	eq_then_subseteq(z, x)
	~ power_def_Ve(x, z)
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

schema self_in_power_Vi_1(cls x, cls z) {
	cp[self_in_power(x, z)]
}

schema self_in_power_Vi(cls x) {
	Vi_p(set(x)) ~
	mpu[Viu((cls z) => {
		I(set(x), I(eq(z, x), in(z, power(x))))
	})[(cls z) => { self_in_power_Vi_1(x, z) }]
	~ VIm(
		(cls z) => {set(x)},
		(cls z) => {I(
			eq(z, x),
			in(z, power(x))
		)}
	)]
}

"singleton class."
$\{<<=>>#1\}$
cls singleton(cls x) {
	setbuilder((cls z) => {
		eq(z, x)
	})
}

schema singleton_subseteq_power_1(cls x, cls y) {
	setbuilder_def_Ve_Ee((cls z) => {eq(z, x)}, y) ~
	eq_then_subseteq(y, x) ~
	power_def_Ve(x, y)
	~ Ee2(
		in(y, power(x)),
		subseteq(y, x)
	)
	~ syll4(
		in(y, singleton(x)),
		eq(y, x),
		subseteq(y, x),
		in(y, power(x))
	)
}

schema singleton_subseteq_power_2(cls x, cls y) {
	cp[singleton_subseteq_power_1(x, y)]
}

schema singleton_subseteq_power(cls x) {
	Vi_p(set(x)) ~
	mpu[Viu((cls y) => {
		I(set(x), I(in(y, singleton(x)), in(y, power(x))))
	})[(cls y) => { singleton_subseteq_power_2(x, y) }]
	~ VIm(
		(cls y) => {set(x)},
		(cls y) => {
			I(
				in(y, singleton(x)),
				in(y, power(x))
			)
		}
	)]
	~ id(
		subseteq(singleton(x), power(x))
	)
}

"axiom of power set."
axiomatic schema ax_power() {
	(|- V((cls x) => {
		I(
			set(x),
			X((cls y) => {
				A(
					set(y),
					V((cls z) => {
						I(subseteq(z, x), in(z, y))
					})
				)
			})
		)
	}))
}

schema ax_power_vem(cls x) {
	mpu[Veu((cls x) => {
		I(set(x), X((cls y) => {
			A(set(y), V((cls z) => {
				I(subseteq(z, x), in(z, y))
			}))
		}))
	}, x)[ax_power()]]
}

schema power_is_set_1(cls x, cls y) {
	power_def(x)
	~ Ee1V(
		(cls z) => { in(z, power(x)) },
		(cls z) => { subseteq(z, x) }
	)
	~ syllV(
		(cls z) => { in(z, power(x)) },
		(cls z) => { subseteq(z, x) },
		(cls z) => { in(z, y) }
	)
	~ id(subseteq(power(x), y))
}

schema power_is_set_2(cls x, cls y) {
	cp[power_is_set_1(x, y)]
	~ mpu[tt.IIpqIArpArq(
		V((cls z) => {
			I(
				subseteq(z, x),
				in(z, y)
			)
		}),
		subseteq(power(x), y),
		set(y)
	)]
}

schema power_is_set_3(cls x, cls y) {
	cp[power_is_set_2(x, y)]
}

"멱집합은 집합이다."
schema power_is_set(cls x) {
	(ax_power_vem(x)
	~ Vi_p(set(x)) ~
	mpu[Viu((cls y) => {
		I(set(x), I(A(set(y), V((cls z) => {
			I(subseteq(z, x), in(z, y))
		})), A(set(y), subseteq(power(x), y))))
	})[(cls y) => { power_is_set_3(x, y) }]
	~ VIm(
		(cls y) => {set(x)},
		(cls y) => {
			I(
				A(
					set(y),
					V((cls z) => {
						I(
							subseteq(z, x),
							in(z, y)
						)
					})
				),
				A(
					set(y),
					subseteq(power(x), y)
				)
			)
		}
	)]
	~ Xinst1(
		(cls y) => {
			A(
				set(y),
				V((cls z) => {
					I(subseteq(z, x), in(z, y))
				})
			)
		},
		(cls y) => {
			A(set(y), subseteq(power(x), y))
		}
	))
	~ subset_is_set_ae_cvi(power(x))
	~ Xinst3(
		(cls y) => {
			A(set(y), subseteq(power(x), y))
		},
		set(power(x))
	)
}

"싱글턴은 집합이다."
schema singleton_is_set(cls x) {
	singleton_subseteq_power(x)
	~ power_is_set(x)
	~ subset_is_set(singleton(x), power(x))
}

"Axiom of infinity."
axiomatic schema infinity() {
	(|- X((cls x) => {
		A(
			set(x),
			A(
				in(emptyset(), x),
				V((cls z) => {
					I(
						in(z ,x),
						in(cup(z, singleton(z)), x)
					)
				})
			)
		)
	}))
}

############################
########## GRAPHS ##########
############################

"ordered pair."
$\left(#1<<,>>#2\right)$
cls v2(cls x, cls y);

axiomatic schema v2_eq_def(cls x, cls y, cls z, cls w) {
	(|- E(
		eq(v2(x, y), v2(z, w)),
		A(eq(x, z), eq(y, w))
	))
}

axiomatic schema v2_set_def(cls x, cls y) {
	(|- E(
		set(v2(x, y)),
		A(set(x), set(y))
	))
}

"어떤 class가 graph다.

[$G]가 그래프라 함은, [$z\in G]인 임의의 [$z]에 대하여, [$z = (a, b)]인 [$a, b]가 존재한다는 뜻이다.

graph 개념은 모 집합론 교재에 나오는 것인데 통용되는지는 모르겠다."
$\left(<<\mathop\mathrm{graph}>> #1\right)$
st graph(cls x) {
	Vin(x, (cls z) => {
		X2((cls a, cls b) => {
			eq(z, v2(a, b))
		})
	})
}

schema graph_forall_1_1(cls x, cls z, cls a, cls b) {
	eq_Ae2_Ve_Ee1_c_swap(z, v2(a, b), x)
}

"graph를 위한 forall.

[$G]가 그래프일 때, 임의의 [$(a, b)\in G]에 대해 [$f(a, b)]이면, 임의의 [$z\in G]에 대해 [$fz]이다."
schema graph_forall(pr f, cls x) {
	(graph(x) |- I(
		V2((cls a, cls b) => {
			I(
				in(v2(a, b), x),
				f(v2(a, b))
			)
		}),
		Vin(x, f)
	))
}

"graph의 역(inverse)."
$\left({#1}^{<<-1>>}\right)$
cls graph_inverse(cls x);

"graph_inverse의 defining property.

[$G]가 graph일 때, [$G^{-1} = \{(b, a): (a, b)\in G\}]라는 뜻인데 더 엄밀하게
[$$\{z: (\exists a)(\exists b)(z = (b, a) \land (a, b) \in G)\}]
라고 표현되었다."
axiomatic schema graph_inverse_def(cls x) {
	(graph(x) |- eq(
		graph_inverse(x),
		setbuilder((cls z) => {
			X2((cls a, cls b) => {
				A(
					eq(z, v2(b, a)),
					in(v2(a, b), x)
				)
			})
		})
	))
}

"graph의 합성(composition)."
$\left(#1 <<\circ>> #2\right)$
cls graph_composite(cls x, cls y);

"graph_composite의 defining property.

[$G], [$H]가 graph일 때,
[$$G\circ H = \{(a, c): (\exists b)((a, b)\in H \land (b, c)\in G)\}]
라는 뜻인데 더 엄밀하게
[$$\{z: (\exists a)(\exists c)(z=(a, c) \land (\exists b)((a, b)\in H \land (b, c)\in G))\}]
라고 표현되었다."
axiomatic schema graph_composite_def(cls x, cls y) {
	(graph(x), graph(y) |- eq(
		graph_composite(x, y),
		setbuilder((cls z) => {
			X2((cls a, cls c) => {
				A(
					eq(z, v2(a, c)),
					X((cls b) => {
						A(
							in(v2(a, b), y),
							in(v2(b, c), x)
						)
					})
				)
			})
		})
	))
}

schema graph_composite_associative(cls x, cls y, cls z) {
	(graph(x), graph(y), graph(z) |- eq(
		graph_composite(graph_composite(x, y), z),
		graph_composite(x, graph_composite(y, z))
	))
}

"graph의 정의역(domain)."
$\left(<<\operatorname{dom}>>#1\right)$
cls graph_dom(cls x);

"graph_dom의 defining property.

[$G]가 graph일 때, [$\{a: (\exists b)((a, b)\in G)\}]라는 뜻이다."
axiomatic schema graph_dom_def(cls x) {
	(graph(x) |- eq(
		graph_dom(x),
		setbuilder((cls a) => {
			X((cls b) => {
				in(v2(a, b), x)
			})
		})
	))
}

"graph의 치역(image)."
$\left(<<\operatorname{im}>>#1\right)$
cls graph_im(cls x);

"graph_im의 defining property.

[$G]가 graph일 때, [$\{b: (\exists a)((a, b)\in G)\}]라는 뜻이다."
axiomatic schema graph_im_def(cls x) {
	(graph(x) |- eq(
		graph_im(x),
		setbuilder((cls b) => {
			X((cls a) => {
				in(v2(a, b), x)
			})
		})
	))
}

"cartesian product."
$\left(#1<<\times>>#2\right)$
cls cartesian(cls x, cls y) {
	setbuilder((cls z) => {
		X2((cls a, cls b) => {
			A(
				eq(z, v2(a, b)),
				A(in(a, x), in(b, y))
			)
		})
	})
}

schema cartesian_def(cls x, cls y) {
	setbuilder_def((cls z) => {
		X2((cls a, cls b) => {
			A(
				eq(z, v2(a, b)),
				A(in(a, x), in(b, y))
			)
		})
	})
	~ id(V((cls z) => {
		E(
			in(z, cartesian(x, y)),
			A(
				set(z),
				X2((cls a, cls b) => {
					A(
						eq(z, v2(a, b)),
						A(in(a, x), in(b, y))
					)
				})
			)
		)
	}))
}

schema cartesian_is_graph(cls x, cls y) {
	(|- graph(cartesian(x, y)))
}

"어떤 [$\langle f, A, B\rangle]가 함수이다.

[$f\subseteq A\times B]이고 임의의 [$x\in A]에 대해 [$(x, y)\in f]를 만족하는 유일한 [$y]가 존재한다는 뜻이다."
$\left(<<\mathop\mathrm{function}>> #1: #2 \to #3\right)$
st function(cls f, cls a, cls b) {
	A(
		subseteq(f, cartesian(a, b)),
		Vin(a, (cls x) => {
			Q((cls y) => {
				in(v2(x, y), f)
			})
		})
	)
}

"함수 호출."
$\left({#1}<<(>>#2)\right)$
cls fcall(cls f, cls x);

"fcall의 defining property.

[$f(x)]는 [$\langle f, A, B\rangle]이 함수이고 [$x\in A]일 때만 정의되며, 이때 [$f(x) = y]는 [$(x, y)\in f]와 동치라는 뜻이다."
axiomatic schema fcall_def(cls f, cls a, cls b, cls x, cls y) {
	(function(f, a, b), in(x, a) |- E(
		eq(fcall(f, x), y),
		in(v2(x, y), f)
	))
}

`;