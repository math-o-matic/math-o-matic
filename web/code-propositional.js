code = `
typedef St;

St verum;
St falsum;

St nand(St p, St q);

St not(St p) {
	nand(p, p)
}

St and(St p, St q) {
	not(nand(p, q))
}

St or(St p, St q) {
	nand(not(p), not(q))
}

St implies(St p, St q) {
	or(not(p), q)
}

St iff(St p, St q) {
	and(implies(p, q), implies(q, p))
}

native ruleset tt;

rule mp(St p, St q) {
	p, implies(p, q) |- q
}

rule _IpOpq(St p, St q) {
	tt.IpOpq(p, q)
}

rule _IpOpq_mp(St p, St q) {
	_IpOpq(p, q) ~ mp(p, or(p, q))
}

rule not_e(St p, St q) {
	tt.INpIpq(p, q)
}

rule not_e_mp(St p, St q) {
	not_e(p, q) ~ mp(not(p), implies(p, q))
}

rule botgen(St p) {
	tt.IApNpF(p)
}

rule botgen_mp(St p) {
	botgen(p) ~ mp(
		and(p, not(p)),
		falsum
	)
}

rule not_elim_n(St p) {
	not_e_mp(not(p), p)
}

rule or_i2(St p, St q) {
	tt.IqINpq(p, q)
}

rule or_i2_mp(St p, St q) {
	or_i2(p, q) ~ mp(q, implies(not(p), q))
}

rule demorgan(St p, St q) {
	tt.ENApqONpNq(p, q)
}

`;