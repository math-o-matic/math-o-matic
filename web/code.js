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

틀린 식은 없다고 나오므로 주의하기 바란다.

tt에 포함되어 있는 규칙의 [$\vdash]의 좌변에는 아무 것도 없으므로, 뭔가를 좌변에 넣으려면 modus ponens를 적용해야 한다."
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

"[$\bot]을 만들어 내는 방법. 계의 기본규칙으로부터 이걸 호출할 수 있다면 계를 파-괴할 수 있다.

비슷한 방법으로 [$p, \neg p \vdash q]를 유도할 수 있다. 이는 [$p \vdash \top] 또는 [$\vdash p \to \top]이라고 [$\vdash p]가 아님을 시사한다."
rule destroy(st p) {
	Ne(p, F)
	~ mp(p, F)
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
typedef class;

"A의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\land>>#2\right)$
[class -> st] Af([class -> st] f, [class -> st] g) {
	(class z) => A(f(z), g(z))
}

"O의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\lor>>#2\right)$
[class -> st] Of([class -> st] f, [class -> st] g) {
	(class z) => O(f(z), g(z))
}

"I의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\to>>#2\right)$
[class -> st] If([class -> st] f, [class -> st] g) {
	(class z) => I(f(z), g(z))
}

"E의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(#1<<\leftrightarrow>>#2\right)$
[class -> st] Ef([class -> st] f, [class -> st] g) {
	(class z) => E(f(z), g(z))
}

"N의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다."
$\left(<<\neg>>#1\right)$
[class -> st] Nf([class -> st] f) {
	(class z) => N(f(z))
}

"보편 양화(universal quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받는다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\forall>>#1\right)$
st V([class -> st] f);

"universal quantification introduction. 어떤 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 주면 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 뱉는다. 매개변수 맨 마지막에 있는 class 하나를 [$\forall]로 돌리는 방식이다.

제약사항
[ul
	[*] 입력 규칙의 마지막 매개변수의 타입이 Class여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
native link Vi;

"universal quantification elimination. 어떤 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 주면 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 뱉는다. Vi의 역연산이라고 볼 수 있다.

제약사항
[ul
	[*] [$\vdash]의 우변이 V여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
native link Ve;

"입력항이 두 개인 함수를 위한 보편 양화. V에 의존한다."
$\left(<<\forall>>#1\right)$
st V2([(class, class) -> st] f) {
	V((class x) =>
		V((class y) =>
			f(x, y)
		)
	)
}

"입력항이 세 개인 함수를 위한 보편 양화. V에 의존한다."
$\left(<<\forall>>#1\right)$
st V3([(class, class, class) -> st] f) {
	V((class x) =>
		V((class y) =>
			V((class z) =>
				f(x, y, z)
			)
		)
	)
}

"존재 양화(existential quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받으며 V에 의존한다. 또한 [*domain of discourse는 공집합일 수도 있다]."
$\left(<<\exists>>#1\right)$
st X([class -> st] f) {
	N(V((class x) => N(f(x))))
}

"입력항이 두 개인 함수를 위한 존재 양화. V2에 의존한다."
$\left(<<\exists>>#1\right)$
st X2([(class, class) -> st] f) {
	N(V2((class x, class y) => N(f(x, y))))
}

"[$\forall]과 [$\land] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VI만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
rule VA([class -> st] f, [class -> st] g) {
	|- E(
		V(Af(f, g)),
		A(V(f), V(g))
	)
}

"[$\forall]과 [$\to] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VA만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
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

"[$\forall x\forall y]랑 [$\forall y\forall x]가 같다는 것. 특이하게도 Vi 및 Ve로부터 유도할 수 있는 것으로 보이나 아직 표현할 방식이 없다."
rule VV([(class, class) -> st] f) {
	|- I(
		V2((class x, class y) => f(x, y)),
		V2((class y, class x) => f(x, y))
	)
}

"VA의 m1형."
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

"VA의 m2형."
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

"VI의 m형."
rule VIm([class -> st] f, [class -> st] g) {
	VI(f, g)
	~ mp(
		V((class x) => I(f(x), g(x))),
		I(V(f), V(g))
	)
}

"VV의 m형."
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

"IEpqEqpm의 V형."
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

"Ee1의 V형."
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

"Ee2의 V형."
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

"[$\exists]과 [$\lor] 간의 분배법칙 같은 것. VA로부터 증명할 수 있다."
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

"[$\exists]과 [$\to] 간의 분배법칙 같은 것. 직관적으로 이해가 안 되지만 XO로부터 간단히 증명할 수 있는데 XI_로부터 증명하려고 하니 막막한 이유는 무엇인가..."
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

"universal generalization."
rule Vgen(st p) {
	p |- V((class x) => p)
}

"existential generalization. Vinst와 합치면 [$\forall f \vdash \exists f]가 될 것도 같으나 어떤 class x가 있어야 한다."
rule Xgen([class -> st] f, class x) {
	f(x) |- X(f)
}

"universal instantiation."
rule Vinst([class -> st] f, class x) {
	V(f) |- f(x)
}

"existential instantiation 같은 것 1. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정."
rule Xinst1([class -> st] f, [class -> st] g) {
	X(f), V(If(f, g)) |- X(g)
}

rule Xinst1E([class -> st] f, [class -> st] g) {
	Ee1V(f, g) ~ Xinst1(f, g)
}

"existential instantiation 같은 것 2. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정. Vgen으로부터 증명할 수 있다."
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

"binary relation의 reflexivity."
$\left(#1\ <<\text{is reflexive}>>\right)$
st reflexive([(class, class) -> st] f) {
	V((class x) =>
		f(x, x)
	)
}

"binary relation의 symmetry."
$\left(#1\ <<\text{is symmetric}>>\right)$
st symmetric([(class, class) -> st] f) {
	V2((class x, class y) =>
		I(f(x, y), f(y, x))
	)
}

"binary relation의 transitivity."
$\left(#1\ <<\text{is transitive}>>\right)$
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

"집합론에서 정의하는 in 연산자."
$\left(#1<<\in>>#2\right)$
st in(class x, class y);

"간단한 notin 함수."
$\left(#1<<\notin>>#2\right)$
st Nin(class x, class y) {
	N(in(x, y))
}

"어떤 class가 집합이라는 것. 어떤 class의 원소면 된다."
$\left(<<\mathop\mathrm{set}>> #1\right)$
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

"[$\subseteq]."
$\left(#1<<\subseteq>>#2\right)$
st subseteq(class x, class y) {
	V((class z) => (
		I(
			in(z, x),
			in(z, y)
		)
	))
}

"[$=] 연산자. [$\in]에 의존한다."
$\left(#1<<=>>#2\right)$
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

"[$=]는 반사적(reflexive)이다."
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

"[$=]는 대칭적(symmetric)이다."
rule eq_symmetric() {
	Vi[Vi[cp[eq_symmetric_tmp]]]()
	~ id(symmetric(eq))
}

"uniqueness quantification."
$\left(<<\exists!>>#1\right)$
st Q([class -> st] f) {
	X((class x) => V((class y) => (
		E(f(y), eq(y, x))
	)))
}

"binary operation의 associativity."
$\left(#1\ <<\text{is associative}>>\right)$
st associative([(class, class) -> class] f) {
	V3((class x, class y, class z) =>
		eq(
			f(f(x, y), z),
			f(x, f(y, z))
		)
	)
}

"binary operation의 commutativity."
$\left(#1\ <<\text{is commutative}>>\right)$
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

"axiom of extensionality."
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

"술어를 만족하는 class를 만든다. 일반적으로는 [$\{z: f(z)\}]라고 쓰는 것."
$\left\{<<:>>#1\right\}$
class setbuilder([class -> st] f);

"setbuilder의 definition rule.

Deprecated: 이 정의는 {:T}가 스스로를 포함할 수 있게 하는데 이는 axiom of foundation에 모순된다. 그러므로 setbuilder_def__로 옮기셈."
rule setbuilder_def([class -> st] f) {
	|- V((class z) =>
		E(
			in(z, setbuilder(f)),
			f(z)
		)
	)
}

"setbuilder의 새로운 definition rule. 근데 이걸로 singleton을 만들 경우 proper class의 singleton이 empty set이 되는 불상사가 발생하는데 어떻게 해야 할지 모르겠음."
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

"[$\cap]."
$\left(#1<<\cap>>#2\right)$
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

"[$\cup]."
$\left(#1<<\cup>>#2\right)$
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

"empty class."
$<<\varnothing>>$
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

"emptyset의 definition rule."
rule emptyset_def(class z) {
	Ve[emptyset_vi](z)
}

"universal class."
$<<V>>$
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

"술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.
일반적으로는 [$\{z \in x: f(z)\}]라고 쓰는 것인데 더미 변수를 없애버렸다."
$\left\{#1<<:>>#2\right\}$
class subsetbuilder(class x, [class -> st] f) {
	setbuilder((class y) => (
		A(
			in(y, x),
			f(y)
		)
	))
}

"power class."
$<<\mathcal P>>(#1)$
class power(class x) {
	setbuilder((class z) => (
		subseteq(z, x)
	))
}

rule power_def__(class x) {
	set(x) |- V((class z) => E(
		in(z, power(x)),
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

"singleton class."
$<<\{>>#1\}$
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

"axiom schema of specification. 어떤 집합에서 임의 술어를 만족시키는 것의 class를 만들었을 때 이 class가 집합이라는 뜻이다."
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

"axiom of power set."
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

"멱집합은 집합이다."
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

"싱글턴은 집합이다."
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

############################
########## GRAPHS ##########
############################

"ordered pair."
$\left(#1<<,>>#2\right)$
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

"cartesian product."
$\left(#1<<\times>>#2\right)$
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

"어떤 class가 graph다."
$\left(<<\mathop\mathrm{graph}>> #1\right)$
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

"어떤 class가 function이다."
$\left(<<\mathop\mathrm{function}>> #1\right)$
st function(class f, class a, class b) {
	A(
		subseteq(f, cartesian(a, b)),
		V((class x) => Q((class y) => in(v2(x, y), f)))
	)
}

"y = f(x)의 관계.

[**주의]: 이 def는 f가 function임을 확인하지 않음. function에 대해서만 사용하세요."
$\left(#1(#2)<<=>>#3\right)$
st fcalleq(class f, class x, class y) {
	in(v2(x, y), f)
}

rule fcalleqQ(class f, class a, class b) {
	function(f, a, b) |- V((class x) => (
		I(in(x, a), Q((class y) => fcalleq(f, x, y)))
	))
}

`;