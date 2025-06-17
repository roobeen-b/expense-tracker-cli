const { Command } = require("commander");
const fs = require("fs");
const path = require("path");

const program = new Command();

const FILE_PATH = path.join(__dirname, "../expenses.json");

const loadExpenses = () => {
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
      if (allExpenses && allExpenses.length) {
        console.table(allExpenses);
      }
    } catch (error) {
      console.error(`Error while fetching all expenses list: ${error}`);
    }
  });

program.parse(process.argv);
