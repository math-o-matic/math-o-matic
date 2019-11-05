function Program(start) {
	this.scope = new Scope(null);
	
	this.scope.addTypeByName('St');

	start.forEach(line => {
		switch (line._type) {
			case 'typedef':
				this.scope.addTypeByName(line.type.name);
				break;
			case 'defv':
				this.scope.addTypevar(line.typevar);
				break;
			case 'defun':
				this.scope.addFun(line);
				break;
			case 'defrule':
				this.scope.addRule(line);
				break;
			case 'deflink':
				this.scope.addLink(line);
				break;
			default:
				throw Error(`Unknown line type ${line._type}`);
		}
	});
}

function Type() {
}

Type.prototype.equals = function (t) {
	if (!(t instanceof Type)) return false;
	if ((this instanceof SimpleType) != (t instanceof SimpleType))
		return false;
	if (this instanceof SimpleType)
		return this === t;
	if (this instanceof FunctionType) {
		if (this.from.length != t.from.length) return false;
		for (var i = 0; i < this.from.length; i++)
			if (!this.from[i].equals(t.from[i])) return false;
		return this.to.equals(t.to);
	}
}

function getType(obj) {
	if (!obj.ftype) return new SimpleType(obj.name);
	return new FunctionType(obj.from.map(getType), getType(obj.to));
}

function SimpleType(name) {
	if (typeof name != 'string') throw Error();
	this.name = name;
}

SimpleType.prototype = Object.create(Type.prototype);
SimpleType.prototype.constructor = SimpleType;

SimpleType.prototype.toString = function () {
	return this.toIndentedString(0);
};

SimpleType.prototype.toIndentedString = function (indent) {
	return this.name;
}

SimpleType.prototype.toTeXString = function () {
	return `\\mathrm{${this.name}}`;
}

function FunctionType(from, to) {
	if (from.map(f => f instanceof Type).some(e => !e)) throw Error();
	if (!(to instanceof Type)) throw Error();
	this.from = from;
	this.to = to;
}

FunctionType.prototype = Object.create(Type.prototype);
FunctionType.prototype.constructor = FunctionType;

FunctionType.prototype.toString = function () {
	return this.toIndentedString(0);
};

FunctionType.prototype.toIndentedString = function (indent) {
	return '[' + this.from.join(', ') + ' -> ' + this.to + ']';
}

FunctionType.prototype.toTeXString = function () {
	return `\\left[${this.from.map(e => e.toTeXString()).join(' \\times ')}`
		+ ` \\to ${this.to.toTeXString()} \\right]`;
}

function Typevar(type, name) {
	this.type = type;
	this.name = name;
}

Typevar.prototype.toString = function () {
	return this.toIndentedString(0);
}

Typevar.prototype.toIndentedString = function () {
	return `${this.type} ${this.name}`;
}

Typevar.prototype.toTeXString = function () {
	if (this.name.length == 1) {
		return `${this.name}`;
	}

	return `\\mathrm{${this.name}}`;
}

function Link({name, params, rules}) {
	this.name = name;
	this.params = params;
	this.rules = rules;

	// all yields
	var expands = this.rules.map(expand1);

	var expr = expands.reduce((l, r) => {
		for (var i = 0; i < r.left.length; i++) {
			if (expr0Equals(l.right, r.left[i])) {
				var newleft = r.left.slice(0, i)
					.concat(l.left)
					.concat(r.left.slice(i + 1));

				return new Yield({
					left: newleft.map(expand0Funcalls),
					right: expand0Funcalls(r.right)
				});
			}
		}

		throw Error(`Link ${name} failed:\n\n${l},\n\n${r}\n`);
	});

	this.result = expr;
}

Link.prototype.toString = function () {
	return this.toIndentedString(0);
}

Link.prototype.toIndentedString = function (indent) {
	return [
		`L ${this.name}(${this.params.join(', ')}) =>`,
		'\t\t' + this.rules
			.map(e => e.toIndentedString(indent + 2))
			.join('\n' + '\t'.repeat(indent + 1) + '~' + '\n' + '\t'.repeat(indent + 2)),
		`\t=`,
		'\t\t' + this.result.toIndentedString(indent + 2)
	].join('\n' + '\t'.repeat(indent));
}

