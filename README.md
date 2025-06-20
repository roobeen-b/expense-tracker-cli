# [Expense Tracker CLI](https://roadmap.sh/projects/expense-tracker)
A simple expense tracker application to manage your finances. The application allows users to add, delete, and view their expenses. The application also provides a summary of the expenses.
- Users can add an expense with a description and amount.
- Users can update an expense.
- Users can delete an expense.
- Users can view all expenses.
- Users can view a summary of all expenses.
- Users can view a summary of expenses for a specific month (of current year).
- Users can add expense categories and allow users to filter expenses by category.
- Users can set a budget for each month and the app shows a warning when the user exceeds the budget.
- Users can export expenses to a CSV file.

# How to run the project ?
  - First, clone the project repo
  - Then, run "npm install" to install the required dependencies
  - Then, run "npm build" to build the project
  - You can check all the expenses using the command "node dist/index.js list"
  - Alternatively, you can run "npm link".
  - After this, you can use "expense-tracker" instead of "node dist/index.js" to run all the available commands. For e.g., use "expense-tracker list" to list all the expenses
