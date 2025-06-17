#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

const program = new Command();

const FILE_PATH = path.join(__dirname, "../expenses.json");

const loadExpenses = (): TExpense[] => {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const data = fs.readFileSync(FILE_PATH, { encoding: "utf8" });
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

const saveExpense = (expense: TExpense[]) => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(expense, null, 2));
  } catch (err) {
    console.error(err);
  }
};

const validateAmount = (amount: number) => {
  if (isNaN(amount) || Number(amount) <= 0) {
    console.error("Invalid amount. Please enter a positive number.");
    return;
  }
  return amount;
};

program
  .name("expense-tracker")
  .description("A CLI application for tracking all your expenses")
  .version("1.0.0");

program
  .command("add")
  .description("Add new expense")
  .requiredOption("--description <desc>", "Expense description")
  .requiredOption("--amount <amount>", "Expense amount")
  .action((options) => {
    try {
      const allExpenses = loadExpenses();
      const newExpense: TExpense = {
        id: allExpenses?.length
          ? allExpenses[allExpenses.length - 1].id + 1
          : 1,
        date: new Date().toISOString().split("T")[0],
        amount: Number(options.amount),
        description: options.description,
      };
      allExpenses?.push(newExpense);
      saveExpense(allExpenses);

      console.log(`Expense added successfully (ID: ${newExpense.id})`);
    } catch (error) {
      console.log(`Error while adding expense: ${error}`);
    }
  });

program
  .command("list")
  .description("List all expenses")
  .action(() => {
    try {
      const allExpenses = loadExpenses();
      if (!allExpenses || allExpenses.length <= 0) {
        console.log("No expense recorded yet.");
        return;
      }
      if (allExpenses && allExpenses.length) {
        console.table(allExpenses);
      }
    } catch (error) {
      console.error(`Error while fetching all expenses list: ${error}`);
    }
  });

program
  .command("summary")
  .description("Provides summary of all the expenses")
  .option("--month <month>", "Month value in number from 1 to 12")
  .action((options) => {
    try {
      const allExpenses = loadExpenses();
      const monthValue = Number(options.month);
      if (monthValue) {
        if (monthValue > 12 || monthValue < 1) {
          console.error("Month value must be between 1 and 12 (inclusive)");
          return;
        }
        const expensesByMonth = allExpenses?.filter((item) => {
          const monthFromDate = item.date.split("-")?.[1];
          return monthValue === Number(monthFromDate);
        });
        const totalExpense = expensesByMonth?.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        console.log(`Total expenses: $${totalExpense}`);
        return;
      }
      const totalExpense = allExpenses?.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      console.log(`Total expenses: $${totalExpense}`);
    } catch (error) {
      console.error(`Error generating summary: ${error}`);
    }
  });

program.parse(process.argv);