Link.prototype.toTeXString = function () {
	return `\\mathsf{${this.name}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')})`;
}

Link.fromObj = function (obj, parentScope) {
	var scope = new Scope(parentScope);

	var name = obj.name;
	var params = obj.params.map(tvo => {
		if (!scope.hasType(tvo.type))
			throw Error(`Param type ${getType(tvo.type)} not found`);

		if (scope.hasOwnTypevarByName(tvo.name))
			throw Error(`Param name ${tvo.name} already is there`);

		return scope.addTypevar(tvo);
	});

	var foo = obj => {
		switch (obj._type) {
			case 'yield':
				return Yield.fromObj(obj, scope);
			case 'rulecall':
				return Rulecall.fromObj(obj, scope);
			default:
				throw Error(`Unknown type ${obj._type}`);
		}
	};

	var rules = obj.rules.map(foo);

	return new Link({name, params, rules});
}

function Rule({name, params, expr}) {
	this.name = name;
	this.params = params;
	this.expr = expr;
}

Rule.prototype.toString = function () {
	return this.toIndentedString(0);
}

Rule.prototype.toIndentedString = function (indent) {
	return [
		`R ${this.name}(${this.params.join(', ')}) =>`,
		`\t${this.expr.toIndentedString(indent + 1)}`
	].join('\n' + '\t'.repeat(indent));
}

Rule.prototype.toTeXString = function () {
	return `\\mathsf{${this.name}}`
		+ `(${this.params.map(e => e.toTeXString()).join(', ')})`
		+ `:= ` + this.expr.toTeXString();
}

Rule.fromObj = function (obj, parentScope) {
	var scope = new Scope(parentScope);

	var name = obj.name;
	var params = obj.params.map(tvo => {
		if (!scope.hasType(tvo.type))
			throw Error(`Param type ${getType(tvo.type)} not found`);

		if (scope.hasOwnTypevarByName(tvo.name))
			throw Error(`Param name ${tvo.name} already is there`);

		return scope.addTypevar(tvo);
	});

	var expr = null;

	switch (obj.expr._type) {
		case 'yield':
			expr = Yield.fromObj(obj.expr, scope);
			break;
		case 'rulecall':
			expr = Rulecall.fromObj(obj.expr, scope);
			break;
		default:
			throw Error(`Unknown type ${obj.expr._type}`);
	}

	return new Rule({name, params, expr});
}

function Yield({left, right}) {
	if (!left || !right) throw Error('Missing required argument');

	// remove duplicates
	this.left = left.reduce((l, r) => {
		for (var i = 0; i < l.length; i++)
			if (expr0Equals(l[i], r)) return l;

		return l.push(r), l;
	}, []);

	this.right = right;
}

Yield.fromObj = function (obj, parentScope) {
	var scope = new Scope(parentScope);

	var foo = obj => {
		switch (obj._type) {
			case 'funcall':
				var funcall = Funcall.fromObj(obj, scope);
				if (!scope.root.getTypeByName('St').equals(funcall.type))
					throw Error(`Return type is not St: ${funcall.type}`);
				return funcall;
			case 'funexpr':
				var fun = Fun.fromObj(obj, scope);
				if (!scope.root.getTypeByName('St').equals(fun.type))
					throw Error(`Return type is not St: ${fun.type}`);
				return fun;
			case 'var':
				if (!scope.hasTypevarByName(obj.name))
					throw Error(`Undefined identifier ${obj.name}`);
				var typevar = scope.getTypevarByName(obj.name);
				if (!scope.root.getTypeByName('St').equals(typevar.type)) {
					throw Error(`Return type is not St: ${typevar.type}`);
				}
				return typevar;
			default:
				throw Error(`Unknown type ${obj._type}`);
		}
	};

	var left = obj.left.map(foo);
	var right = foo(obj.right);

	return new Yield({left, right});
}

