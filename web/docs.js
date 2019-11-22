docs = {
	simpleTypes: {
		st: {
			description: '문장 타입. 정의하지 않으면 에러가 난다.'
		},
		'class': {
			description: '클래스 타입. 술어 논리에서 쓰인다.'
		}
	},
	defs: {
		T: {
			description: '합리적인 것. 정말이지 맞는 것이다. 이걸 만들어 내도 계에는 별 일이 생기지 않는다.',
			display: function () {
				return `\\href{#def-T}{\\top}`
			}
		},
		F: {
			description: '모순. 정말이지 틀린 것이다. 이걸 만들어 낸다면 계를 파-괴할 수 있다.',
			display: function () {
				return `\\href{#def-F}{\\bot}`
			}
		},
		S: {
			description: String.raw`
nand(FTTT). Sheffer의 1913년 논문에서 다른 모든 논리 기호를 유도할 수 있는 것이 증명된 것 같다. nor(FFFT) 역시 같은 성질을 갖고 있다(그러나 업계에서는 NAND 게이트를 NOR 게이트보다 선호하는 것 같다).

그러나 여기서는 다른 논리 기호를 유도하지 않고 모든 논리 기호를 primitive 하게 하였다. 이는 어차피 진리표를 가정하므로 별 필요 없기 때문이다. 또 실행 속도를 빠르게 하기 위함이다[&hellip].`,
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-S}{\\barwedge} ${args[1].toTeXString()}\\right)`;
			}
		},
		I: {
			description: 'implies(TFTT).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-I}{\\to} ${args[1].toTeXString()}\\right)`;
			}
		},
		N: {
			description: 'not(FT).',
			display: function (args) {
				return `\\left(\\href{#def-N}{\\neg} ${args[0].toTeXString()}\\right)`;
			}
		},
		A: {
			description: 'and(TFFF).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-A}{\\land} ${args[1].toTeXString()} \\right)`;
			}
		},
		O: {
			description: 'O(TTTF).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-O}{\\lor} ${args[1].toTeXString()} \\right)`;
			}
		},
		E: {
			description: 'iff(TFFT).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-E}{\\leftrightarrow} ${args[1].toTeXString()}\\right)`;
			}
		},
		Af: {
			description: 'A의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-Af}{\\land} ${args[1].toTeXString()} \\right)`;
			}
		},
		Of: {
			description: 'O의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-Of}{\\lor} ${args[1].toTeXString()} \\right)`;
			}
		},
		If: {
			description: 'I의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-If}{\\to} ${args[1].toTeXString()} \\right)`;
			}
		},
		Ef: {
			description: 'E의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#def-Ef}{\\leftrightarrow} ${args[1].toTeXString()} \\right)`;
			}
		},
		V: {
			description: '보편 양화(universal quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받는다.',
			display: function (args) {
				return `\\left(\\href{#def-V}{\\forall}${args[0].toTeXString()}\\right)`;
			}
		},
		V2: {
			description: '입력항이 두 개인 함수를 위한 보편 양화. V에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#def-V2}{\\forall}${args[0].toTeXString()}\\right)`;
			}
		},
		V3: {
			description: '입력항이 세 개인 함수를 위한 보편 양화. V에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#def-V3}{\\forall}${args[0].toTeXString()}\\right)`;
			}
		},
		X: {
			description: '존재 양화(existential quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받으며 V에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#def-X}{\\exists}${args[0].toTeXString()}\\right)`;
			}
		},
		X2: {
			description: '입력항이 두 개인 함수를 위한 존재 양화. V2에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#def-X2}{\\exists}${args[0].toTeXString()}\\right)`;
			}
		},
		'in': {
			description: '집합론에서 정의하는 in 연산자.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-in}{\\in}${args[1].toTeXString()} \\right)`
			}
		},
		'set': {
			description: '어떤 class가 집합이라는 것. 어떤 class의 원소면 된다.',
			display: function (args) {
				return `\\left(\\href{#def-set}{\\mathop\\mathsf{set}}${args[0].toTeXString()}\\right)`
			}
		},
		eq: {
			description: '[$=] 연산자. [$\\in]에 의존한다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-eq}{=}${args[1].toTeXString()} \\right)`;
			}
		},
		subseteq: {
			description: String.raw`[$\subseteq].`,
			display(args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-subseteq}{\\subseteq}${args[1].toTeXString()} \\right)`;
			}
		},
		cap: {
			description: String.raw`[$\cap].`,
			display(args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-cap}{\\cap}${args[1].toTeXString()} \\right)`;
			}
		},
		cup: {
			description: String.raw`[$\cup].`,
			display(args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-cup}{\\cup}${args[1].toTeXString()} \\right)`;
			}
		},
		Nin: {
			description: '간단한 notin 함수.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#def-Nin}{\\notin}${args[1].toTeXString()} \\right)`
			}
		},
		setbuilder: {
			description: String.raw`
술어를 만족하는 class를 만든다. 일반적으로는 [$\{z: f(z)\}]라고 쓰는 것.
`,
			display(args) {
				return `\\left\\{ \\href{#def-setbuilder}{:} ${args[0].toTeXString()} \\right\\}`;
			}
		},
		subsetbuilder: {
			description: String.raw`
술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.
일반적으로는 [$\{z \in x: f(z)\}]라고 쓰는 것인데 더미 변수를 없애버렸다.`,
			display: function (args) {
				return `\\left\\{ ${args[0].toTeXString()} \\href{#def-subsetbuilder}{:} ${args[1].toTeXString()} \\right\\}`;
			}
		},
		power: {
			description: 'power class.',
			display: function (args) {
				return `\\href{#def-power}{\\mathcal P}(${args[0].toTeXString()})`;
			}
		},
		singleton: {
			description: 'singleton class.',
			display(args) {
				return `\\href{#def-singleton}{\\{} ${args[0].toTeXString()} \\}`;
			}
		},
		emptyset: {
			description: 'empty class. ZFC에 의하면 set이다.',
			display() {
				return '\\href{#def-emptyset}{\\varnothing}';
			}
		},
		universe: {
			description: 'universal class. ZFC에 의하면 proper class이다.',
			display() {
				return '\\href{#def-universe}{\\mathcal U}';
			}
		},
		reflexive: {
			description: 'binary relation의 reflexivity.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#def-reflexive}{\\text{is reflexive}}\\right)`;
			}
		},
		symmetric: {
			description: 'binary relation의 symmetry.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#def-symmetric}{\\text{is symmetric}}\\right)`;
			}
		},
		transitive: {
			description: 'binary relation의 transitivity.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#def-transitive}{\\text{is transitive}}\\right)`;
			}
		},
		associative: {
			description: 'binary operation의 associativity.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#def-associative}{\\text{is associative}}\\right)`;
			}
		},
		commutative: {
			description: 'binary operation의 commutativity.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#def-commutative}{\\text{is commutative}}\\right)`;
			}
		}
	},
	rules: {
		mp: {
			description: 'modus ponens 추론 규칙. 추론 규칙은 이것만 있어도 적당히 되는 것 같다. cp와는 역연산 관계가 있다고 할 수 있다.'
		},
		Ai: {
			description: String.raw`
conjunction introduction. [$ \vdash] 좌변의 [$p \land q]를 [$p, q]로 만들 수 있다.

mp에서 [$q] 자리에 [$p \land q]를 넣고 [$q \vdash p \to (p \land q)]임을 보인 것이다.`
		},
		A3i: {
			description: 'conjunction introduction 2번.'
		},
		Ae1: {
			description: 'conjunction elimination 1.'
		},
		Ae2: {
			description: 'conjunction elimination 2.'
		},
		Oi1: {
			description: 'disjunction introduction 1.'
		},
		Oi2: {
			description: 'disjunction introduction 2.'
		},
		Oe: {
			description: 'disjunction elimination.'
		},
		Ni: {
			description: 'negation introduction.'
		},
		Ne: {
			description: 'negation elimination.'
		},
		NNe: {
			description: 'double negation elimination.'
		},
		Ei: {
			description: 'biconditional introduction.'
		},
		Ee1: {
			description: 'biconditional elimination 1.'
		},
		Ee2: {
			description: 'biconditional elimination 2.'
		},
		mpE: {
			description: 'E를 위한 mp.'
		},
		syll: {
			description: 'cp 형을 위한 삼단논법.'
		},
		syllE: {
			description: 'E를 위한 syll.'
		},
		id: {
			description: '아무것도 하지 않는 무언가. 표현형식을 바꾸는 데 쓰이고 있다.'
		},
		destroy: {
			description: String.raw`
[$\bot]을 만들어 내는 방법. 계의 기본규칙으로부터 이걸 호출할 수 있다면 계를 파-괴할 수 있다.

비슷한 방법으로 [$p, \neg p \vdash q]를 유도할 수 있다. 이는 [$p \vdash \top] 또는 [$\vdash p \to \top]이라고 [$\vdash p]가 아님을 시사한다.`
		},
		contradict: {
			description: String.raw`
귀류법(reductio ad absurdum).
`
		},
		Vinst: {
			description: 'universal instantiation.'
		},
		Xinst1: {
			description: 'existential instantiation 같은 것 1. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정.'
		},
		Xinst2: {
			description: 'existential instantiation 같은 것 2. 사실 인스턴스를 만들지는 않으나 표현력은 같을 것으로 추정. Vgen으로부터 증명할 수 있다.'
		},
		Vgen: {
			description: String.raw`
universal generalization.
`
		},
		Xgen: {
			description: String.raw`
existential generalization. Vinst와 합치면 [$\forall f \vdash \exists f]가 될 것도 같으나 어떤 class x가 있어야 한다.`
		},
		VA: {
			description: String.raw`
[$\forall]과 [$\land] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VI만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다.
`
		},
		VI: {
			description: String.raw`
[$\forall]과 [$\to] 간의 분배법칙 같은 것. 진리표를 그려 본 결과 이거랑 VA만 있으면 적당히 분배되는 것 같은데, 파고 들자면 복잡하다.
`
		},
		VV: {
			description: String.raw`
[$\forall x\forall y]랑 [$\forall y\forall x]가 같다는 것. 특이하게도 Vi 및 Ve로부터 유도할 수 있는 것으로 보이나 아직 표현할 방식이 없다.
`
		},
		VAm1: {
			description: 'VA의 m1형.'
		},
		VAm2: {
			description: 'VA의 m2형.'
		},
		VIm: {
			description: 'VI의 m형.'
		},
		VVm: {
			description: 'VV의 m형.'
		},
		IVEpqVEqpfm: {
			description: 'IEpqEqpm의 V형.'
		},
		Ee1V: {
			description: 'Ee1의 V형.'
		},
		Ee2V: {
			description: 'Ee2의 V형.'
		},
		extensional: {
			description: 'axiom of extensionality. ZFC 공리계의 공리.'
		},
		emptyset_def: {
			description: 'emptyset의 definition rule.'
		},
		setbuilder_def: {
			description: `setbuilder의 definition rule.

Deprecated: 이 정의는 {:T}가 스스로를 포함할 수 있게 하는데 이는 axiom of foundation에 모순된다. 그러므로 setbuilder_def__로 옮기셈.`
		},
		setbuilder_def__: {
			description: `setbuilder의 새로운 definition rule. 근데 이걸로 singleton을 만들 경우 proper class의 singleton이 empty set이 되는 불상사가 발생하는데 어떻게 해야 할지 모르겠음.`
		},
		specify: {
			description: 'axiom schema of specification. ZFC 공리계의 공리. 어떤 집합에서 임의 술어를 만족시키는 것의 class를 만들었을 때 이 class가 집합이라는 뜻이다.'
		},
		ax_power: {
			description: 'axiom of power set.'
		},
		eq_reflexive: {
			description: '[$=]는 반사적(reflexive)이다.'
		},
		eq_symmetric: {
			description: '[$=]는 대칭적(symmetric)이다.'
		},
		power_is_set: {
			description: '멱집합은 집합이다.'
		},
		singleton_is_set: {
			description: '싱글턴은 집합이다.'
		}
	},
	rulesets: {
		tt: {
			description: String.raw`
truth table의 tt. 진리표를 만들어 봤을 때 값이 항상 참인 명제 [$P] 중 필요할 만한 대부분의 것들에 대해 [$\vdash P]를 포함하고 있다. 물론 배열로서 일일이 나열해 놓은 것이 아니고 논리적으로 그렇다는 것이다.

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
			[*] N: I ([$\neg]).
		]
	[*] 이항 연산자
		[ul
			[*] A: and ([$\land]).
			[*] O: or ([$\lor]).
			[*] I: implies ([$\to]).
			[*] E: iff ([$\leftrightarrow]). equivalent의 E인 것으로 하자.
			[*] S: nand ([$\barwedge]). Sheffer stroke의 S. 그렇지만 생김새는 스트로크가 아니다.
		]
]

대소문자를 구분하고 괄호 따위는 쓰지 않으며 연산자를 맨 앞에 쓰고 인자를 이어 쓰면 된다.

[> 예를 들어 [$\vdash p \land q]는 Apq, [$\vdash \neg (p \land q) \leftrightarrow (\neg p \lor \neg q)]는 ENApqONpNq가 된다.]

틀린 식은 없다고 나오므로 주의하기 바란다.

tt에 포함되어 있는 규칙의 [$\vdash]의 좌변에는 아무 것도 없으므로, 뭔가를 좌변에 넣으려면 modus ponens를 적용해야 한다.
`
		}
	},
	links: {
		cp: {
			description: String.raw`
conditional proof. deduction theorem이라고도 한다. 어떤 규칙
[$$(\cdots): p, \cdots, r, q \vdash s]
를 주면 규칙
[$$(\cdots): p \cdots, r \vdash q \to s]
를 뱉는다. [$\vdash] 좌항 마지막에 있는 명제 하나를 우항으로 돌린다. mp와는 역연산 관계가 있다고 할 수 있다.
`
		},
		Vi: {
			description: String.raw`
universal quantification introduction. 어떤 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 주면 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 뱉는다. 매개변수 맨 마지막에 있는 class 하나를 [$\forall]로 돌리는 방식이다.

제약사항
[ul
	[*] 입력 규칙의 마지막 매개변수의 타입이 Class여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]
`
		},
		Ve: {
			description: String.raw`
universal quantification elimination. 어떤 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 주면 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 뱉는다. Vi의 역연산이라고 볼 수 있다.

제약사항
[ul
	[*] [$\vdash]의 우변이 V여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]
`
		}
	}
};