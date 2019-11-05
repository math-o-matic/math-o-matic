docs = {
	simpleTypes: {
		St: {
			description: '문장 타입. 기본으로 제공되므로 정의하면 안 된다.'
		},
		Class: {
			description: '클래스 타입'
		}
	},
	typevars: {
		implies: {
			description: 'implies',
			display: function (args) {
				return `\\left(${args[0].toTeXString()} \\to ${args[1].toTeXString()}\\right)`;
			}
		},
		not: {
			description: 'not',
			display: function (args) {
				return `\\left(\\neg ${args[0].toTeXString()}\\right)`;
			}
		},
		and: {
			description: 'and',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ ` \\land ${args[1].toTeXString()} \\right)`;
			}
		},
		iff: {
			description: 'iff',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ ` \\leftrightarrow ${args[1].toTeXString()}\\right)`;
			}
		},
		forall: {
			description: 'forall 연산자. 일반적인 표기법과는 다르게 함수를 입력으로 받는다.',
			display: function (args) {
				return `\\left(\\forall ${args[0].toTeXString()}\\right)`;
			}
		},
		exists: {
			description: 'exists 연산자. 일반적인 표기법과는 다르게 함수를 입력으로 받으며 forall에 의존한다.',
			display: function (args) {
				return `\\left(\\exists ${args[0].toTeXString()}\\right)`;
			}
		},
		in: {
			description: '집합론에서 정의하는 in 연산자.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()} \\in ${args[1].toTeXString()} \\right)`
			}
		},
		notin: {
			description: 'notin',
			display: function (args) {
				return `\\left(${args[0].toTeXString()} \\notin ${args[1].toTeXString()} \\right)`
			}
		},
		setbuildereq: {
			description: '술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()} = \\left\\{ ${args[1].toTeXString()} / ${args[2].toTeXString()} \\right\\} \\right)`;
			}
		}
	},
	rules: {
		luk1: {
			description: 'Łukasiewicz 공리 #1.'
		},
		luk2: {
			description: 'Łukasiewicz 공리 #2.'
		},
		luk3: {
			description: 'Łukasiewicz 공리 #3.'
		},
		mp: {
			description: 'modus ponens 추론 규칙.'
		},
		uinst: {
			description: 'universal instantiation.'
		},
		einst: {
			description: 'existential instantiation. 사실 instantiation을 하지는 않으나 동등한 표현력을 가진다.'
		},
		exists: {
			description: '지목할 수 있으면 존재한다는 의미. uinst와 합치면 ∀f |- ∃f가 될 것도 같으나 어떤 Class x가 있어야 한다.'
		}
	},
	links: {
		li1: {
			description: '...'
		}
	}
};