Yield.prototype.toString = function () {
	return this.toIndentedString(0);
}

Yield.prototype.toIndentedString = function (indent) {
	if (!this.left.length) {
		return '|- ' + (
			this.right instanceof Typevar
			? this.right.name
			: this.right.toIndentedString(indent)
		);
	}

	return [
		this.left.map(e => (
			e instanceof Typevar
			? e.name
			: e.toIndentedString(indent)
		)).join(',\n' + '\t'.repeat(indent)),
		'|-',
		'\t' + (
			this.right instanceof Typevar
			? this.right.name
			: this.right.toIndentedString(indent + 1)
		)
	].join('\n' + '\t'.repeat(indent));
}

Yield.prototype.toTeXString = function () {
	return `${this.left.map(e => e.toTeXString()).join(', ')} \\vdash ${this.right.toTeXString()}`;
}

function Rulecall({rule, args}) {
	if (!rule || !args) throw Error('Missing required argument');
	this.rule = rule;
	this.args = args;
}

Rulecall.prototype.toString = function () {
	return this.toIndentedString(0);
}

Rulecall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		var args = this.args.map(arg => {
			if (arg instanceof Typevar) return arg.name;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.rule.name}(`,
			args,
			`)`
		].join('')
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.rule.name}(`,
			'\t' + args,
			`)`
		].join('\n' + '\t'.repeat(indent));
	}
}

Rulecall.prototype.toTeXString = function () {
	return `\\mathrm{${this.rule.name}}(${this.args.map(e => e.toTeXString()).join(', ')})`
}

Rulecall.fromObj = function (obj, parentScope) {
	var scope = new Scope(parentScope);

	if (!scope.hasRuleByName(obj.name))
		throw Error(`Rule ${obj.name} is not defined`);

	var rule = scope.getRule(obj.name);

	var foo = obj => {
		switch (obj._type) {
			case 'funcall':
				var funcall = Funcall.fromObj(obj, scope);
				return funcall;
			case 'funexpr':
				var fun = Fun.fromObj(obj, scope);
				return fun;
			case 'var':
				if (!scope.hasTypevarByName(obj.name))
					throw Error(`Undefined identifier ${obj.name}`);
				var typevar = scope.getTypevarByName(obj.name);
				return typevar;
			default:
				throw Error(`Unknown type ${obj._type}`);
		}
	};

	return new Rulecall({
		rule,
		args: obj.args.map(foo)
	});
}

function Fun({anonymous, name, type, atomic, params, expr}) {
	if (!atomic && (!params || !expr))
		throw Error(`Non-atomic function without params or expr`);
	this.anonymous = anonymous;
	this.name = anonymous ? '<anonymous>' : name;
	this.type = type;
	this.atomic = atomic;
	this.params = params;
	this.expr = expr;
}

Fun.prototype.toString = function () {
	return this.toIndentedString(0);
};

Fun.prototype.toIndentedString = function (indent) {
	if (!this.expr)
		return `${this.anonymous ? '' : 'ƒ ' + this.type.to + ' ' + this.name}`
			+ `(${this.params.join(', ')});`;

	return [
		`${this.anonymous ? '' : 'ƒ ' + this.type.to + ' ' + this.name}`
			+ `(${this.params.join(', ')}) => (`,
		`\t${this.expr.toIndentedString(indent + 1)}`,
		')'
	].join('\n' + '\t'.repeat(indent));
}

Fun.prototype.toTeXString = function () {
	if (this.anonymous)
		return `\\left(`
			+ (
				this.params.length == 1
				? this.params[0].toTeXString()
				: `\\left(${this.params.map(e => e.toTeXString()).join(', ')}\\right)`
			)
			+ `\\mapsto ${this.expr.toTeXString()}\\right)`;

	if (!this.expr)
		return this.funcallToTeXString(this.params);

	return this.funcallToTeXString(this.params)
			+ `:= ${this.expr.toTeXString()}`;
}

