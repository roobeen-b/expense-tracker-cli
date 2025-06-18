#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

const program = new Command();

const FILE_PATH = path.join(__dirname, "../expenses.json");

const allowedCategories: TCategory[] = [
  "Bills",
  "Education",
  "Groceries",
  "Miscellaneous",
];

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

const validAmount = (amount: number) => {
  if (isNaN(amount) || Number(amount) <= 0) {
    console.error("Invalid amount. Please enter a positive number.");
    return false;
  }
  return true;
};

const getMonthName = (value: number) => {
  const monthMap = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  return monthMap[value];
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
  .option("--category <category>", "Expense category", "Miscellaneous")
  .action((options) => {
    try {
      const allExpenses = loadExpenses();

      if (options.category && !allowedCategories.includes(options.category)) {
        console.error(
          `The category "${
            options.category
          }" is currently not available. Allowed categories includes ${allowedCategories.join(
            ", "
          )}.`
        );
        return;
      }
      if (options.amount) {
        if (!validAmount(Number(options.amount))) {
          return;
        }
      }
      const newExpense: TExpense = {
        id: allExpenses?.length
          ? allExpenses[allExpenses.length - 1].id + 1
          : 1,
        category: options.category as TCategory,
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
  .option("--category <category>", "Filter by category")
  .action((options) => {
    try {
      const allExpenses = loadExpenses();
      if (!allExpenses || allExpenses.length <= 0) {
        console.log("No expense recorded yet.");
        return;
      }

      if (options.category) {
        const filteredExpenses = allExpenses?.filter(
          (item) => item.category === options.category
        );
        if (filteredExpenses && filteredExpenses.length) {
          console.table(filteredExpenses);
          return;
        } else {
          console.log(
            `No expense made for the category "${options.category}".`
          );
          return;
        }
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
        console.log(
          `Total expenses for ${getMonthName(monthValue)}: $${totalExpense}`
        );
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

program
  .command("update")
  .description("Update an expense")
  .requiredOption("--id <id>", "Expense id to be updated")
  .option("--description <desc>", "New description value")
  .option("--amount <amount>", "New amount value")
  .action((options) => {
    if (!options.id) {
      console.error("Expense id is required");
      return;
    }
    const allExpenses = loadExpenses();
    const existingExpenseIndex = allExpenses?.findIndex(
      (item) => item.id == options.id
    );
    if (existingExpenseIndex === -1) {
      console.error(`Expense with id:${options.id} does not exist.`);
      return;
    }
    if (options.amount) {
      if (!validAmount(Number(options.amount))) {
        return;
      }
      allExpenses[existingExpenseIndex]["amount"] = Number(options.amount);
    }
    if (options.description) {
      allExpenses[existingExpenseIndex]["description"] = options.description;
    }

    saveExpense(allExpenses);
    console.log(`Update of expense with id:${options.id} successful`);
  });

program
  .command("delete")
  .description("Delete an expense")
  .requiredOption("--id <id>", "Expense id to be deleted")
  .action((options) => {
    if (!options.id) {
      console.error("Expense id is required");
      return;
    }
    const allExpenses = loadExpenses();
    const existingExpenseIndex = allExpenses?.findIndex(
      (item) => item.id == options.id
    );
    if (existingExpenseIndex === -1) {
      console.error(`Expense with id:${options.id} does not exist.`);
      return;
    }
    const remainingExpenses = allExpenses?.filter(
      (item) => item.id != options.id
    );
    saveExpense(remainingExpenses);
    console.log(`Deletion of expense with id:${options.id} successful`);
  });

program.parse(process.argv);
