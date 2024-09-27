 -- Insert default goal templates
INSERT INTO goal_templates (title, description, goal_type, specific_goal_type, default_target_amount, default_duration_days, is_recurring, default_recurrence_pattern)
VALUES
    ('Increase Monthly Revenue', 'Boost your business monthly revenue', 'financial', 'revenue', 10000, 30, true, 'monthly'),
    ('Reduce Monthly Expenses', 'Cut down on unnecessary business expenses', 'financial', 'expense_reduction', 5000, 30, true, 'monthly'),
    ('Improve Profit Margin', 'Increase your overall profit margin', 'financial', 'profit_margin', 20, 90, false, null),
    ('Maintain Positive Cash Flow', 'Ensure a healthy cash flow for your business', 'financial', 'cash_flow', 15000, 30, true, 'monthly'),
    ('Build Emergency Fund', 'Set aside money for unexpected business expenses', 'financial', 'savings_investment', 50000, 365, false, null),
    ('Pay Off Business Loan', 'Repay your outstanding business loan', 'financial', 'debt_repayment', 100000, 365, false, null),
    ('Quarterly Sales Target', 'Achieve a specific sales goal for the quarter', 'financial', 'revenue', 300000, 90, true, 'quarterly'),
    ('Annual Cost Reduction', 'Reduce overall costs by a certain percentage', 'financial', 'expense_reduction', 50000, 365, false, null),
    ('Increase Customer Lifetime Value', 'Boost the average customer lifetime value', 'financial', 'revenue', 5000, 180, false, null),
    ('Improve Accounts Receivable Turnover', 'Reduce the time it takes to collect payments', 'financial', 'cash_flow', 30, 90, true, 'quarterly');

-- Insert default milestone templates for each goal template
-- Increase Monthly Revenue
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Increase Monthly Revenue'), 'Week 1 Target', 'Reach 25% of the monthly revenue goal', 25, 7),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Monthly Revenue'), 'Mid-Month Check', 'Achieve 50% of the monthly revenue goal', 50, 15),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Monthly Revenue'), 'Week 3 Push', 'Attain 75% of the monthly revenue goal', 75, 22),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Monthly Revenue'), 'Final Week Sprint', 'Complete the monthly revenue goal', 100, 30);

-- Reduce Monthly Expenses
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Reduce Monthly Expenses'), 'Initial Cuts', 'Implement first round of cost-cutting measures', 25, 7),
    ((SELECT id FROM goal_templates WHERE title = 'Reduce Monthly Expenses'), 'Midpoint Review', 'Evaluate and adjust cost-cutting strategies', 50, 15),
    ((SELECT id FROM goal_templates WHERE title = 'Reduce Monthly Expenses'), 'Fine-tuning', 'Make final adjustments to reach the goal', 75, 22),
    ((SELECT id FROM goal_templates WHERE title = 'Reduce Monthly Expenses'), 'Goal Completion', 'Achieve the full expense reduction target', 100, 30);

-- Improve Profit Margin
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Improve Profit Margin'), 'Analysis Phase', 'Identify areas for margin improvement', 0, 15),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Profit Margin'), 'Implementation', 'Put new strategies into action', 50, 45),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Profit Margin'), 'Evaluation', 'Assess the impact of new strategies', 75, 75),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Profit Margin'), 'Final Adjustment', 'Make final tweaks to reach the target margin', 100, 90);

-- Maintain Positive Cash Flow
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Maintain Positive Cash Flow'), 'Week 1 Balance', 'Ensure positive cash flow for week 1', 25, 7),
    ((SELECT id FROM goal_templates WHERE title = 'Maintain Positive Cash Flow'), 'Mid-Month Status', 'Maintain positive cash flow through day 15', 50, 15),
    ((SELECT id FROM goal_templates WHERE title = 'Maintain Positive Cash Flow'), 'Week 3 Check', 'Keep cash flow positive entering final week', 75, 22),
    ((SELECT id FROM goal_templates WHERE title = 'Maintain Positive Cash Flow'), 'Month-End Goal', 'Achieve the full monthly cash flow target', 100, 30);

