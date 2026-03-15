---
name: trading
description: Market analysis and risk framework for evaluating thesis, analyzing plays, or discussing market conditions.
triggers:
  - trade
  - trading
  - thesis
  - play
  - market analysis
  - risk reward
  - position
  - entry
  - exit
  - bullish
  - bearish
---

# Trading

Market decision-making framework synthesized from decades of professional trading wisdom and probabilistic risk theory. This is a knowledge skill, not a trading system. No position tracking, no journaling, no database tables. Apply this framework when analyzing markets, evaluating thesis, or discussing potential plays.

For the complete ruleset, read `references/rules.md` (path relative to this skill folder).

## core philosophy

- Priorities: (1) long-term trend, (2) current pattern, (3) entry point
- Whatever position size feels right, halve it
- Capital preservation above all else: if you lose all your chips, you can't bet
- Combine extreme caution with small asymmetric bets (the barbell)

## thesis evaluation framework

Score each thesis against these filters. The more filters a thesis fails, the weaker it is.

1. **Trend alignment**: is the asset trending in the direction of the thesis?
2. **Risk-reward**: is the upside at least 3:1 vs downside? Ideally 5:1
3. **Invalidation defined**: at what specific level is the thesis wrong?
4. **Multiple confirmations**: do fundamentals + technicals + sentiment align?
5. **Not counter-trend** on the dominant timeframe
6. **Patience check**: is this a high-conviction setup or boredom trading?
7. **Asymmetry**: does the payoff have more upside than downside? Is the function convex?
8. **Ruin check**: can this play lead to irreversible loss? If any path to ruin exists, reject or restructure
9. **Fragility detection**: does the thesis break non-linearly under stress? Does it depend on specific predictions holding true?
10. **Turkey test**: is the thesis supported primarily by a track record of stability that could mask hidden tail risk?
11. **Skin in the game**: who is promoting this thesis and do they bear consequences for being wrong?
12. **Narrative fallacy**: is the thesis driven by a compelling story rather than structural payoff analysis?
13. **Lindy filter**: has the asset/protocol survived meaningful time and stress, or is it new and untested?
14. **Signal vs noise**: is the data operating on timeframes where signal dominates, or is it short-term noise?

## risk thinking

Quantitative thresholds to reference when discussing risk:

- **Per-trade risk**: never more than 1% of portfolio
- **Position sizing**: `risk_amount / (entry - stop) = size`; then halve it
- **Scale-in**: 50% at entry, 30% on confirmation, 20% on momentum
- **Stop loss**: 7-8% below entry as hard maximum
- **Drawdown response**: cut size at 5%, cut again at 8%, stop at 15%
- **Losing streak**: reduce size after 2+ consecutive losses
- **Monthly loss**: 10% drawdown means stop and reassess

## exit thinking

When discussing exits or when to get out:

- Price stops AND time stops: no movement in defined timeframe = exit
- Never average losers
- Never move a stop further from entry
- "When in doubt, get out"
- Weekend rule: close losing positions before weekends
- Let winners run: tighten stops as profit grows, don't take profits too early. Professionals go broke by taking small profits

## structural thinking

Key concepts to weave into market discussions:

- Crypto operates in Extremistan where single events dominate. Don't apply Gaussian thinking
- What to avoid matters more than what to pursue. Eliminating bad plays > finding clever ones
- **Optionality**: favor positions with capped downside and uncapped upside. Small bets, big potential
- Prefer assets/protocols that gain from volatility and stress over those that need calm
- **Survivorship bias**: for every successful narrative, there's a silent cemetery of identical setups that failed
- Overtrading causes more harm than inaction. Doing nothing is a valid position
- The facts you think matter for trading may not be the ones that actually matter. Practical knowledge > theoretical understanding

## psychology

Mental models to apply:

- The moment you think you're good is the moment you get hurt
- Most traders lose because they'd rather lose money than admit they're wrong
- Excitement is the wrong reason to trade
- Sitting out IS a position: no obligation to always have a take
- Evaluate decisions by process quality, not outcome
