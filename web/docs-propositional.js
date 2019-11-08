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
			description: 'modus ponens 추론 규칙. 어떤 명제논리 시스템의 기본규칙이 될 예정.'
		},
		not_e_mp: {
			description: 'negation elimination.'
		},
		or_i2_mp: {
			description: 'disjunction introduction 2.'
		}
	}
};