-- Build Emergency Fund
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Build Emergency Fund'), 'Initial Savings', 'Save the first 25% of the emergency fund', 25, 90),
    ((SELECT id FROM goal_templates WHERE title = 'Build Emergency Fund'), 'Halfway Point', 'Reach 50% of the emergency fund goal', 50, 180),
    ((SELECT id FROM goal_templates WHERE title = 'Build Emergency Fund'), 'Third Quarter', 'Achieve 75% of the emergency fund target', 75, 270),
    ((SELECT id FROM goal_templates WHERE title = 'Build Emergency Fund'), 'Full Fund', 'Complete the emergency fund goal', 100, 365);

-- Pay Off Business Loan
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Pay Off Business Loan'), 'First Quarter', 'Pay off 25% of the loan', 25, 90),
    ((SELECT id FROM goal_templates WHERE title = 'Pay Off Business Loan'), 'Halfway Mark', 'Reach 50% loan repayment', 50, 180),
    ((SELECT id FROM goal_templates WHERE title = 'Pay Off Business Loan'), 'Third Quarter', 'Achieve 75% loan repayment', 75, 270),
    ((SELECT id FROM goal_templates WHERE title = 'Pay Off Business Loan'), 'Final Payment', 'Complete loan repayment', 100, 365);

-- Quarterly Sales Target
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Quarterly Sales Target'), 'Month 1 Goal', 'Achieve one-third of quarterly sales target', 33, 30),
    ((SELECT id FROM goal_templates WHERE title = 'Quarterly Sales Target'), 'Mid-Quarter Check', 'Reach two-thirds of quarterly sales target', 66, 60),
    ((SELECT id FROM goal_templates WHERE title = 'Quarterly Sales Target'), 'Final Push', 'Complete the quarterly sales target', 100, 90);

-- Annual Cost Reduction
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Annual Cost Reduction'), 'Q1 Reduction', 'Implement initial cost-cutting measures', 25, 90),
    ((SELECT id FROM goal_templates WHERE title = 'Annual Cost Reduction'), 'Mid-Year Review', 'Evaluate progress and adjust strategies', 50, 180),
    ((SELECT id FROM goal_templates WHERE title = 'Annual Cost Reduction'), 'Q3 Assessment', 'Fine-tune cost reduction efforts', 75, 270),
    ((SELECT id FROM goal_templates WHERE title = 'Annual Cost Reduction'), 'Year-End Goal', 'Achieve the full annual cost reduction target', 100, 365);

-- Increase Customer Lifetime Value
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Increase Customer Lifetime Value'), 'Strategy Development', 'Develop strategies to increase CLV', 0, 30),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Customer Lifetime Value'), 'Implementation', 'Put CLV improvement strategies into action', 25, 60),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Customer Lifetime Value'), 'Mid-Point Evaluation', 'Assess initial impact and adjust', 50, 120),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Customer Lifetime Value'), 'Continued Optimization', 'Further refine and improve strategies', 75, 150),
    ((SELECT id FROM goal_templates WHERE title = 'Increase Customer Lifetime Value'), 'Final Assessment', 'Measure final CLV improvement', 100, 180);

-- Improve Accounts Receivable Turnover
INSERT INTO goal_milestone_templates (goal_template_id, title, description, target_percentage, due_day)
VALUES
    ((SELECT id FROM goal_templates WHERE title = 'Improve Accounts Receivable Turnover'), 'Process Review', 'Analyze current AR processes', 0, 15),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Accounts Receivable Turnover'), 'Strategy Implementation', 'Implement new AR collection strategies', 25, 30),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Accounts Receivable Turnover'), 'Mid-Quarter Check', 'Evaluate improvement in AR turnover', 50, 45),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Accounts Receivable Turnover'), 'Fine-tuning', 'Adjust strategies based on results', 75, 75),
    ((SELECT id FROM goal_templates WHERE title = 'Improve Accounts Receivable Turnover'), 'Quarter-End Goal', 'Achieve target AR turnover improvement', 100, 90);