Fun.prototype.funcallToTeXString = function (args) {
	var args = args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toTeXString();
	});

	return `${this.anonymous
			? '(' + this.toTeXString() + ')'
			: `${this.name.length == 1 ? this.name : `\\mathrm{${this.name}}`}`}`
		+ `(${args.join(', ')})`;
}

Fun.fromObj = function (obj, parentScope) {
	var anonymous = null;
	var name = null;
	var type = null;
	var atomic = null;
	var params = null;
	var expr = null;
	var scope = new Scope(parentScope);

	switch (obj._type) {
		case 'defun':
			anonymous = false;
			name = obj.name;

			if (!scope.hasType(obj.rettype))
				throw Error(`Rettype ${obj.rettype} not found`);

			var rettype = scope.getType(obj.rettype);

			params = obj.params.map(tvo => {
				if (!scope.hasType(tvo.type))
					throw Error(`Param type ${getType(tvo.type)} not found`);

				if (scope.hasOwnTypevarByName(tvo.name))
					throw Error(`Param name ${tvo.name} already is there`);

				return scope.addTypevar(tvo);
			});

			type = new FunctionType(params.map(typevar => typevar.type), rettype);

			atomic = !obj.expr;

			if (obj.expr) {
				switch (obj.expr._type) {
					case 'funcall':
						var funcall = Funcall.fromObj(obj.expr, scope);
						if (!rettype.equals(funcall.type))
							throw Error(`Return type mismatch: ${rettype}, ${funcall.type}`);
						expr = funcall;
						break;
					case 'funexpr':
						var fun = Fun.fromObj(obj.expr, scope);
						if (!rettype.equals(fun.type))
							throw Error(`Return type mismatch: ${rettype}, ${fun.type}`);
						expr = fun;
						break;
					case 'var':
						if (!scope.hasTypevarByName(obj.expr.name))
							throw Error(`Undefined identifier ${obj.expr.name}`);
						var typevar = scope.getTypevarByName(obj.expr.name);
						if (!rettype.equals(typevar.type)) {
							throw Error(`Wrong return type ${rettype}`);
						}
						expr = typevar;
						break;
					default:
						throw Error(`Unknown type ${obj.expr._type}`);
				}
			}
			break;
		case 'funexpr':
			anonymous = true;

			params = obj.params.map(tvo => {
				if (!scope.hasType(tvo.type))
					throw Error(`Param type ${getType(tvo.type)} not found`);

				if (scope.hasOwnTypevarByName(tvo.name))
					throw Error(`Param name ${tvo.name} already is there`);

				return scope.addTypevar(tvo);
			});

			atomic = false;

			var rettype;

			switch (obj.expr._type) {
				case 'funcall':
					var funcall = Funcall.fromObj(obj.expr, scope);
					rettype = funcall.type;
					expr = funcall;
					break;
				case 'funexpr':
					var fun = Fun.fromObj(obj.expr, scope);
					rettype = fun.type;
					expr = fun;
					break;
				case 'var':
					if (!scope.hasTypevarByName(obj.expr.name))
						throw Error(`Undefined identifier ${obj.expr.name}`);
					var typevar = scope.getTypevarByName(obj.expr.name);
					rettype = typevar.type;
					expr = typevar;
					break;
				default:
					throw Error(`Unknown type ${obj.expr._type}`);
			}

			type = new FunctionType(
				params.map(typevar => typevar.type),
				rettype
			);

			break;
		default:
			throw Error(`Unknown type ${obj._type}`);
			break;
	}

	return new Fun({anonymous, name, type, atomic, params, expr});
}

function Funcall({fun, args}) {
	if (!fun || !args) throw Error('Missing required argument');
	this.fun = fun;
	this.type = fun.type.to;
	this.args = args;
}

Funcall.prototype.toString = function () {
	return this.toIndentedString(0);
}

