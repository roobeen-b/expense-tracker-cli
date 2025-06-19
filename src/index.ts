#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

const program = new Command();

const FILE_PATH = path.join(__dirname, "../expenses.json");
const FILE_PATH_BUDGET = path.join(__dirname, "../budget.json");

const allowedCategories: TCategory[] = [
  "Bills",
  "Education",
  "Groceries",
  "Miscellaneous",
];

const loadData = (filePath: string): (TExpense | TBudget)[] => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, { encoding: "utf8" });
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

const saveData = (data: (TExpense | TBudget)[], filePath: string) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

const exportToCsvNode = (filename: string, data: Record<string, unknown>[]) => {
  if (!data.length) {
    console.warn("No data to export.");
    return;
  }
  const tempArr: string[] = [];
  const headers = Object.keys(data[0]);
  tempArr.push(headers.join(","));
  const csvString = data.map((row) => Object.values(row).join(","));

  tempArr.push(...csvString);
  const finalString = tempArr.join("\n");
  fs.writeFile(filename, finalString, (err) => {
    if (err) {
      console.error("Error writing CSV file:", err);
    } else {
      console.log("CSV file written successfully!");
    }
  });
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
      const allExpenses = loadData(FILE_PATH) as TExpense[];

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
      saveData(allExpenses, FILE_PATH);

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
      const allExpenses = loadData(FILE_PATH) as TExpense[];
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
        const modifiedExpenses = allExpenses.map((item) => ({
          ...item,
          amount: `$${item.amount}`,
        }));
        console.table(modifiedExpenses);
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
      const allExpenses = loadData(FILE_PATH) as TExpense[];

      let filteredExpenses = allExpenses;
      if (options.month) {
        const monthValue = Number(options.month);

        if (isNaN(monthValue) || monthValue < 1 || monthValue > 12) {
          console.error(
            "Month value must be a number between 1 and 12 (inclusive)"
          );
          return;
        }
        filteredExpenses = allExpenses.filter((item) => {
          const monthFromDate = Number(item.date.split("-")[1]);
          return monthValue === monthFromDate;
        });
        const totalExpense = filteredExpenses.reduce(
          (sum, item) => sum + item.amount,
          0
        );

        console.log(
          `Total expenses for ${getMonthName(monthValue)}: $${totalExpense}`
        );

        const allBudgets = loadData(FILE_PATH_BUDGET) as TBudget[];
        const currentBudget = allBudgets?.find(
          (b) => Number(b.month) === monthValue
        );

        if (currentBudget && Number(currentBudget.amount) < totalExpense) {
          console.warn(
            `Warning! You have exceeded the budget limit of $${
              currentBudget.amount
            } for ${getMonthName(monthValue)}.`
          );
        }
      } else {
        const totalExpense = filteredExpenses.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        console.log(`Total expenses: $${totalExpense}`);
      }
    } catch (error) {
      if (error instanceof Error)
        console.error(`Error generating summary: ${error.message}`);
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
    const allExpenses = loadData(FILE_PATH) as TExpense[];
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

    saveData(allExpenses, FILE_PATH);
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
    const allExpenses = loadData(FILE_PATH) as TExpense[];
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
    saveData(remainingExpenses, FILE_PATH);
    console.log(`Deletion of expense with id:${options.id} successful`);
  });

program
  .command("set-budget")
  .description("Set monthly budget")
  .requiredOption("--month <month>", "Month value")
  .requiredOption("--amount <amount>", "Budget amount for the month")
  .action((options) => {
    if (options.amount) {
      if (!validAmount(Number(options.amount))) {
        return;
      }
    }
    const monthValue = Number(options.month);
    if (monthValue) {
      if (monthValue > 12 || monthValue < 1) {
        console.error("Month value must be between 1 and 12 (inclusive)");
        return;
      }
    }

    const allBudgets = loadData(FILE_PATH_BUDGET) as TBudget[];
    const existingBudgetIndex = allBudgets?.findIndex(
      (item) => item.month == monthValue
    );
    if (existingBudgetIndex === -1) {
      const newBudget: TBudget = {
        id: allBudgets?.length ? allBudgets[allBudgets?.length - 1]?.id + 1 : 1,
        month: monthValue,
        amount: Number(options.amount),
      };

      allBudgets?.push(newBudget);
      saveData(allBudgets, FILE_PATH_BUDGET);
      console.log(
        `Budget for ${getMonthName(monthValue)} set with amount: ${
          options.amount
        }.`
      );
    } else {
      allBudgets[existingBudgetIndex].amount = Number(options.amount);
      saveData(allBudgets, FILE_PATH_BUDGET);
      console.log(
        `Budget for ${getMonthName(monthValue)} updated with amount: ${
          options.amount
        }.`
      );
    }
  });

program
  .command("view-budget")
  .description("View budget details for each month")
  .action(() => {
    const allBudgets = loadData(FILE_PATH_BUDGET) as TBudget[];
    if (!allBudgets || !allBudgets.length) {
      console.log("No budget has been set for any month.");
      return;
    }
    const modifiedBudget = allBudgets?.map((item) => ({
      ...item,
      amount: `$${item.amount}`,
      month: getMonthName(Number(item.month)),
    }));
    console.table(modifiedBudget);
  });

program
  .command("export-to-csv")
  .description("Export the data to csv")
  .action(() => {
    const allExpenses = loadData(FILE_PATH) as TExpense[];
    if (allExpenses && allExpenses.length) {
      exportToCsvNode(`expenses_${Date.now()}.csv`, allExpenses);
    }
  });

program.parse(process.argv);
