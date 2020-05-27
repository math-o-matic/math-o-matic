code = String.raw`
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

"문장 타입. 정의하지 않으면 에러가 난다."
typedef st;

"합리적인 것. 정말이지 맞는 것이다. 이걸 만들어 내도 계에는 별 일이 생기지 않는다."
$<<\top>>$
st T;

"모순. 정말이지 틀린 것이다. 이걸 만들어 낸다면 계를 파-괴할 수 있다."
$<<\bot>>$
st F;

"nand(FTTT). Sheffer의 1913년 논문에서 다른 모든 논리 기호를 유도할 수 있는 것이 증명된 것 같다. nor(FFFT) 역시 같은 성질을 갖고 있다(그러나 업계에서는 NAND 게이트를 NOR 게이트보다 선호하는 것 같다).

그러나 여기서는 다른 논리 기호를 유도하지 않고 모든 논리 기호를 primitive 하게 하였다. 이는 어차피 진리표를 가정하므로 별 필요 없기 때문이다. 또 실행 속도를 빠르게 하기 위함이다[&hellip]."
$\left(#1<<\barwedge>>#2\right)$
st NA(st p, st q);

"not(FT)."
$\left(<<\neg>>#1\right)$
st N(st p);

"and(TFFF)."
$\left(#1<<\land>>#2\right)$
st A(st p, st q);

"or(TTTF)."
$\left(#1<<\lor>>#2\right)$
st O(st p, st q);

"implies(TFTT)."
$\left(#1<<\to>>#2\right)$
st I(st p, st q);

"iff(TFFT)."
$\left(#1<<\leftrightarrow>>#2\right)$
st E(st p, st q);

"truth table의 tt. 진리표를 만들어 봤을 때 값이 항상 참인 명제 [$P] 중 필요할 만한 대부분의 것들에 대해 [$\vdash P]를 포함하고 있다. 물론 배열로서 일일이 나열해 놓은 것이 아니고 논리적으로 그렇다는 것이다.

Metamath처럼 Łukasiewicz의 공리계로 어떻게 해보려 했으나 예전부터 이 방식은 불필요하게 비효율적이라고 판단하였기에 손절하고 정규적인 추론 방식이 있는 진리표 기반으로 바꾼 것이다. 진리표가 Łukasiewicz의 공리를 전부 포함하고 있으므로 modus ponens와 같이 썼을 때 Łukasiewicz의 공리계보다 강력하거나 같다. 같다는 증명이 있는지는 모르겠음.

어떤 규칙에 접근하려면 Polish notation으로 된 이름을 만들어야 한다.

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

대소문자를 구분하고 괄호 따위는 쓰지 않으며 연산자를 맨 앞에 쓰고 인자를 이어 쓰면 된다.

[> 예를 들어 [$\vdash p \land q]는 Apq, [$\vdash \neg (p \land q) \leftrightarrow (\neg p \lor \neg q)]는 ENApqONpNq가 된다.]

tt에 포함되어 있는 규칙의 [$\vdash]의 좌변에는 아무 것도 없으므로, 뭔가를 좌변에 넣으려면 modus ponens를 적용해야 한다.

[~(href=./tt.html)인터랙티브 페이지]"
native ruleset tt;

"conditional proof. deduction theorem이라고도 한다. 어떤 규칙
[$$(\cdots): p, \cdots, r, q \vdash s]
를 주면 규칙
[$$(\cdots): p \cdots, r \vdash q \to s]
를 뱉는다. [$\vdash] 좌항 마지막에 있는 명제 하나를 우항으로 돌린다. mp와는 역연산 관계가 있다고 할 수 있다."
native link cp;

"modus ponens 추론 규칙. 추론 규칙은 이것만 있어도 적당히 되는 것 같다. cp와는 역연산 관계가 있다고 할 수 있다."
rule mp(st p, st q) {
	p, I(p, q) |- q
}

"conjunction introduction. [$ \vdash] 좌변의 [$p \land q]를 [$p, q]로 만들 수 있다.

mp에서 [$q] 자리에 [$p \land q]를 넣고 [$q \vdash p \to (p \land q)]임을 보인 것이다."
rule Ai(st p, st q) {
	tt.IqIpApq(p, q) ~ mp(
		q,
		I(p, A(p, q))
	) ~ mp(p, A(p, q))
}

"conjunction introduction 2번."
rule A3i(st p, st q, st r) {
	Ai(p, q) ~ Ai(A(p, q), r)
}

"conjunction elimination 1."
rule Ae1(st p, st q) {
	tt.IApqp(p, q) ~ mp(A(p, q), p)
}

"conjunction elimination 2."
rule Ae2(st p, st q) {
	tt.IApqq(p, q) ~ mp(A(p, q), q)
}

"disjunction introduction 1."
rule Oi1(st p, st q) {
	tt.IpOpq(p, q) ~ mp(p, O(p, q))
}

"disjunction introduction 2."
rule Oi2(st p, st q) {
	tt.IqOpq(p, q) ~ mp(q, O(p, q))
}

"disjunction elimination."
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

"negation introduction."
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

"negation elimination."
rule Ne(st p, st q) {
	tt.INpIpq(p, q) ~ mp(N(p), I(p, q))
}

"double negation elimination."
rule NNe(st p) {
	tt.INNpp(p)
	~ mp(N(N(p)), p)
}

"biconditional introduction."
rule Ei(st p, st q) {
	Ai(I(p, q), I(q, p))
	~ tt.IAIpqIqpEpq(p, q)
	~ mp(
		A(I(p, q), I(q, p)),
		E(p, q)
	)
}

"biconditional elimination 1."
rule Ee1(st p, st q) {
	tt.IEpqIpq(p, q)
	~ mp(E(p, q), I(p, q))
}

"biconditional elimination 2."
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

"E를 위한 mp."
rule mpE(st p, st q) {
	Ee1(p, q)
	~ mp(p, q)
}

"cp 형을 위한 삼단논법."
rule syll(st p, st q, st r) {
	Ai(I(p, q), I(q, r))
	~ tt.IAIpqIqrIpr(p, q, r)
	~ mp(A(I(p, q), I(q, r)), I(p, r))
}

rule syll4(st p, st q, st r, st s) {
	syll(p, q, r) ~ syll(p, r, s)
}

"E를 위한 syll."
rule syllE(st p, st q, st r) {
	Ai(E(p, q), E(q, r))
	~ tt.IAEpqEqrEpr(p, q, r)
	~ mp(A(E(p, q), E(q, r)), E(p, r))
}

rule syllE4(st p, st q, st r, st s) {
	syllE(p, q, r) ~ syllE(p, r, s)
}

"아무것도 하지 않는 무언가. 표현형식을 바꾸는 데 쓰이고 있다."
rule id(st p) {
	tt.Ipp(p) ~ mp(p, p)
}

"푹발률(ex falso quodlibet)."
rule explode(st p, st q) {
	Ne(p, q)
	~ mp(p, q)
}

"[$\bot]을 만들어 내는 방법. 계의 기본규칙으로부터 이걸 호출할 수 있다면 계를 파-괴할 수 있다. 계가 이것을 만들어내지 않음을 검증하는 것은 중요하다."
rule destroy(st p) {
	explode(p, F)
}

"귀류법(reductio ad absurdum)."
rule contradict(st p) {
	tt.IIpFNp(p)
	~ mp(I(p, F), N(p))
}

#################################
######## PREDICATE LOGIC ########
#################################

"클래스 타입. 술어 논리에서 쓰인다."
typedef cls;

"class 하나를 받는 술어 타입."
typedef [cls -> st] pr;

"class 두 개를 받는 술어 타입."
typedef [(cls, cls) -> st] pr2;

"class 세 개를 받는 술어 타입."
typedef [(cls, cls, cls) -> st] pr3;

"A의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\land>>#2\right)$
pr Af(pr f, pr g) {
	(cls z) => { A(f(z), g(z)) }
}

"O의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\lor>>#2\right)$
pr Of(pr f, pr g) {
	(cls z) => { O(f(z), g(z)) }
}

"I의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\to>>#2\right)$
pr If(pr f, pr g) {
	(cls z) => { I(f(z), g(z)) }
}

"E의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\leftrightarrow>>#2\right)$
pr Ef(pr f, pr g) {
	(cls z) => { E(f(z), g(z)) }
}

"N의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(<<\neg>>#1\right)$
pr Nf(pr f) {
	(cls z) => { N(f(z)) }
}

"보편 양화(universal quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받는다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\forall>>#1\right)$
st V(pr f);

"universal quantification introduction. 어떤 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 주면 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 뱉는다. 매개변수 맨 마지막에 있는 cls 하나를 [$\forall]로 돌리는 방식이다.

제약사항
[ul
	[*] 입력 규칙의 마지막 매개변수의 타입이 cls여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
native link Vi;

"universal quantification elimination. 어떤 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 주면 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 뱉는다. Vi의 역연산이라고 볼 수 있다. rule Vinst로부터 유도할 수 있을 것으로 추정된다.

제약사항
[ul
	[*] [$\vdash]의 우변이 V여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
native link Ve;

"입력항이 두 개인 함수를 위한 보편 양화. V에 의존한다."
$\left(<<\forall>>#1\right)$
st V2(pr2 f) {
	V((cls x) => {
		V((cls y) => {
			f(x, y)
		})
	})
}

"입력항이 세 개인 함수를 위한 보편 양화. V에 의존한다."
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

"존재 양화(existential quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받으며 V에 의존한다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\exists>>#1\right)$
st X(pr f) {
	N(V((cls x) => { N(f(x)) }))
}

"입력항이 두 개인 함수를 위한 존재 양화. V2에 의존한다."
$\left(<<\exists>>#1\right)$
st X2(pr2 f) {
	N(V2((cls x, cls y) => { N(f(x, y)) }))
}

"[$\forall]과 [$\land] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VI만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
rule VA(pr f, pr g) {
	|- E(
		V(Af(f, g)),
		A(V(f), V(g))
	)
}

"[$\forall]과 [$\to] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VA만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
rule VI(pr f, pr g) {
	|- I(
		V(If(f, g)),
		I(V(f), V(g))
	)
}

rule VO(pr f, pr g) {
	|- I(
		O(V(f), V(g)),
		V(Of(f, g))
	)
}

"[$\forall x\forall y]랑 [$\forall y\forall x]가 같다는 것. 특이하게도 Vi 및 Ve로부터 유도할 수 있는 것으로 보이나 아직 표현할 방식이 없다."
rule VV(pr2 f) {
	|- I(
		V2((cls x, cls y) => { f(x, y) }),
		V2((cls y, cls x) => { f(x, y) })
	)
}

"VA의 m1형."
rule VAm1(pr f, pr g) {
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

"VA의 m2형."
rule VAm2(pr f, pr g) {
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

"VI의 m형."
rule VIm(pr f, pr g) {
	VI(f, g)
	~ mp(
		V((cls x) => { I(f(x), g(x)) }),
		I(V(f), V(g))
	)
}

"VV의 m형."
rule VVm(pr2 f) {
	VV(f)
	~ mp(
		V2((cls x, cls y) => { f(x, y) }),
		V2((cls y, cls x) => { f(x, y) })
	)
}

rule ttf_IEpqEqp(pr f, pr g, cls x) {
	tt.IEpqEqp(f(x), g(x))
}

"IEpqEqpm의 V형."
rule IVEpqVEqpfm(pr f, pr g) {
	id(V(Ef(f, g))) ~
	Vi[ttf_IEpqEqp](f, g)
	~ VIm(
		(cls x) => { E(f(x), g(x)) },
		(cls x) => { E(g(x), f(x)) }
	) ~ mp(
		V((cls x) => { E(f(x), g(x)) }),
		V((cls x) => { E(g(x), f(x)) })
	)
}

rule ttf_IEpqIpq(pr f, pr g, cls x) {
	tt.IEpqIpq(f(x), g(x))
}

"Ee1의 V형."
rule Ee1V(pr f, pr g) {
	id(V(Ef(f, g))) ~
	Vi[ttf_IEpqIpq](f, g)
	~ VIm(
		(cls z) => { E(f(z), g(z)) },
		(cls z) => { I(f(z), g(z)) }
	) ~ mp(
		V((cls z) => { E(f(z), g(z)) }),
		V((cls z) => { I(f(z), g(z)) })
	)
}

"Ee2의 V형."
rule Ee2V(pr f, pr g) {
	IVEpqVEqpfm(f, g)
	~ Ee1V(g, f)
}

rule VEm(pr f, pr g) {
	Ee1V(f, g)
	~ VIm(f, g)
	~ Ee2V(f, g)
	~ VIm(g, f)
	~ Ei(V(f), V(g))
}

rule VE(pr f, pr g) {
	cp[VEm](f, g)
}

rule ttf_IAIpqIqrIpr(pr f, pr g, pr h, cls x) {
	tt.IAIpqIqrIpr(f(x), g(x), h(x))
}

rule syllV(pr f, pr g, pr h) {
	Ai(
		V(If(f, g)),
		V(If(g, h))
	)
	~ VAm2(
		(cls x) => { I(f(x), g(x)) },
		(cls x) => { I(g(x), h(x)) }
	)
	~ Vi[ttf_IAIpqIqrIpr](f, g, h)
	~ VIm(
		(cls x) => { A(I(f(x), g(x)), I(g(x), h(x))) },
		(cls x) => { I(f(x), h(x)) }
	)
	~ mp(
		V((cls x) => { A(I(f(x), g(x)), I(g(x), h(x))) }),
		V(If(f, h))
	)
}

rule ttf_IAEpqEqrEpr(pr f, pr g, pr h, cls x) {
	tt.IAEpqEqrEpr(f(x), g(x), h(x))
}

rule syllVE(pr f, pr g, pr h) {
	Ai(
		V((cls x) => { E(f(x), g(x)) }),
		V((cls x) => { E(g(x), h(x)) })
	)
	~ VAm2(
		(cls x) => { E(f(x), g(x)) },
		(cls x) => { E(g(x), h(x)) }
	)
	~ Vi[ttf_IAEpqEqrEpr](f, g, h)
	~ VIm(
		(cls x) => { A(E(f(x), g(x)), E(g(x), h(x))) },
		(cls x) => { E(f(x), h(x)) }
	)
	~ mp(
		V((cls x) => { A(E(f(x), g(x)), E(g(x), h(x))) }),
		V((cls x) => { E(f(x), h(x)) })
	)
}

rule ttf_ENOpqANpNq(pr f, pr g, cls x) {
	tt.ENOpqANpNq(f(x), g(x))
}

"[$\exists]과 [$\lor] 간의 분배법칙 같은 것. VA로부터 증명할 수 있다."
rule XO(pr f, pr g) {
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
		(cls x) => { N(O(f(x), g(x))) },
		(cls x) => { A(N(f(x)), N(g(x))) }
	)
	~ tt.IEpqENpNq(
		V((cls x) => { N(O(f(x), g(x))) }),
		V((cls x) => { A(N(f(x)), N(g(x))) })
	)
	~ mp(
		E(
			V((cls x) => { N(O(f(x), g(x))) }),
			V((cls x) => { A(N(f(x)), N(g(x))) })
		),
		E(
			N(V((cls x) => { N(O(f(x), g(x))) })),
			N(V((cls x) => { A(N(f(x)), N(g(x))) }))
		)
	)
	~ syllE(
		X(Of(f, g)),
		N(V(Af(Nf(f), Nf(g)))),
		O(X(f), X(g))
	)
}

rule XI_(pr f, pr g) {
	XO(Nf(f), g)
}

"[$\exists]과 [$\to] 간의 분배법칙 같은 것. 직관적으로 이해가 안 되지만 XO로부터 간단히 증명할 수 있는데 XI_로부터 증명하려고 하니 막막한 이유는 무엇인가..."
rule XI(pr f, pr g) {
	|- E(
		X(If(f, g)),
		I(
			V(f),
			X(g)
		)
	)
}

rule XA(pr f, pr g) {
	|- I(
		X(Af(f, g)),
		A(X(f), X(g))
	)
}

rule AeX1(pr f, pr g) {
	tt.IApqp(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(f)
	)
}

rule AeX2(pr f, pr g) {
	tt.IApqq(X(f), X(g))
	~ XA(f, g)
	~ syll(
		X(Af(f, g)),
		A(X(f), X(g)),
		X(g)
	)
}

rule mpV(pr f, pr g) {
	VIm(f, g)
	~ mp(V(f), V(g))
}

rule mpVE(pr f, pr g) {
	Ee1V(f, g) ~ mpV(f, g)
}

"universal generalization."
rule Vgen(st p) {
	p |- V((cls x) => { p })
}

"existential generalization. Vinst와 합치면 [$\forall f \vdash \exists f]가 될 것도 같으나 어떤 class x가 있어야 한다."
rule Xgen(pr f, cls x) {
	f(x) |- X(f)
}

"universal instantiation."
rule Vinst(pr f, cls x) {
	V(f) |- f(x)
}

"existential instantiation 같은 것 1. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정."
rule Xinst1(pr f, pr g) {
	X(f), V(If(f, g)) |- X(g)
}

rule Xinst1E(pr f, pr g) {
	Ee1V(f, g) ~ Xinst1(f, g)
}

"existential instantiation 같은 것 2. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정. Vgen으로부터 증명할 수 있다."
rule Xinst2(st p) {
	cp[Vgen](N(p))
	~ tt.IINpqINqp(p, V((cls x) => { N(p) }))
	~ mp(I(N(p), V((cls x) => { N(p) })), I(N(V((cls x) => { N(p) })), p))
	~ id(I(X((cls x) => { p }), p))
	~ mp(X((cls x) => { p }), p)
}

rule Xinst3(pr f, st p) {
	Xinst1(f, (cls x) => { p })
	~ Xinst2(p)
}

"binary relation의 reflexivity."
$\left(#1\ <<\text{is reflexive}>>\right)$
st reflexive(pr2 f) {
	V((cls x) => {
		f(x, x)
	})
}

"binary relation의 symmetry."
$\left(#1\ <<\text{is symmetric}>>\right)$
st symmetric(pr2 f) {
	V2((cls x, cls y) => {
		I(f(x, y), f(y, x))
	})
}

"binary relation의 transitivity."
$\left(#1\ <<\text{is transitive}>>\right)$
st transitive(pr2 f) {
	V3((cls x, cls y, cls z) => {
		I(
			A(f(x, y), f(y, z)),
			f(x, z)
		)
	})
}

############################
######## SET THEORY ########
############################

"집합론에서 정의하는 in 연산자."
$\left(#1<<\in>>#2\right)$
st in(cls x, cls y);

"간단한 notin 함수."
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

rule set_Xgen(cls x, cls y) {
	Xgen((cls y) => { in(x, y) }, y)
	~ id(set(x))
}

rule set_Xgen_A(cls x, cls y, cls z) {
	Ae1(in(z, x), in(z, y)) ~
	set_Xgen(z, x)
}

rule set_Xgen_O(cls x, cls y, cls z) {
	cp[set_Xgen](z, x)
	~ cp[set_Xgen](z, y)
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

rule eq_Ae1(cls x, cls y) {
	id(eq(x, y))
	~ Ae1(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	)
}

rule eq_Ae2(cls x, cls y) {
	id(eq(x, y)) ~
	Ae2(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	)
}

rule eq_reflexive_tmp1(cls x, cls z) {
	tt.Epp(in(z, x))
}

rule eq_reflexive_tmp2(cls x, cls w) {
	tt.Epp(in(x, w))
}

rule eq_reflexive_tmp3(cls x) {
	Vi[eq_reflexive_tmp1](x)
	~ Vi[eq_reflexive_tmp2](x)
	~ Ai(
		V((cls z) => { E(in(z, x), in(z, x)) }),
		V((cls w) => { E(in(x, w), in(x, w)) })
	)
}

"[$=]는 반사적(reflexive)이다."
rule eq_reflexive() {
	Vi[eq_reflexive_tmp3]()
	~ id(reflexive(eq))
}

rule eq_symmetric_tmp(cls x, cls y) {
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

"[$=]는 대칭적(symmetric)이다."
rule eq_symmetric() {
	Vi[Vi[cp[eq_symmetric_tmp]]]()
	~ id(symmetric(eq))
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

"binary operation의 associativity."
$\left(#1\ <<\text{is associative}>>\right)$
st associative([(cls, cls) -> cls] f) {
	V3((cls x, cls y, cls z) => {
		eq(
			f(f(x, y), z),
			f(x, f(y, z))
		)
	})
}

"binary operation의 commutativity."
$\left(#1\ <<\text{is commutative}>>\right)$
st commutative([(cls, cls) -> cls] f) {
	V2((cls x, cls y) => {
		eq(
			f(x, y),
			f(y, x)
		)
	})
}

rule set_is_set_1(cls x, cls y) {
	id(set(x)) ~
	eq_Ae2(x, y)
	~ Xinst1E(
		(cls w) => { in(x, w) },
		(cls w) => { in(y, w) }
	)
	~ id(set(y))
}

rule set_is_set_2(cls x, cls y) {
	eq_symmetric_tmp(y, x) ~
	set_is_set_1(x, y)
}

rule subseteq_subseteq(cls x, cls y, cls z) {
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
rule extensional(cls x, cls y) {
	|- I(
		V((cls z) => {
			E(
				in(z, x),
				in(z, y)
			)
		}),
		eq(x, y)
	)
}

rule extensional_m(cls x, cls y) {
	extensional(x, y)
	~ mp(
		V((cls z) => {
			E(
				in(z, x),
				in(z, y)
			)
		}),
		eq(x, y)
	)
}

rule eq_simple(cls x, cls y) {
	cp[eq_Ae1](x, y)
	~ extensional(x, y)
	~ Ei(
		eq(x, y),
		V((cls z) => { E(in(z, x), in(z, y)) })
	)
}

rule eq_then_subseteq_m(cls x, cls y) {
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

rule eq_then_subseteq(cls x, cls y) {
	cp[eq_then_subseteq_m](x, y)
}

rule eq_subseteq(cls x, cls y, cls z) {
	eq_then_subseteq_m(x, y)
	~ subseteq_subseteq(x, y, z)
}

rule subseteq_eq(cls x, cls y, cls z) {
	eq_then_subseteq_m(y, z)
	~ subseteq_subseteq(x, y, z)
}

"술어를 만족하는 set들의 class를 만든다. 일반적으로는 [$\{z: f(z)\}]라고 쓰는 것."
$\left\{<<:>>#1\right\}$
cls setbuilder(pr f);

"setbuilder의 defining property. f를 만족하는 임의의 [**집합]의 class를 만들게 해 준다."
rule setbuilder_def(pr f) {
	|- V((cls z) => {
		E(
			in(z, setbuilder(f)),
			A(set(z), f(z))
		)
	})
}

rule setbuilder_def_Ve(pr f, cls z) {
	Ve[setbuilder_def](f, z)
}

rule setbuilder_def_Ve_Ee(pr f, cls z) {
	setbuilder_def_Ve(f, z)
	~ tt.IEpAqrIpr(
		in(z, setbuilder(f)),
		set(z),
		f(z)
	)
	~ mp(
		E(
			in(z, setbuilder(f)),
			A(
				set(z),
				f(z)
			)
		),
		I(
			in(z, setbuilder(f)),
			f(z)
		)
	)
}

rule ttf_IAEpAqrIrqEpr(pr f, pr g, pr h, cls x) {
	tt.IAEpAqrIrqEpr(f(x), g(x), h(x))
}

rule setbuilder_def_set_1(pr f, pr g, pr h) {
	Ai(
		V((cls x) => { E(f(x), A(g(x), h(x))) }),
		V((cls x) => { I(h(x), g(x)) })
	) ~
	VAm2(
		(cls x) => { E(f(x), A(g(x), h(x))) },
		(cls x) => { I(h(x), g(x)) }
	) ~
	Vi[ttf_IAEpAqrIrqEpr](f, g, h)
	~ VIm(
		(cls x) => { A(E(f(x), A(g(x), h(x))), I(h(x), g(x))) },
		(cls x) => { E(f(x), h(x)) }
	)
	~ mp(
		V((cls x) => { A(E(f(x), A(g(x), h(x))), I(h(x), g(x))) }),
		V((cls x) => { E(f(x), h(x)) })
	)
}

rule setbuilder_def_set(pr f) {
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

rule cap_vi(cls x, cls y) {
	Vi[cp[set_Xgen_A]](x, y) ~
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

rule cap(cls x, cls y, cls z) {
	Ve[cap_vi](x, y, z)
}

rule cap_commutative_1(cls x, cls y, cls z) {
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

rule cap_commutative_2(cls x, cls y) {
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

"[$\cup]."
$\left(#1<<\cup>>#2\right)$
cls cup(cls x, cls y) {
	setbuilder((cls z) => {
		O(in(z, x), in(z, y))
	})
}

rule cup_vi(cls x, cls y) {
	Vi[cp[set_Xgen_O]](x, y) ~
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

rule cup(cls x, cls y, cls z) {
	Ve[cup_vi](x, y, z)
}

"empty class."
$<<\varnothing>>$
cls emptyset() {
	setbuilder((cls z) => { F })
}

rule emptyset_1(cls z) {
	cp[contradict](in(z, emptyset()))
}

rule emptyset_2() {
	Vi[emptyset_1]()
}

rule emptyset_3(cls x) {
	tt.IApFF(set(x))
}

rule emptyset_vi() {
	setbuilder_def((cls z) => { F })
	~ Ee1V(
		(cls z) => { in(z, emptyset()) },
		(cls z) => { A(set(z), F) }
	)
	~ Vi[emptyset_3]()
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
rule emptyset_def(cls z) {
	Ve[emptyset_vi](z)
}

"universal class."
$<<V>>$
cls universe() {
	setbuilder((cls z) => { T })
}

rule setbuilder_is_setbuilder(pr f, cls x) {
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
rule specify(pr f) {
	|-
	V((cls x) => {
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	})
}

rule specify_vem(pr f, cls x) {
	Ve[specify](f, x)
	~ mp(set(x), set(subsetbuilder(x, f)))
}

rule cap_is_set_1(cls x, cls y) {
	specify_vem((cls z) => { in(z, y) }, x)
	~ id(set(cap(x, y)))
}

rule cap_is_set_2(cls x, cls y) {
	specify_vem((cls z) => { in(z, x) }, y)
	~ cap_commutative_2(y, x)
	~ set_is_set_1(cap(y, x), cap(x, y))
}

rule subset_cap_is_subset_1(cls x, cls y, cls z) {
	tt.IIpqEpApq(in(z, x), in(z, y))
}

rule subset_cap_is_subset(cls x, cls y) {
	id(subseteq(x, y)) ~
	Vi[subset_cap_is_subset_1](x, y)
	~VIm(
		(cls z) => { I(in(z, x), in(z, y)) },
		(cls z) => {
			E(
				in(z, x),
				A(in(z, x), in(z, y))
			)
		}
	)
	~ mp(
		V((cls z) => { I(in(z, x), in(z, y)) }),
		V((cls z) => {
			E(
				in(z, x),
				A(in(z, x), in(z, y))
			)
		})
	) ~
	cap_vi(x, y) ~ IVEpqVEqpfm(
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

rule subset_is_set(cls x, cls y) {
	subset_cap_is_subset(x, y)
	~ cap_is_set_2(x, y)
	~ set_is_set_2(cap(x, y), x)
}

rule subset_is_set_ae(cls x, cls y) {
	Ae1(set(y), subseteq(x, y))
	~ Ae2(set(y), subseteq(x, y))
	~ subset_is_set(x, y)
}

rule subset_is_set_ae_c(cls x, cls y) {
	cp[subset_is_set_ae](x, y)
}

rule subset_is_set_ae_cvi(cls x) {
	Vi[subset_is_set_ae_c](x)
}

"power class."
$<<\mathcal P>>(#1)$
cls power(cls x) {
	setbuilder((cls z) => {
		subseteq(z, x)
	})
}

rule IAEpAqrIAsrqIsEprmAi(st p, st q, st r, st s) {
	Ai(
		E(p, A(q, r)),
		I(A(s, r), q)
	) ~
	tt.IAEpAqrIAsrqIsEpr(p, q, r, s)
	~ mp(
		A(E(p, A(q, r)), I(A(s, r), q)),
		I(s, E(p, r))
	)
}

rule power_def_1(cls x, cls y) {
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
rule power_def_Ve(cls x, cls y) {
	power_def_1(x, y)
	~ mp(
		set(x),
		E(
			in(y, power(x)),
			subseteq(y, x)
		)
	)
}

"생각해 보니 얘는 멱집합의 defining property라고 부를 만큼 강력하지 않다. 이름을 적당히 바꿔야 할지도 모른다."
rule power_def(cls x) {
	Vgen(set(x)) ~
	Vi[power_def_1](x)
	~ VIm(
		(cls z) => { set(x) },
		(cls z) => {
			E(
				in(z, power(x)),
				subseteq(z, x)
			)
		}
	)
	~ mp(
		V((cls z) => { set(x) }),
		V((cls z) => {
			E(
				in(z, power(x)),
				subseteq(z, x)
			)
		})
	)
}

"x가 집합일 때, x와 같은 것은 x의 power class에 속한다."
rule self_in_power(cls x, cls z) {
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

rule self_in_power_Vi_1(cls x, cls z) {
	cp[self_in_power](x, z)
}

rule self_in_power_Vi(cls x) {
	Vgen(set(x)) ~
	Vi[self_in_power_Vi_1](x)
	~ VIm(
		(cls z) => {set(x)},
		(cls z) => {I(
			eq(z, x),
			in(z, power(x))
		)}
	) ~ mp(
		V((cls z) => {set(x)}),
		V((cls z) => {I(
			eq(z, x),
			in(z, power(x))
		)})
	)
}

"singleton class."
$\{<<=>>#1\}$
cls singleton(cls x) {
	setbuilder((cls z) => {
		eq(z, x)
	})
}

rule singleton_subseteq_power_1(cls x, cls y) {
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

rule singleton_subseteq_power_2(cls x, cls y) {
	cp[singleton_subseteq_power_1](x, y)
}

rule singleton_subseteq_power(cls x) {
	Vgen(set(x)) ~
	Vi[singleton_subseteq_power_2](x)
	~ VIm(
		(cls y) => {set(x)},
		(cls y) => {
			I(
				in(y, singleton(x)),
				in(y, power(x))
			)
		}
	)
	~ mp(
		V((cls y) => {set(x)}),
		V((cls y) => {
			I(
				in(y, singleton(x)),
				in(y, power(x))
			)
		})
	)
	~ id(
		subseteq(singleton(x), power(x))
	)
}

"axiom of power set."
rule ax_power() {
	|- V((cls x) => {
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
	})
}

rule ax_power_vem(cls x) {
	Ve[ax_power](x)
	~ mp(
		set(x),
		X((cls y) => {
			A(
				set(y),
				V((cls z) => {
					I(
						subseteq(z, x),
						in(z, y)
					)
				})
			)
		})
	)
}

rule power_is_set_1(cls x, cls y) {
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

rule power_is_set_2(cls x, cls y) {
	cp[power_is_set_1](x, y)
	~ tt.IIpqIArpArq(
		V((cls z) => {
			I(
				subseteq(z, x),
				in(z, y)
			)
		}),
		subseteq(power(x), y),
		set(y)
	)
	~ mp(
		I(
			V((cls z) => {
				I(
					subseteq(z, x),
					in(z, y)
				)
			}),
			subseteq(power(x), y)
		),
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
	)
}

rule power_is_set_3(cls x, cls y) {
	cp[power_is_set_2](x, y)
}

"멱집합은 집합이다."
rule power_is_set(cls x) {
	ax_power_vem(x)
	~ Vgen(set(x)) ~
	Vi[power_is_set_3](x)
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
	)
	~ mp(
		V((cls y) => {set(x)}),
		V((cls y) => {
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
		})
	)
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
	)
	~ subset_is_set_ae_cvi(power(x))
	~ Xinst3(
		(cls y) => {
			A(set(y), subseteq(power(x), y))
		},
		set(power(x))
	)
}

"싱글턴은 집합이다."
rule singleton_is_set(cls x) {
	singleton_subseteq_power(x)
	~ power_is_set(x)
	~ subset_is_set(singleton(x), power(x))
}

rule infinity() {
	|- X((cls x) => {
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
	})
}

############################
########## GRAPHS ##########
############################

"ordered pair."
$\left(#1<<,>>#2\right)$
cls v2(cls x, cls y);

rule v2_eq_def(cls x, cls y, cls z, cls w) {
	|- E(
		eq(v2(x, y), v2(z, w)),
		A(eq(x, z), eq(y, w))
	)
}

rule v2_set_def(cls x, cls y) {
	|- E(
		set(v2(x, y)),
		A(set(x), set(y))
	)
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

rule cartesian_def(cls x, cls y) {
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

"어떤 class가 graph다.

[$z\in x]인 임의의 [$z]에 대하여, [$z = (a, b)]인 [$a, b]가 존재한다는 뜻이다."
$\left(<<\mathop\mathrm{graph}>> #1\right)$
st graph(cls x) {
	Vin(x, (cls z) => {
		X2((cls a, cls b) => {
			eq(z, v2(a, b))
		})
	})
}

rule cartesian_is_graph(cls x, cls y) {
	|- graph(cartesian(x, y))
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
rule fcall_def(cls f, cls a, cls b, cls x, cls y) {
	function(f, a, b), in(x, a) |- E(
		eq(fcall(f, x), y),
		in(v2(x, y), f)
	)
}

`;