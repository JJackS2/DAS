# Skill: Statistical Analysis Engine

## Purpose
Perform structured statistical analysis for Samsung account-based appliance expansion.

## CORE CAPABILITIES

1. Data Understanding
   - Identify tables, keys, time origin
   - Check missingness, duplicates, coverage

2. Descriptive Statistics
   - Conditional summaries (no global averages without conditioning)
   - Time trends
   - Segmentation

3. Baseline Models
   - OLS (continuous outcome)
   - Logistic regression (binary adoption)
   - Poisson / Negative Binomial (count expansion)
   - Kaplan-Meier
   - Cox proportional hazards

4. Model Comparison
   - Nested: Likelihood Ratio Test
   - ΔAIC / ΔBIC
   - Cross-validation (log-loss/AUC)
   - Multicollinearity (VIF)

5. Robustness Checks
   - Alternate specification
   - Exclude influential observations
   - Bootstrap stability
   - Alternate time window

6. Multiple Testing Control
   - Define hypothesis family
   - BH or Bonferroni correction

7. Reporting
   - Identified vs Non-identifiable
   - Assumptions
   - Structural limitations

## TOOL USAGE POLICY

BigQuery:
- Extraction, aggregation, feature engineering
- Output model-ready table only

Python:
- statsmodels (OLS, GLM)
- lifelines (Cox/KM)
- sklearn (regularization, CV)
- matplotlib (visualization)

Do not introduce advanced libraries unless Level 4 is reached.

## DECISION TREE PRINCIPLE

Always align:
Estimand → Model Class → Diagnostics → Robustness → Interpretation

Never reverse this order.
