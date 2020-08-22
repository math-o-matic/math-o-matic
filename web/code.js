code = String.raw`
#####################################
######## PROPOSITIONAL LOGIC ########
#####################################

"문장 타입."
base type st;

"참. 이걸 만들어 내도 계에는 별 일이 생기지 않는다."
$<<\top>>$
st T;

"거짓. 이걸 만들어 낸다면 계를 말짱 도루묵으로 만들 수 있다."
$<<\bot>>$
st F;

"nand(FTTT). Sheffer가 1913년 논문에서 다른 모든 논리 기호를 유도할 수 있음을 증명한 것 같다. nor(FFFT) 역시 같은 성질을 갖고 있다."
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
axiomatic native ruleset tt;

"sequent calculus의 cut 규칙. 즉
[$$\frac{\Delta\vdash p\quad \Sigma_1,p,\Sigma_2\vdash q}{\Sigma_1,\Delta,\Sigma_2\vdash q}]
이다. 단 [$p]의 첫 번째 일치가 [$\Delta]로 치환된다. 즉 [$\Sigma_1]에는 [$p]가 없다.

1계층 reduction 구문을 도입한다면 그로부터 증명할 수 있다."
axiomatic native link cut;

"conditional proof. deduction theorem이라고도 하는 것 같으나 뭐가 뭔지 모르겠다. 즉
[$$\frac{\Delta, p\vdash q}{\Delta\vdash p\to q}]
에 해당한다. [$\Delta, p\vdash q]에서 [$p]는 맨 마지막에 있어야 한다. mp와는 역연산 관계가 있다고 할 수 있다."
axiomatic native link cp;

"modus ponens 추론 규칙. 추론 규칙은 이것만 있어도 적당히 되는 것 같다. cp와는 역연산 관계가 있다고 할 수 있다."
axiomatic rule mp(st p, st q) {
	p, I(p, q) |- q
}

"규칙 mp의 링크 버전. 즉
[$$\frac{\Delta\vdash p\to q}{\Delta, p\vdash q}]
이다. 규칙 mp보다 적용하는 것이 간단하다. 규칙 mp로부터 증명할 수 있으나 아직 표현할 수 있는 방법이 없다."
axiomatic native link mp;

"conjunction introduction. [$ \vdash] 좌변의 [$p \land q]를 [$p, q]로 만들 수 있다.

mp에서 [$q] 자리에 [$p \land q]를 넣고 [$q \vdash p \to (p \land q)]임을 보인 것이다."
rule Ai(st p, st q) {
	mp[mp[tt.IpIqApq(p, q)]]
}

"conjunction introduction 2번."
rule A3i(st p, st q, st r) {
	Ai(p, q) ~ Ai(A(p, q), r)
}

"conjunction elimination 1."
rule Ae1(st p, st q) {
	mp[tt.IApqp(p, q)]
}

"conjunction elimination 2."
rule Ae2(st p, st q) {
	mp[tt.IApqq(p, q)]
}

"disjunction introduction 1."
rule Oi1(st p, st q) {
	mp[tt.IpOpq(p, q)]
}

"disjunction introduction 2."
rule Oi2(st p, st q) {
	mp[tt.IqOpq(p, q)]
}

"disjunction elimination."
rule Oe(st p, st q, st r) {
	A3i(
		O(p, q),
		I(p, r),
		I(q, r)
	)
	~ mp[tt.IAAOpqIprIqrr(p, q, r)]
}

"negation introduction."
rule Ni(st p, st q) {
	Ai(
		I(p, q),
		I(p, N(q))
	)
	~ mp[tt.IAIpqIpNqNp(p, q)]
}

"negation elimination."
rule Ne(st p, st q) {
	mp[tt.INpIpq(p, q)]
}

"double negation elimination."
rule NNe(st p) {
	mp[tt.INNpp(p)]
}

"biconditional introduction."
rule Ei(st p, st q) {
	Ai(I(p, q), I(q, p))
	~ mp[tt.IAIpqIqpEpq(p, q)]
}

"biconditional elimination 1."
rule Ee1(st p, st q) {
	mp[tt.IEpqIpq(p, q)]
}

"biconditional elimination 2."
rule Ee2(st p, st q) {
	mp[tt.IEpqIqp(p, q)]
}

rule IEpqEqpm(st p, st q) {
	mp[tt.IEpqEqp(p, q)]
}

rule IpIqpm(st p, st q) {
	mp[tt.IpIqp(p, q)]
}

"E를 위한 mp."
rule mpE(st p, st q) {
	mp[Ee1(p, q)]
}

"cp 형을 위한 삼단논법."
rule syll(st p, st q, st r) {
	Ai(I(p, q), I(q, r))
	~ mp[tt.IAIpqIqrIpr(p, q, r)]
}

rule syll4(st p, st q, st r, st s) {
	syll(p, q, r) ~ syll(p, r, s)
}

"E를 위한 syll."
rule syllE(st p, st q, st r) {
	Ai(E(p, q), E(q, r))
	~ mp[tt.IAEpqEqrEpr(p, q, r)]
}

rule syllE4(st p, st q, st r, st s) {
	syllE(p, q, r) ~ syllE(p, r, s)
}

"아무것도 하지 않는 무언가. 표현형식을 바꾸는 데 쓰이고 있다."
rule id(st p) {
	mp[tt.Ipp(p)]
}

"푹발률(ex falso quodlibet)."
rule explode(st p, st q) {
	mp[Ne(p, q)]
}

"[$\bot]을 만들어 내는 방법. 계의 기본규칙으로부터 이걸 호출할 수 있다면 계를 파-괴할 수 있다. 계가 이것을 만들어내지 않음을 검증하는 것은 중요하다."
rule destroy(st p) {
	explode(p, F)
}

"귀류법(reductio ad absurdum)."
rule contradict(st p) {
	mp[tt.IIpFNp(p)]
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

"universal introduction. 즉
[$$\frac{(x, \cdots, z, y)\mapsto(\vdash f(x, \cdots, z, y))}{(x, \cdots, z)\mapsto(\vdash \forall(y \mapsto f(x, \cdots, z, y)))}]
이다. 매개변수 맨 마지막에 있는 cls 하나를 [$\forall]로 돌리는 방식이다.

제약사항
[ul
	[*] 입력 규칙의 마지막 매개변수의 타입이 cls여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
axiomatic native link Vi;

"Vi의 네이티브 하지 않은 버전."
axiomatic link Vi_(pr f) {
	(cls x) => { |- f(x) } ||- |- V(f)
}

"universal elimination. 즉
[$$\frac{(x, \cdots, z)\mapsto(\vdash \forall(y \mapsto f(x, \cdots, z, y)))}{(x, \cdots, z, y)\mapsto(\vdash f(x, \cdots, z, y))}]
이다. Vi의 역연산이라고 볼 수 있다. rule Vinst로부터 유도할 수 있을 것으로 추정된다.

제약사항
[ul
	[*] [$\vdash]의 우변이 V여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]"
axiomatic native link Ve;

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
axiomatic rule VA(pr f, pr g) {
	|- E(
		V(Af(f, g)),
		A(V(f), V(g))
	)
}

"[$\forall]과 [$\to] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VA만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다."
axiomatic rule VI(pr f, pr g) {
	|- I(
		V(If(f, g)),
		I(V(f), V(g))
	)
}

axiomatic rule VO(pr f, pr g) {
	|- I(
		O(V(f), V(g)),
		V(Of(f, g))
	)
}

"[$\forall x\forall y]랑 [$\forall y\forall x]가 같다는 것. 특이하게도 Vi 및 Ve로부터 유도할 수 있는 것으로 보이나 아직 표현할 방식이 없다."
axiomatic rule VV(pr2 f) {
	|- I(
		V2((cls x, cls y) => { f(x, y) }),
		V2((cls y, cls x) => { f(x, y) })
	)
}

"VA의 m1형."
rule VAm1(pr f, pr g) {
	mp[VA(f, g)
	~ Ee1(
		V(Af(f, g)),
		A(V(f), V(g))
	)]
}

"VA의 m2형."
rule VAm2(pr f, pr g) {
	mp[VA(f, g)
	~ Ee2(
		V(Af(f, g)),
		A(V(f), V(g))
	)]
}

"VI의 m형."
rule VIm(pr f, pr g) {
	mp[VI(f, g)]
}

"VV의 m형."
rule VVm(pr2 f) {
	mp[VV(f)]
}

"IEpqEqpm의 V형."
rule IVEpqVEqpfm(pr f, pr g) {
	mp[
		Vi_((cls x) => {
			I(E(f(x), g(x)), E(g(x), f(x)))
		})[(cls x) => { tt.IEpqEqp(f(x), g(x)) }]
		~ VIm(
			(cls x) => { E(f(x), g(x)) },
			(cls x) => { E(g(x), f(x)) }
		)
	]
}

"Ee1의 V형."
rule Ee1V(pr f, pr g) {
	mp[
		Vi_((cls x) => {
			I(E(f(x), g(x)), I(f(x), g(x)))
		})[(cls x) => {tt.IEpqIpq(f(x), g(x))}]
		~ VIm(
			(cls z) => { E(f(z), g(z)) },
			(cls z) => { I(f(z), g(z)) }
		)
	]
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
	cp[VEm(f, g)]
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
	~ mp[
		Vi_((cls x) => {
			I(A(I(f(x), g(x)), I(g(x), h(x))), I(f(x), h(x)))
		})[(cls x) => {tt.IAIpqIqrIpr(f(x), g(x), h(x))}]
		~ VIm(
			(cls x) => { A(I(f(x), g(x)), I(g(x), h(x))) },
			(cls x) => { I(f(x), h(x)) }
		)
	]
}

rule syllVE(pr f, pr g, pr h) {
	Ai(
		V((cls w) => { E(f(w), g(w)) }),
		V((cls w) => { E(g(w), h(w)) })
	)
	~ VAm2(
		(cls w) => { E(f(w), g(w)) },
		(cls w) => { E(g(w), h(w)) }
	)
	~ mp[
		Vi_((cls x) => {
			I(A(E(f(x), g(x)), E(g(x), h(x))), E(f(x), h(x)))
		})[(cls x) => {tt.IAEpqEqrEpr(f(x), g(x), h(x))}]
		~ VIm(
			(cls w) => { A(E(f(w), g(w)), E(g(w), h(w))) },
			(cls w) => { E(f(w), h(w)) }
		)
	]
}

"[$\exists]과 [$\lor] 간의 분배법칙 같은 것. VA로부터 증명할 수 있다."
rule XO(pr f, pr g) {
	(VA(Nf(f), Nf(g)) ~
	mp[tt.IEpAqrENpONqNr(
		V(Af(Nf(f), Nf(g))), V(Nf(f)), V(Nf(g))
	)])
	~ ((
		Vi_((cls x) => {
			E(N(O(f(x), g(x))), A(N(f(x)), N(g(x))))
		})[(cls x) => {tt.ENOpqANpNq(f(x), g(x))}]
		~ VEm(
			(cls x) => { N(O(f(x), g(x))) },
			(cls x) => { A(N(f(x)), N(g(x))) }
		)
	)
	~ mp[tt.IEpqENpNq(
		V((cls x) => { N(O(f(x), g(x))) }),
		V((cls x) => { A(N(f(x)), N(g(x))) })
	)])
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
	mp[VIm(f, g)]
}

rule mpVE(pr f, pr g) {
	Ee1V(f, g) ~ mpV(f, g)
}

"universal generalization이 아니므로 이름을 바꿔야 할 것이다."
axiomatic rule Vgen(st p) {
	p |- V((cls w) => { p })
}

rule Vgen_c(st p) {
	cp[Vgen(p)]
}

rule VI_Vgen(st p, pr f) {
	Vgen_c(p) ~
	VIm((cls z) => {p}, f)
	~ syll(
		p,
		V((cls z) => {p}),
		V(f)
	)
}

rule VI_Vgen_c(st p, pr f) {
	cp[VI_Vgen(p, f)]
}

rule VI_Vgen_V2(pr f, pr2 g, cls z) {
	VI_Vgen_c(f(z), (cls w) => {g(z, w)})
}

rule VI_Vgen_V2_Vi(pr f, pr2 g) {
	Vi_((cls z) => {
		I(V((cls w) => {I(f(z), g(z, w))}), I(f(z), V((cls w) => {g(z, w)})))
	})[(cls z) => {VI_Vgen_V2(f, g, z)}]
}

rule VI_Vgen_V2_Vi_VI(pr f, pr2 g) {
	VI_Vgen_V2_Vi(f, g)
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

rule VI_Vgen_V2_Vi_VI_m(pr f, pr2 g) {
	id(V2((cls z, cls w) => {
		I(f(z), g(z, w))
	})) ~
	mp[VI_Vgen_V2_Vi_VI(f, g)]
}

"existential generalization. Vinst와 합치면 [$\forall f \vdash \exists f]가 될 것도 같으나 어떤 class x가 있어야 한다."
axiomatic rule Xgen(pr f, cls x) {
	f(x) |- X(f)
}

"universal instantiation."
axiomatic rule Vinst(pr f, cls x) {
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
	id(X((cls x) => {p})) ~
	mp[cp[Vgen(N(p))]
	~ mp[tt.IINpqINqp(p, V((cls x) => { N(p) }))]]
}

rule Xinst3(pr f, st p) {
	Xinst1(f, (cls x) => { p })
	~ Xinst2(p)
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

rule VVin_m(cls a, pr2 f) {
	id(V((cls z) => {
		Vin(a, (cls w) => {f(z, w)})
	})) ~
	VVm((cls z, cls w) => {
		I(in(w, a), f(z, w))
	}) ~ VI_Vgen_V2_Vi_VI_m(
		(cls y) => {in(y, a)},
		(cls y, cls x) => {f(x, y)}
	) ~ id(Vin(a, (cls w) => {
		V((cls z) => {f(z, w)})
	}))
}

"V와 Vin은 순서를 바꿀 수 있다."
rule VVin(cls a, pr2 f) {
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

rule set_Xgen(cls x, cls y) {
	Xgen((cls y) => { in(x, y) }, y)
	~ id(set(x))
}

rule set_Xgen_A(cls x, cls y, cls z) {
	Ae1(in(z, x), in(z, y)) ~
	set_Xgen(z, x)
}

rule set_Xgen_O(cls x, cls y, cls z) {
	cp[set_Xgen(z, x)]
	~ cp[set_Xgen(z, y)]
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

rule eq_Ae1_Vinst(cls x, cls y, cls z) {
	eq_Ae1(x, y)
	~ Vinst((cls z) => {
		E(in(z, x), in(z, y))
	}, z)
}

rule eq_Ae1_Vinst_Ee1(cls x, cls y, cls z) {
	eq_Ae1_Vinst(x, y, z)
	~ Ee1(in(z, x), in(z, y))
}

rule eq_Ae2(cls x, cls y) {
	id(eq(x, y)) ~
	Ae2(
		V((cls z) => { E(in(z, x), in(z, y)) }),
		V((cls w) => { E(in(x, w), in(y, w)) })
	)
}

rule eq_Ae2_Vinst(cls x, cls y, cls z) {
	eq_Ae2(x, y)
	~ Vinst((cls z) => {
		E(in(x, z), in(y, z))
	}, z)
}

rule eq_Ae2_Vinst_Ee1(cls x, cls y, cls z) {
	eq_Ae2_Vinst(x, y, z)
	~ Ee1(in(x, z), in(y, z))
}

rule eq_Ae2_Vinst_Ee1_c(cls x, cls y, cls z) {
	cp[eq_Ae2_Vinst_Ee1(x, y, z)]
}

rule swap_c(st p, st q, st r) {
	tt.IIpIqrIqIpr(p, q, r)
}

rule swap(st p, st q, st r) {
	mp[swap_c(p, q, r)]
}

rule swap_m(st p, st q, st r) {
	mp[swap(p, q, r)]
}

rule swapV_1(pr f, pr g, pr h, cls w) {
	swap_c(f(w), g(w), h(w))
}

rule swapV_c(pr f, pr g, pr h) {
	Vi_((cls w) => {
		I(I(f(w), I(g(w), h(w))), I(g(w), I(f(w), h(w))))
	})[(cls w) => {swapV_1(f, g, h, w)}]
	~ VIm(
		(cls w) => {I(f(w), I(g(w), h(w)))},
		(cls w) => {I(g(w), I(f(w), h(w)))}
	)
}

rule swapV(pr f, pr g, pr h) {
	mp[swapV_c(f, g, h)]
}

rule swapV2_1(pr2 f, pr2 g, pr2 h, cls z) {
	swapV_c(
		(cls w) => {f(z, w)},
		(cls w) => {g(z, w)},
		(cls w) => {h(z, w)}
	)
}

rule swapV2_c(pr2 f, pr2 g, pr2 h) {
	Vi_((cls z) => {
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

rule swapV2(pr2 f, pr2 g, pr2 h) {
	mp[swapV2_c(f, g, h)]
}

rule eq_Ae2_Vinst_Ee1_c_swap(cls x, cls y, cls z) {
	eq_Ae2_Vinst_Ee1_c(x, y, z)
	~ swap(
		eq(x, y),
		in(x, z),
		in(y, z)
	)
}

rule eq_reflexive_tmp1(cls x, cls z) {
	tt.Epp(in(z, x))
}

rule eq_reflexive_tmp2(cls x, cls w) {
	tt.Epp(in(x, w))
}

rule eq_reflexive(cls x) {
	Vi_((cls z) => {
		E(in(z, x), in(z, x))
	})[(cls z) => {eq_reflexive_tmp1(x, z)}]
	~ Vi_((cls w) => {
		E(in(x, w), in(x, w))
	})[(cls w) => {eq_reflexive_tmp2(x, w)}]
	~ Ai(
		V((cls z) => { E(in(z, x), in(z, x)) }),
		V((cls w) => { E(in(x, w), in(x, w)) })
	)
	~ id(eq(x, x))
}

rule eq_symmetric(cls x, cls y) {
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

rule eq_transitive(cls x, cls y, cls z) {
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

rule eq_transitive_3(cls x, cls y, cls z) {
	eq_transitive(x, y, z)
	~ eq_symmetric(x, z)
}

rule eq_transitive_2(cls x, cls y, cls z) {
	eq_symmetric(z, y) ~
	eq_transitive(x, y, z)
}

rule eq_transitive_23(cls x, cls y, cls z) {
	eq_symmetric(z, y) ~
	eq_transitive(x, y, z)
	~ eq_symmetric(x, z)
}

rule eq_transitive_1(cls x, cls y, cls z) {
	eq_symmetric(y, x)
	~ eq_transitive(x, y, z)
}

rule eq_transitive_13(cls x, cls y, cls z) {
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
	eq_symmetric(y, x) ~
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
axiomatic rule extensional(cls x, cls y) {
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
	mp[extensional(x, y)]
}

rule eq_simple(cls x, cls y) {
	cp[eq_Ae1(x, y)]
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
	cp[eq_then_subseteq_m(x, y)]
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
axiomatic rule setbuilder_def(pr f) {
	|- V((cls w) => {
		E(
			in(w, setbuilder(f)),
			A(set(w), f(w))
		)
	})
}

rule setbuilder_def_Ve(pr f, cls z) {
	Ve[setbuilder_def](f, z)
}

rule setbuilder_def_Ve_Ee(pr f, cls z) {
	setbuilder_def_Ve(f, z)
	~ mp[tt.IEpAqrIpr(
		in(z, setbuilder(f)),
		set(z),
		f(z)
	)]
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
	mp[Vi[(pr f, pr g, pr h, cls x) => {tt.IAEpAqrIrqEpr(f(x), g(x), h(x))}](f, g, h)
	~ VIm(
		(cls x) => { A(E(f(x), A(g(x), h(x))), I(h(x), g(x))) },
		(cls x) => { E(f(x), h(x)) }
	)]
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

rule set_Xgen_A_c(cls x, cls y, cls z) {
	cp[set_Xgen_A(x, y, z)]
}

rule cap_vi(cls x, cls y) {
	Vi[set_Xgen_A_c](x, y) ~
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

"[$\cup]."
$\left(#1<<\cup>>#2\right)$
cls cup(cls x, cls y) {
	setbuilder((cls z) => {
		O(in(z, x), in(z, y))
	})
}

rule set_Xgen_O_c(cls x, cls y, cls z) {
	cp[set_Xgen_O(x, y, z)]
}

rule cup_vi(cls x, cls y) {
	Vi[set_Xgen_O_c](x, y) ~
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
	cp[contradict(in(z, emptyset()))]
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
axiomatic rule specify(pr f) {
	|-
	V((cls x) => {
		I(
			set(x),
			set(subsetbuilder(x, f))
		)
	})
}

rule specify_vem(pr f, cls x) {
	mp[Ve[specify](f, x)]
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
	mp[Vi[subset_cap_is_subset_1](x, y)
	~VIm(
		(cls z) => { I(in(z, x), in(z, y)) },
		(cls z) => {
			E(
				in(z, x),
				A(in(z, x), in(z, y))
			)
		}
	)] ~
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
	cp[subset_is_set_ae(x, y)]
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
	mp[tt.IAEpAqrIAsrqIsEpr(p, q, r, s)]
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
	mp[power_def_1(x, y)]
}

"생각해 보니 얘는 멱집합의 defining property라고 부를 만큼 강력하지 않다. 이름을 적당히 바꿔야 할지도 모른다."
rule power_def(cls x) {
	Vgen(set(x)) ~
	mp[Vi[power_def_1](x)
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
	cp[self_in_power(x, z)]
}

rule self_in_power_Vi(cls x) {
	Vgen(set(x)) ~
	mp[Vi[self_in_power_Vi_1](x)
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
	cp[singleton_subseteq_power_1(x, y)]
}

rule singleton_subseteq_power(cls x) {
	Vgen(set(x)) ~
	mp[Vi[singleton_subseteq_power_2](x)
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
axiomatic rule ax_power() {
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
	mp[Ve[ax_power](x)]
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
	cp[power_is_set_1(x, y)]
	~ mp[tt.IIpqIArpArq(
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

rule power_is_set_3(cls x, cls y) {
	cp[power_is_set_2(x, y)]
}

"멱집합은 집합이다."
rule power_is_set(cls x) {
	(ax_power_vem(x)
	~ Vgen(set(x)) ~
	mp[Vi[power_is_set_3](x)
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
rule singleton_is_set(cls x) {
	singleton_subseteq_power(x)
	~ power_is_set(x)
	~ subset_is_set(singleton(x), power(x))
}

"Axiom of infinity."
axiomatic rule infinity() {
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

axiomatic rule v2_eq_def(cls x, cls y, cls z, cls w) {
	|- E(
		eq(v2(x, y), v2(z, w)),
		A(eq(x, z), eq(y, w))
	)
}

axiomatic rule v2_set_def(cls x, cls y) {
	|- E(
		set(v2(x, y)),
		A(set(x), set(y))
	)
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

rule graph_forall_1_1(cls x, cls z, cls a, cls b) {
	eq_Ae2_Vinst_Ee1_c_swap(z, v2(a, b), x)
}

"graph를 위한 forall.

[$G]가 그래프일 때, 임의의 [$(a, b)\in G]에 대해 [$f(a, b)]이면, 임의의 [$z\in G]에 대해 [$fz]이다."
rule graph_forall(pr f, cls x) {
	graph(x) |- I(
		V2((cls a, cls b) => {
			I(
				in(v2(a, b), x),
				f(v2(a, b))
			)
		}),
		Vin(x, f)
	)
}

"graph의 역(inverse)."
$\left({#1}^{<<-1>>}\right)$
cls graph_inverse(cls x);

"graph_inverse의 defining property.

[$G]가 graph일 때, [$G^{-1} = \{(b, a): (a, b)\in G\}]라는 뜻인데 더 엄밀하게
[$$\{z: (\exists a)(\exists b)(z = (b, a) \land (a, b) \in G)\}]
라고 표현되었다."
axiomatic rule graph_inverse_def(cls x) {
	graph(x) |- eq(
		graph_inverse(x),
		setbuilder((cls z) => {
			X2((cls a, cls b) => {
				A(
					eq(z, v2(b, a)),
					in(v2(a, b), x)
				)
			})
		})
	)
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
axiomatic rule graph_composite_def(cls x, cls y) {
	graph(x), graph(y) |- eq(
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
	)
}

rule graph_composite_associative(cls x, cls y, cls z) {
	graph(x), graph(y), graph(z) |- eq(
		graph_composite(graph_composite(x, y), z),
		graph_composite(x, graph_composite(y, z))
	)
}

"graph의 정의역(domain)."
$\left(<<\operatorname{dom}>>#1\right)$
cls graph_dom(cls x);

"graph_dom의 defining property.

[$G]가 graph일 때, [$\{a: (\exists b)((a, b)\in G)\}]라는 뜻이다."
axiomatic rule graph_dom_def(cls x) {
	graph(x) |- eq(
		graph_dom(x),
		setbuilder((cls a) => {
			X((cls b) => {
				in(v2(a, b), x)
			})
		})
	)
}

"graph의 치역(image)."
$\left(<<\operatorname{im}>>#1\right)$
cls graph_im(cls x);

"graph_im의 defining property.

[$G]가 graph일 때, [$\{b: (\exists a)((a, b)\in G)\}]라는 뜻이다."
axiomatic rule graph_im_def(cls x) {
	graph(x) |- eq(
		graph_im(x),
		setbuilder((cls b) => {
			X((cls a) => {
				in(v2(a, b), x)
			})
		})
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
axiomatic rule fcall_def(cls f, cls a, cls b, cls x, cls y) {
	function(f, a, b), in(x, a) |- E(
		eq(fcall(f, x), y),
		in(v2(x, y), f)
	)
}

`;