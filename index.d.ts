type TCategory = "Bills" | "Education" | "Groceries" | "Miscellaneous";

type TExpense = {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: TCategory;
};

type TBudget = {
  id: number;
  month: number;
  amount: number;
};
