docs = {
	simpleTypes: {
		st: {
			description: '문장 타입. 정의하지 않으면 에러가 난다.'
		},
		class: {
			description: '클래스 타입. 술어 논리에서 쓰인다.'
		}
	},
	typevars: {
		verum: {
			description: '합리적인 것. 정말이지 맞는 것이다. 이걸 만들어 내도 계에는 별 일이 생기지 않는다.',
			display: function () {
				return `\\href{#typevar-verum}{\\top}`
			}
		},
		falsum: {
			description: '모순. 정말이지 틀린 것이다. 이걸 만들어 낸다면 계를 파-괴할 수 있다.',
			display: function () {
				return `\\href{#typevar-falsum}{\\bot}`
			}
		},
		nand: {
			description: 'nand(FTTT). Sheffer의 1913년 논문에서 다른 모든 논리 기호를 유도할 수 있는 것이 증명된 것 같다. nor(FFFT) 역시 같은 성질을 갖고 있으나, 업계에서는 NAND 게이트를 NOR 게이트보다 선호하는 것 같다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-nand}{\\barwedge} ${args[1].toTeXString()}\\right)`;
			}
		},
		implies: {
			description: 'implies(TFTT).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-implies}{\\to} ${args[1].toTeXString()}\\right)`;
			}
		},
		not: {
			description: 'not(FT).',
			display: function (args) {
				return `\\left(\\href{#typevar-not}{\\neg} ${args[0].toTeXString()}\\right)`;
			}
		},
		and: {
			description: 'and(TFFF).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-and}{\\land} ${args[1].toTeXString()} \\right)`;
			}
		},
		or: {
			description: 'or(TTTF).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-or}{\\lor} ${args[1].toTeXString()} \\right)`;
			}
		},
		iff: {
			description: 'iff(TFFT).',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-iff}{\\leftrightarrow} ${args[1].toTeXString()}\\right)`;
			}
		},
		andf: {
			description: 'and의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-andf}{\\land} ${args[1].toTeXString()} \\right)`;
			}
		},
		orf: {
			description: 'or의 함수 작용소(operator) 버전 같은 것. 수식을 간결하게 해 준다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-orf}{\\lor} ${args[1].toTeXString()} \\right)`;
			}
		},
		forall: {
			description: '보편 양화(universal quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받는다.',
			display: function (args) {
				return `\\left(\\href{#typevar-forall}{\\forall}${args[0].toTeXString()}\\right)`;
			}
		},
		forall2: {
			description: '입력항이 두 개인 함수를 위한 보편 양화. forall에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#typevar-forall2}{\\forall}${args[0].toTeXString()}\\right)`;
			}
		},
		exists: {
			description: '존재 양화(existential quantification). 일반적인 표기법과는 다르게 함수를 입력으로 받으며 forall에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#typevar-exists}{\\exists}${args[0].toTeXString()}\\right)`;
			}
		},
		exists2: {
			description: '입력항이 두 개인 함수를 위한 존재 양화. forall2에 의존한다.',
			display: function (args) {
				return `\\left(\\href{#typevar-exists2}{\\exists}${args[0].toTeXString()}\\right)`;
			}
		},
		in: {
			description: '집합론에서 정의하는 in 연산자.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-in}{\\in}${args[1].toTeXString()} \\right)`
			}
		},
		eq: {
			description: '= 연산자.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-eq}{=}${args[1].toTeXString()} \\right)`
			}
		},
		notin: {
			description: '간단한 notin 함수.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-notin}{\\notin}${args[1].toTeXString()} \\right)`
			}
		},
		setbuildereq: {
			description: String.raw`
술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.
일반적으로는 [$x = \{z \in y: f(z)\}]라고 쓰는 것인데 더미 변수를 없애버렸다.`,
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-setbuildereq}{=}`
					+ `\\left\\{ ${args[1].toTeXString()} : ${args[2].toTeXString()} \\right\\} \\right)`;
			}
		},
		sym: {
			description: 'binary relation의 symmetricity.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}\\ \\href{#typevar-sym}{\\text{is symmetric}}\\right)`;
			}
		}
	},
	rules: {
		mp: {
			description: 'modus ponens 추론 규칙. 추론 규칙은 이것만 있어도 적당히 되는 것 같다.'
		},
		andi: {
			description: String.raw`
conjunction introduction. [$ \vdash] 좌변의 [$p \land q]를 [$p, q]로 만들 수 있다.

mp에서 [$q] 자리에 [$p \land q]를 넣고 [$q \vdash p \to (p \land q)]임을 보인 것이다.`
		},
		and3i: {
			description: 'conjunction introduction 2번.'
		},
		ande1: {
			description: 'conjunction elimination 1.'
		},
		ande2: {
			description: 'conjunction elimination 2.'
		},
		ori1: {
			description: 'disjunction introduction 1.'
		},
		ori2: {
			description: 'disjunction introduction 2.'
		},
		ore: {
			description: 'disjunction elimination.'
		},
		noti: {
			description: 'negation introduction.'
		},
		note: {
			description: 'negation elimination.'
		},
		notnote: {
			description: 'double negation elimination.'
		},
		iffi: {
			description: 'biconditional introduction.'
		},
		iffe1: {
			description: 'biconditional elimination 1.'
		},
		iffe2: {
			description: 'biconditional elimination 2.'
		},
		destroy: {
			description: String.raw`
[$\bot]을 만들어 내는 방법. 계의 기본규칙으로부터 이걸 호출할 수 있다면 계를 파-괴할 수 있다.

비슷한 방법으로 [$p, \neg p \vdash q]를 유도할 수 있다. 이는 [$p \vdash \top] 또는 [$\vdash p \to \top]이라고 [$\vdash p]가 아님을 시사한다.`
		},
		uinst: {
			description: 'universal instantiation.'
		},
		einst: {
			description: 'existential instantiation. 사실 instantiation을 하지는 않으나 동등한 표현력을 가질 것으로 보인다.'
		},
		exists: {
			description: '지목할 수 있으면 존재한다는 의미. uinst와 합치면 ∀f |- ∃f가 될 것도 같으나 어떤 class x가 있어야 한다.'
		},
		ext: {
			description: 'axiom of extensionality. ZFC 공리계의 공리.'
		},
		spec: {
			description: 'axiom schema of specification. ZFC 공리계의 공리.'
		},
		eq_sym: {
			description: '[$=]는 대칭적(symmetric)이다.'
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
			[*] N: not ([$\neg]).
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
conditional proof. deduction theorem이라고도 한다.
`
		},
		foralli: {
			description: String.raw`
universal quantification introduction. 어떤 규칙
[$$(x, \cdots, z, y):\ \vdash f(x, \cdots, z, y)]
를 주면 규칙
[$$(x, \cdots, z):\ \vdash \forall(y \mapsto f(x, \cdots, z, y))]
를 뱉는다. 매개변수 맨 마지막에 있는 class 하나를 [$\forall]로 돌리는 방식이다.

제한사항
[ul
	[*] 입력 규칙의 마지막 매개변수의 타입이 Class여야 함.
	[*] [$\vdash]의 좌변에 아무것도 없어야 함.
]
`
		}
	}
};