Funcall.prototype.toIndentedString = function (indent) {
	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toIndentedString(indent + 1);
	});

	if (args.join('').length <= 50) {
		var args = this.args.map(arg => {
			if (arg instanceof Typevar) return arg.name;
			return arg.toIndentedString(indent);
		});

		args = args.join(', ');

		return [
			`${this.fun.anonymous ? '(' + this.fun + ')' : this.fun.name}(`,
			args,
			`)`
		].join('')
	}
	else {
		args = args.join(',\n' + '\t'.repeat(indent + 1));

		return [
			`${this.fun.anonymous ? '(' + this.fun + ')' : this.fun.name}(`,
			'\t' + args,
			`)`
		].join('\n' + '\t'.repeat(indent));
	}
}

Funcall.prototype.toTeXString = function () {
	if (this.fun instanceof Fun)
		return this.fun.funcallToTeXString(this.args);

	var args = this.args.map(arg => {
		if (arg instanceof Typevar) return arg.name;
		return arg.toTeXString();
	});

	return `${this.fun.anonymous
			? '(' + this.fun.toTeXString() + ')'
			: `${this.fun.name.length == 1 ? this.fun.name : `\\mathrm{${this.fun.name}}`}`}`
		+ `(${args.join(', ')})`;
}

Funcall.fromObj = function (obj, parentScope) {
	var fun = null;
	var args = null;
	var scope = new Scope(parentScope);

	switch (obj.fun._type) {
		case 'funcall':
			var funcall = Funcall.fromObj(obj.fun, scope);
			fun = funcall;
			break;
		case 'funexpr':
			fun = Fun.fromObj(obj.fun, scope);
			break;
		case 'var':
			if (!scope.hasTypevarByName(obj.fun.name))
				throw Error(`Undefined identifier ${obj.fun.name}`);
			fun = scope.getTypevarByName(obj.fun.name);
			if (!(fun.type instanceof FunctionType))
				throw Error(`${fun.name} is not callable`);
			break;
		default:
			throw Error(`Unknown type ${fun._type}`);
	}

	args = obj.args.map((arg, i) => {
		switch (arg._type) {
			case 'funcall':
				return Funcall.fromObj(arg, scope);
			case 'funexpr':
				return Fun.fromObj(arg, scope);
			case 'var':
				if (!scope.hasTypevarByName(arg.name))
					throw Error(`Undefined identifier ${arg.name}`);
				return scope.getTypevarByName(arg.name);
			default:
				throw Error(`Unknown type ${obj.expr._type}`);
		}
	});

	if (args.length != fun.type.from.length)
		throw Error(`Invalid number of arguments: ${obj.args.length}`);

	for (var i = 0; i < args.length; i++)
		if (!args[i].type.equals(fun.type.from[i]))
			throw Error(`Argument type mismatch: ${args[i].type}, ${fun.type.from[i]}`);

	return new Funcall({fun, args});
}

function substitute0(expr, map) {
	if (expr instanceof Funcall) {
		var fun2 = map(expr.fun) || expr.fun;
		var args2 = expr.args.map(arg => substitute0(arg, map));
		return new Funcall({
			fun: fun2,
			args: args2
		});
	} else if (expr instanceof Fun) {
		if (!(expr instanceof Fun) || expr.atomic) return map(expr) || expr;
		if (expr.params.map(p => p == expr).some(e => e))
			throw Error(`Duplicate parameter found`);
		var expr2 = substitute0(expr.expr, map);
		return new Fun({
			anonymous: true,
			type: expr.type,
			atomic: false,
			params: expr.params,
			expr: expr2
		});
	} else {
		return map(expr) || expr;
	}
}

function substitute1(expr, map) {
	if (expr instanceof Rulecall) {
		var rule = expr.rule;
		var args = expr.args.map(arg => substitute0(arg, map));
		return new Rulecall({
			rule, args
		});
	} else if (expr instanceof Yield) {
		var left = expr.left.map(e => substitute0(e, map));
		var right = substitute0(expr.right, map);

		return new Yield({
			left, right
		});
	} else throw Error(`wut`);
}

function expand0Funcalls(expr) {
	if (expr instanceof Funcall) {
		var fun = expand0Funcalls(expr.fun);
		var args = expr.args.map(expand0Funcalls);

		if (!fun.anonymous)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return expand0Funcalls(substitute0(fun.expr, map));
	} else {
		return expr;
	}
}

