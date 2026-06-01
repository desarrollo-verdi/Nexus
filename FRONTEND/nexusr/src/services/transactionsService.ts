import api from "./api";

export const transactionsService = {
  testConsultTransactions: async () => {
    const response = await api.post("/consultTransactionsSW", {});
    return response.data;
  }
};