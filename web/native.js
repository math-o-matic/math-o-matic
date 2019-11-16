native = {
	ruleset: {
		tt: {
			get: (name, scope) => {
				if (typeof name != 'string')
					throw Error('Assertion failed');

				var args = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
				var nullary = ['T', 'F'].concat(args);
				var unary = ['N'];
				var binary = ['A', 'O', 'I', 'E', 'S'];

				var arityMap = {};
				nullary.forEach(e => arityMap[e] = 0);
				unary.forEach(e => arityMap[e] = 1);
				binary.forEach(e => arityMap[e] = 2);

				var usedArgs = Array(10).fill(false);

				// 1: 파싱 하기
				var stack = [];

				function lastIsFull() {
					if (!stack.length) return true;
					return arityMap[stack[stack.length - 1][0]] == stack[stack.length - 1].length - 1;
				}

				function push(token) {
					if (arityMap[token] == 0) {
						if (args.includes(token))
							usedArgs[args.indexOf(token)] = true;

						if (lastIsFull()) {
							stack.push([token]);
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
						return false;

					push(name[i]);
				}

				if (stack.length != 1) return false;

				if (!lastIsFull()) return false;

				for (var i = 0; i < usedArgs.length - 1; i++) {
					if (!usedArgs[i] && usedArgs[i + 1]) return false;
				}

				if (!usedArgs[0]) return false;

				var arglen = 10;

				for (var i = 0; i < usedArgs.length - 1; i++) {
					if (usedArgs[i] && !usedArgs[i + 1])
						arglen = i + 1;
				}

				var result = stack[0];

				// 2: 진리표 확인
				var tableRowLength = 2 ** arglen;

				var functionMap = {
					'N': p => !p,
					'A': (p, q) => p && q,
					'O': (p, q) => p || q,
					'I': (p, q) => !p || q,
					'E': (p, q) => p == q,
					'S': (p, q) => !(p && q)
				};

				var tableMap = {};

				for (var i = 0; i < arglen; i++) {
					tableMap[args[i]] = Array(tableRowLength).fill().map((_, j) => {
						return !!((j >> i) & 1);
					});
				}

				function makeTable(t) {
					if (t instanceof Array) {
						var tables = t.slice(1).map(makeTable);

						var arity = arityMap[t[0]];

						if (arity == 1) {
							return tables[0].map(v => functionMap[t[0]](v));
						}

						if (arity == 2) {
							return tables[0].map((v, i) => functionMap[t[0]](v, tables[1][i]));
						}

						throw Error('Assertion failed');
					}

					if (t == 'T') return Array(tableRowLength).fill(true);
					if (t == 'F') return Array(tableRowLength).fill(false);

					return tableMap[t];
				}

				if (!makeTable(result).every(e => e))
					return false;

				// 3: 노드 트리 만들기
				if (!scope.root.hasTypeByName('st'))
					throw Error(`Type st not found`);

				var st = scope.root.getTypeByName('st');

				var argTypevars = Array(arglen).fill().map((_, i) => {
					return new scope.Typevar({
						type: st,
						name: args[i]
					});
				});

				var typevarMap = {
					'T': 'T',
					'F': 'F',
					'N': 'N',
					'A': 'A',
					'O': 'O',
					'I': 'I',
					'E': 'E',
					'S': 'S'
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

					if (args.includes(t)) return argTypevars[args.indexOf(t)];
					return typevarMap[t];
				}

				var funcall = recurse(result);

				var yield_ = new scope.Yield({
					left: [],
					right: funcall
				});

				var rule = new scope.Rule({
					name: 'tt.' + name,
					params: argTypevars,
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
				
				if (!scope.hasTypeByName('class'))
					throw Error(`Type class not found`);

				var class_ = scope.getTypeByName('class');

				if (!rule.params[rule.params.length - 1].type.equals(class_))
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
						from: [class_],
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
											from: [class_],
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