function expand0(expr) {
	if (expr instanceof Funcall) {
		var fun = expand0(expr.fun);
		var args = expr.args.map(expand0);

		if (!(fun instanceof Fun) || fun.atomic)
			return new Funcall({fun, args});

		var map = param => args[fun.params.indexOf(param)];

		return expand0(substitute0(fun.expr, map));
	} else if (expr instanceof Fun && !expr.atomic) {
		var expr2 = expand0(expr.expr);
		return new Fun({
			anonymous: true,
			type: expr.type,
			atomic: false,
			params: expr.params,
			expr: expr2
		});
	} else {
		return expr;
	}
}

// expand0은 하지 않음. rule 단계에서만 풀음.
function expand1(expr) {
	if (expr instanceof Rulecall) {
		var rule = expr.rule;
		var args = expr.args;

		var map = param => args[rule.params.indexOf(param)];

		return expand1(substitute1(rule.expr, map));
	} else if (expr instanceof Yield) {
		return expr;
	} else if (expr instanceof Rule) {
		var expr2 = expand1(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

// expr0의 funcall까지 풀음.
function expand1Funcalls(expr) {
	if (expr instanceof Rulecall) {
		var rule = expr.rule;
		var args = expr.args.map(expand0Funcalls);

		var map = param => args[rule.params.indexOf(param)];

		return expand1Funcalls(substitute1(rule.expr, map));
	} else if (expr instanceof Yield) {
		var left = expr.left.map(expand0Funcalls);
		var right = expand0Funcalls(expr.right);
		return new Yield({left, right});
	} else if (expr instanceof Rule) {
		var expr2 = expand1Funcalls(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

// expr0까지 최대로 풀음.
function expand1Full(expr) {
	if (expr instanceof Rulecall) {
		var rule = expr.rule;
		var args = expr.args.map(expand0);

		var map = param => args[rule.params.indexOf(param)];

		return expand1(substitute1(rule.expr, map));
	} else if (expr instanceof Yield) {
		var left = expr.left.map(expand0);
		var right = expand0(expr.right);
		return new Yield({left, right});
	} else if (expr instanceof Rule) {
		var expr2 = expand1(expr.expr);
		return new Rule({
			name: '<anonymous>',
			params: expr.params,
			expr: expr2
		})
	} else throw Error(`Unknown expr1`);
}

function expr0Equals(a, b) {
	a = expand0(a);
	b = expand0(b);

	if ((a instanceof Funcall) != (b instanceof Funcall)) return false;

	if (a instanceof Funcall) {
		if (a.fun != b.fun) return false;

		for (var i = 0; i < a.args.length; i++)
			if (!expr0Equals(a.args[i], b.args[i])) return false;
		return true;
	}

	if (a.type instanceof FunctionType && b.type instanceof FunctionType) {
		if (!a.type.equals(b.type)) return false;
		
		var placeholders = Array(a.type.from.length).fill().map((_, i) =>
			new Typevar(a.type.from[i], '$'));

		return expr0Equals(
			new Funcall({
				fun: a,
				args: placeholders
			}),
			new Funcall({
				fun: b,
				args: placeholders
			})
		);
	}

	return a == b;
}

function Scope(parent) {
	this.simpleTypeMap = {};
	this.typevarMap = {};
	this.ruleMap = {};
	this.linkMap = {};

	this.parent = parent;
	this.root = parent ? parent.root : this;
}

Scope.prototype.hasOwnTypeByName = function (name) {
	return !!this.simpleTypeMap[name];
}

Scope.prototype.hasOwnType = function (typeobj) {
	if (!typeobj.ftype) return this.hasOwnTypeByName(typeobj.name);
	return typeobj.from.map(e => this.hasOwnType(e)).every(e => e)
			&& this.hasOwnType(typeobj.to);
}

Scope.prototype.hasTypeByName = function (name) {
	return this.hasOwnTypeByName(name)
		|| (!!this.parent && this.parent.hasTypeByName(name));
}

Scope.prototype.hasType = function (typeobj) {
	if (!typeobj.ftype) return this.hasTypeByName(typeobj.name);
	return typeobj.from.map(e => this.hasType(e)).every(e => e)
			&& this.hasType(typeobj.to);
}

Scope.prototype.addTypeByName = function (name) {
	if (this.hasOwnTypeByName(name))
		throw Error(`Type with name ${name} already is there`);

	var type = new SimpleType(name);
	this.simpleTypeMap[name] = type;
	return type;
}

Scope.prototype.getType = function (typeobj) {
	if (!typeobj.ftype) return this.getTypeByName(typeobj.name);
	return new FunctionType(typeobj.from.map(e => this.getType(e)), this.getType(typeobj.to));
}

Scope.prototype.getTypeByName = function (name) {
	if (!this.hasTypeByName(name))
		throw Error(`Type with name ${name} not found`);

	return this.simpleTypeMap[name] ||
		(!!this.parent && this.parent.getTypeByName(name));
}

Scope.prototype.hasOwnTypevarByName = function (name) {
	return !!this.typevarMap[name];
}

Scope.prototype.hasTypevarByName = function (name) {
	return this.hasOwnTypevarByName(name) ||
		(!!this.parent && this.parent.hasTypevarByName(name));
}

Scope.prototype.addTypevar = function (typevarobj) {
	if (this.hasOwnTypevarByName(typevarobj.name))
		throw Error(`Var with name ${typevarobj.name} already is there`);

	if (!this.hasType(typevarobj.type))
		throw Error(`Type ${typevarobj.type} not found`);

	var type = this.getType(typevarobj.type);

	var typevar = new Typevar(type, typevarobj.name);
	this.typevarMap[typevarobj.name] = typevar;

	return typevar;
}

Scope.prototype.getTypevarByName = function (name) {
	if (!this.hasTypevarByName(name))
		throw Error(`Var with name ${name} not found`);

	return this.typevarMap[name] ||
		(!!this.parent && this.parent.getTypevarByName(name));
}

Scope.prototype.addFun = function (obj) {
	var fun = Fun.fromObj(obj, this);

	if (!fun.anonymous && this.hasOwnTypevarByName(fun.name))
		throw Error(`Var with name ${fun.name} already is there`);

	this.typevarMap[fun.name] = fun;

	return fun;
}

Scope.prototype.hasOwnRuleByName = function (name) {
	return !!this.ruleMap[name];
}

Scope.prototype.hasRuleByName = function (name) {
	return this.hasOwnRuleByName(name)
		|| (!!this.parent && this.parent.hasRuleByName(name));
}

Scope.prototype.addRule = function (defruleobj) {
	var rule = Rule.fromObj(defruleobj, this);

	if (this.hasOwnRuleByName(rule.name))
		throw Error(`Rule with name ${rule.name} already is there`);

	this.ruleMap[rule.name] = rule;

	return rule;
}

Scope.prototype.getRule = function (name) {
	if (!this.hasRuleByName(name))
		throw Error(`Rule with name ${name} not found`);

	return this.ruleMap[name] ||
		(!!this.parent && this.parent.getRule(name));
}

Scope.prototype.hasOwnLinkByName = function (name) {
	return !!this.linkMap[name];
}

Scope.prototype.hasLinkByName = function (name) {
	return this.hasOwnLinkByName(name)
		|| (!!this.parent && this.parent.hasLinkByName(name));
}

Scope.prototype.addLink = function (deflinkobj) {
	var link = Link.fromObj(deflinkobj, this);

	if (this.hasOwnLinkByName(link.name))
		throw Error(`Link with name ${name} already is there`);

	this.linkMap[link.name] = link;

	return link;
}

Scope.prototype.getLink = function (name) {
	if (!this.hasLinkByName(name))
		throw Error(`Link with name ${name} not found`);

	return this.linkMap[name] ||
		(!!this.parent && this.parent.getLink(name));
}

function process(start) {
	var program = new Program(start);
	return program;
}

module.exports = process;