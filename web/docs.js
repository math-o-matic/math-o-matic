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
			description: 'implies. not과 함께 명제논리에서 사용할 기본 함수입니다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-implies}{\\to} ${args[1].toTeXString()}\\right)`;
			}
		},
		not: {
			description: 'not. implies와 함께 명제논리에서 사용할 기본 함수입니다.',
			display: function (args) {
				return `\\left(\\href{#typevar-not}{\\neg} ${args[0].toTeXString()}\\right)`;
			}
		},
		and: {
			description: 'and. not과 implies로부터 정의됨.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-and}{\\land} ${args[1].toTeXString()} \\right)`;
			}
		},
		or: {
			description: 'or. not과 implies로부터 정의됨.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-or}{\\lor} ${args[1].toTeXString()} \\right)`;
			}
		},
		iff: {
			description: 'iff. implies와 and로부터 정의됨.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
						+ `\\href{#typevar-iff}{\\leftrightarrow} ${args[1].toTeXString()}\\right)`;
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
				return `\\left(\\href{#typevar-forall}{\\forall}${args[0].toTeXString()}\\right)`;
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
				return `\\left(\\href{#typevar-exists}{\\exists}${args[0].toTeXString()}\\right)`;
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
			description: '술어와 집합으로부터 술어를 만족하는 집합의 부분집합을 만든다.',
			display: function (args) {
				return `\\left(${args[0].toTeXString()}`
					+ `\\href{#typevar-setbuildereq}{=}`
					+ `\\left\\{ ${args[1].toTeXString()} / ${args[2].toTeXString()} \\right\\} \\right)`;
			}
		},
		sym: {
			description: 'binary relation의 symmetricity.',
			display: function (args) {
				return `${args[0].toTeXString()}\\ \\href{#typevar-sym}{\\text{is symmetric}}`;
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