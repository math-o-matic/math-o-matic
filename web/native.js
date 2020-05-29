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
				if (!scope.root.hasType('st'))
					throw Error(`Type st not found`);

				var st = scope.root.getType('st');

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

					if (!scope.root.hasTypevar(v))
						throw Error(`Typevar ${v} not found`);
					typevarMap[k] = scope.root.getTypevar(v);
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

				var tee = new scope.Tee({
					left: [],
					right: funcall
				});

				var rule = new scope.Rule({
					name: 'tt.' + name,
					params: typevars,
					expr: tee
				});

				return rule;
			}
		}
	},
	link: {
		Vi: {
			get: (rules, scope, ER) => {
				if (rules.length != 1) throw Error('wut');
				var rule = ER.expand1(rules[0]);

				if (!scope.hasType('st'))
					throw Error(`Type st not found`);

				var st = scope.getType('st');
				
				if (!scope.hasType('cls'))
					throw Error(`Type cls not found`);

				var cls = scope.getType('cls');

				if (!rule.params[rule.params.length - 1].type.equals(cls))
					throw Error('wut');

				var last = rule.params[rule.params.length - 1];

				var tee = ER.expand1(rule.expr);

				if (tee._type != 'tee')
					throw Error('wut');

				if (tee.left.length)
					throw Error('wut');

				if (!scope.hasTypevar('V'))
					throw Error(`Typevar V not found`);

				var V = scope.getTypevar('V');

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
					name: '<anonymous>',
					params: rule.params.slice(0, rule.params.length - 1),
					expr: new scope.Tee({
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
									expr: tee.right
								})
							]
						})
					})
				});
			}
		},
		Ve: {
			get: (rules, scope, ER) => {
				if (rules.length != 1) throw Error('wut');
				var rule = rules[0];

				if (!scope.hasType('st'))
					throw Error(`Type st not found`);

				var st = scope.getType('st');
				
				if (!scope.hasType('cls'))
					throw Error(`Type cls not found`);

				var cls = scope.getType('cls');

				var tee = ER.expand1(rule.expr);

				if (tee._type != 'tee')
					throw Error('wut');

				if (tee.left.length)
					throw Error('wut');

				if (!scope.hasTypevar('V'))
					throw Error(`Typevar V not found`);

				var V = scope.getTypevar('V');

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

				if (tee.right._type != 'funcall'
						|| tee.right.fun != V)
					throw Error('wut');

				var newvar = new scope.Typevar({
					type: cls,
					name: '$'
				});

				return new scope.Rule({
					name: `<anonymous>`,
					params: rule.params.concat([newvar]),
					expr: new scope.Tee({
						left: [],
						right: new scope.Funcall({
							fun: tee.right.args[0],
							args: [newvar]
						})
					})
				});
			}
		},
		cut: {
			get: (rules, scope, ER) => {
				return ER.chain(rules.map(ER.expand1));
			}
		},
		cp: {
			get: (rules, scope, ER) => {
				if (rules.length != 1) throw Error('wut');
				var rule = rules[0];

				if (!scope.hasType('st'))
					throw Error(`Type st not found`);

				var st = scope.getType('st');

				var tee = ER.expand1(rule);

				if (tee._type != 'tee')
					throw Error('wut');

				if (!tee.left.length)
					throw Error('wut');

				if (!scope.hasTypevar('I'))
					throw Error(`Typevar I not found`);

				var I = scope.getTypevar('I');

				if (!I.type.equals(new scope.Type({
					functional: true,
					from: [st, st],
					to: st
				})))
					throw Error(`Wrong type for I`);

				return new scope.Tee({
					left: tee.left.slice(0, tee.left.length - 1),
					right: new scope.Funcall({
						fun: I,
						args: [
							tee.left[tee.left.length - 1],
							tee.right
						]
					})
				});
			}
		}
	}
};