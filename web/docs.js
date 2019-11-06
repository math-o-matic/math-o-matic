docs = {
	simpleTypes: {
		St: {
			description: '문장 타입. 정의하지 않으면 에러가 난다.'
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
		eq: {
			description: '= 연산자.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()} = ${args[1].toTeXString()} \\right)`
			}
		},
		notin: {
			description: '간단한 notin 함수.',
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
			description: 'existential instantiation. 사실 instantiation을 하지는 않으나 동등한 표현력을 가질 것으로 보인다.'
		},
		exists: {
			description: '지목할 수 있으면 존재한다는 의미. uinst와 합치면 ∀f |- ∃f가 될 것도 같으나 어떤 Class x가 있어야 한다.'
		},
		ext: {
			description: 'axiom of extensionality. ZFC 공리계의 공리.'
		},
		spec: {
			description: 'axiom schema of specification. ZFC 공리계의 공리.'
		},
		spec_uinst: {
			description: 'spec이랑 uinst를 합친 것.'
		},
		mp2: {
			description: 'Metamath에 있는 mp2.'
		},
		mp2b: {
			description: 'Metamath에 있는 mp2b.'
		},
		a1i: {
			description: 'Metamath에 있는 a1i.'
		},
		mp1i: {
			description: 'Metamath에 있는 mp1i.'
		}
	}
};