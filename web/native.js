native = {
	ruleset: {
		tt: {
			get: (name, scope) => {
				if (typeof name != 'string')
					throw Error('Assertion failed');

				var vars = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
				var nullary = ['T', 'F'].concat(vars);
				var unary = ['N'];
				var binary = ['A', 'O', 'I', 'E'];

				var arityMap = {};
				nullary.forEach(e => arityMap[e] = 0);
				unary.forEach(e => arityMap[e] = 1);
				binary.forEach(e => arityMap[e] = 2);

				var usedVars = Array(vars.length).fill(false);

				// 1: 파싱 하기
				var stack = [];

				function lastIsFull() {
					if (!stack.length) return true;
					return arityMap[stack[stack.length - 1][0]] == stack[stack.length - 1].length - 1;
				}

				function push(token) {
					if (arityMap[token] == 0) {
						if (vars.includes(token))
							usedVars[vars.indexOf(token)] = true;

						if (lastIsFull()) {
							stack.push(token);
						} else {
							stack[stack.length - 1].push(token);

							while (stack.length > 1 && lastIsFull()) {
								var p = stack.pop();
								stack[stack.length - 1].push(p);
							}
						}
					} else {
						stack.push([token]);
					}
				}

				for (var i = 0; i < name.length; i++) {
					if (typeof arityMap[name[i]] != 'number')
						throw Error(`Unexpected character ${name[i]}`);

					push(name[i]);
				}

				if (stack.length != 1)
					throw Error('Parse failed');

				if (!lastIsFull())
					throw Error('Parse failed');

				usedVars = usedVars.map((e, i) => e && i).filter(e => e !== false);

				var parsed = stack[0];

				// 2: 진리표 확인
				var collen = 2 ** usedVars.length;

				var functionMap = {
					N: p => !p,
					A: (p, q) => p && q,
					O: (p, q) => p || q,
					I: (p, q) => !p || q,
					E: (p, q) => p == q
				};

				var varTable = {};

				for (var i = 0; i < usedVars.length; i++) {
					varTable[vars[usedVars[i]]] = Array(collen).fill().map((_, j) => {
						return !((j >> (usedVars.length - i - 1)) & 1);
					});
				}

				var constTable = {
					T: Array(collen).fill(true),
					F: Array(collen).fill(false)
				};

				function getColumn(t) {
					if (t instanceof Array) {
						var columns = t.slice(1).map(getColumn);

						var column = Array(collen);

						for (var i = 0; i < collen; i++) {
							column[i] = functionMap[t[0]](...columns.map(col => col[i]));
						}

						return column;
					}

					if (['T', 'F'].includes(t)) return constTable[t];
					return varTable[t];
				}

				if (!getColumn(parsed).every(e => e))
					throw Error('Validation failed');

				// 3: 노드 트리 만들기
				if (!scope.root.hasTypeByName('st'))
					throw Error(`Type st not found`);

				var st = scope.root.getTypeByName('st');

				var typevars = Array(usedVars.length).fill().map((_, i) => {
					return new scope.Typevar({
						type: st,
						name: vars[usedVars[i]]
					});
				});

				var typevarMap = {
					'T': 'T',
					'F': 'F',
					'N': 'N',
					'A': 'A',
					'O': 'O',
					'I': 'I',
					'E': 'E'
				};

				Object.keys(typevarMap).forEach(k => {
					var v = typevarMap[k];

					if (!scope.root.hasTypevarByName(v))
						throw Error(`Typevar ${v} not found`);
					typevarMap[k] = scope.root.getTypevarByName(v);
				});

				function recurse(t) {
					if (t instanceof Array) {
						return new scope.Funcall({
							fun: recurse(t[0]),
							args: t.slice(1).map(recurse)
						});
					}

					if (vars.includes(t)) return typevars[vars.indexOf(t)];
					return typevarMap[t];
				}

				var funcall = recurse(parsed);

				var yield_ = new scope.Yield({
					left: [],
					right: funcall
				});

				var rule = new scope.Rule({
					name: 'tt.' + name,
					params: typevars,
					rules: [yield_]
				});

				return rule;
			}
		}
	},
	link: {
		Vi: {
			get: (rules, scope) => {
				if (rules.length != 1) return false;
				var rule = rules[0];

				if (!scope.hasTypeByName('st'))
					throw Error(`Type st not found`);

				var st = scope.getTypeByName('st');
				
				if (!scope.hasTypeByName('cls'))
					throw Error(`Type cls not found`);

				var cls = scope.getTypeByName('cls');

				if (!rule.params[rule.params.length - 1].type.equals(cls))
					return false;

				var last = rule.params[rule.params.length - 1];

				var yield_ = rule.expr;

				if (yield_._type != 'yield')
					return false;

				if (yield_.left.length)
					return false;

				if (!scope.hasTypevarByName('V'))
					throw Error(`Typevar V not found`);

				var V = scope.getTypevarByName('V');

				if (!V.type.equals(new scope.Type({
					functional: true,
					from: [new scope.Type({
						functional: true,
						from: [cls],
						to: st
					})],
					to: st
				})))
					throw Error(`Wrong type for V`);

				return new scope.Rule({
					name: `Vi[${rule.name}]`,
					params: rule.params.slice(0, rule.params.length - 1),
					rules: [
						new scope.Yield({
							left: [],
							right: new scope.Funcall({
								fun: V,
								args: [
									new scope.Fun({
										anonymous: true,
										type: new scope.Type({
											functional: true,
											from: [cls],
											to: st
										}),
										atomic: false,
										params: [last],
										expr: yield_.right
									})
								]
							})
						})
					]
				});
			}
		},
		Ve: {
			get: (rules, scope) => {
				if (rules.length != 1) return false;
				var rule = rules[0];

				if (!scope.hasTypeByName('st'))
					throw Error(`Type st not found`);

				var st = scope.getTypeByName('st');
				
				if (!scope.hasTypeByName('cls'))
					throw Error(`Type cls not found`);

				var cls = scope.getTypeByName('cls');

				var yield_ = rule.expr;

				if (yield_._type != 'yield')
					return false;

				if (yield_.left.length)
					return false;

				if (!scope.hasTypevarByName('V'))
					throw Error(`Typevar V not found`);

				var V = scope.getTypevarByName('V');

				if (!V.type.equals(new scope.Type({
					functional: true,
					from: [new scope.Type({
						functional: true,
						from: [cls],
						to: st
					})],
					to: st
				})))
					throw Error(`Wrong type for V`);

				if (yield_.right._type != 'funcall'
						|| yield_.right.fun != V)
					return false;

				var newvar = new scope.Typevar({
					type: cls,
					name: '$'
				});

				return new scope.Rule({
					name: `Ve[${rule.name}]`,
					params: rule.params.concat([newvar]),
					rules: [
						new scope.Yield({
							left: [],
							right: new scope.Funcall({
								fun: yield_.right.args[0],
								args: [newvar]
							})
						})
					]
				});
			}
		},
		cp: {
			get: (rules, scope) => {
				if (rules.length != 1) return false;
				var rule = rules[0];

				if (!scope.hasTypeByName('st'))
					throw Error(`Type st not found`);

				var st = scope.getTypeByName('st');

				var yield_ = rule.expr;

				if (yield_._type != 'yield')
					return false;

				if (!yield_.left.length)
					return false;

				if (!scope.hasTypevarByName('I'))
					throw Error(`Typevar I not found`);

				var I = scope.getTypevarByName('I');

				if (!I.type.equals(new scope.Type({
					functional: true,
					from: [st, st],
					to: st
				})))
					throw Error(`Wrong type for I`);

				return new scope.Rule({
					name: `cp[${rule.name}]`,
					params: rule.params,
					rules: [
						new scope.Yield({
							left: yield_.left.slice(0, yield_.left.length - 1),
							right: new scope.Funcall({
								fun: I,
								args: [
									yield_.left[yield_.left.length - 1],
									yield_.right
								]
							})
						})
					]
				});
			}
		}
	}
};