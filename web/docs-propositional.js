docs = {
	simpleTypes: {
		St: {
			description: '문장 타입. 정의하지 않으면 에러가 난다.'
		}
	},
	typevars: {
		verum: {
			description: '합리적인 것. 정말이지 맞는 것이다. 이걸 만들어 내도 계에는 별 일이 생기지 않는다.'
		},
		falsum: {
			description: '모순. 정말이지 틀린 것이다. 이걸 만들어 낸다면 계를 붕괴시킬 수 있다.'
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
		}
	},
	rules: {
		mp: {
			description: 'modus ponens 추론 규칙. 추론 규칙은 이것만 있어도 적당히 되는 것 같다.'
		},
		not_e_mp: {
			description: 'negation elimination.'
		},
		or_i2_mp: {
			description: 'disjunction introduction 2.'
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
			[*] p, q, r, s, t, u, v, w, x, y, z: 순서대로 1~11번째의 St 타입 입력항.
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
	}
};