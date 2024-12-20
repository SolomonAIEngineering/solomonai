import { UTCDate } from "@date-fns/utc";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import {
  addDays,
  endOfMonth,
  isWithinInterval,
  startOfMonth,
  subYears,
} from "date-fns";
import { z } from "zod";
import type { Client, RecurringTransactionSchema } from "../types";

export enum RecurringTransactionFrequency {
  ALL = "all",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

/**
 * Converts a RecurringTransactionFrequency enum value to its string representation.
 *
 * @param frequency - The RecurringTransactionFrequency enum value to convert.
 * @returns The string representation of the frequency.
 */
export function recurringFrequencyToString(
  frequency: RecurringTransactionFrequency,
): string {
  switch (frequency) {
    case RecurringTransactionFrequency.ALL:
      return "all";
    case RecurringTransactionFrequency.WEEKLY:
      return "weekly";
    case RecurringTransactionFrequency.MONTHLY:
      return "monthly";
    case RecurringTransactionFrequency.YEARLY:
      return "yearly";
    default:
      return "all";
  }
}

/**
 * Parameters for the getRecentTransactionsQuery function.
 */
export type GetRecentTransactionsParams = {
  /** The ID of the team to fetch transactions for. */
  teamId: string;
  /** The number of transactions to fetch. Defaults to 15. */
  limit?: number;
  /** Optional account ID to filter transactions. */
  accountId?: string;
  /** Optional flag to filter recurring transactions. */
  recurring?: RecurringTransactionFrequency;
};

/**
 * Fetches the most recent transactions for a given team, optionally filtered by account and recurring status.
 *
 * @param supabase - The Supabase client instance.
 * @param params - The parameters for the query.
 * @returns A promise that resolves to an object containing the recent transactions data.
 */
export async function getRecentTransactionsQuery(
  supabase: Client,
  params: GetRecentTransactionsParams,
) {
  const { teamId, limit = 15, accountId, recurring } = params;

  /**
   * The columns to select from the transactions table.
   */
  const columns = [
    "id",
    "date",
    "amount",
    "currency",
    "method",
    "status",
    "note",
    "name",
    "description",
    "recurring",
    "category:transaction_categories(id, name, color, slug)",
    "bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url))",
  ];

  /**
   * Builds and executes the Supabase query.
   */
  const query = supabase
    .from("transactions")
    .select(columns.join(","))
    .eq("team_id", teamId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  // Add account filter if accountId is provided
  if (accountId) {
    query.eq("bank_account_id", accountId);
  }

  // Add recurring filter if recurring is provided
  if (recurring) {
    if (recurring.includes(RecurringTransactionFrequency.ALL)) {
      query.eq("recurring", true);
    } else {
      query.in("frequency", [recurringFrequencyToString(recurring)]);
    }
  }

  const { data, error } = await query.throwOnError();

  /**
   * Processes the retrieved data.
   */
  return {
    data: data?.map((transaction: any) => ({
      ...transaction,
      category: transactionCategory(transaction),
    })),
  };
}

/**
 * Determines the category for a transaction.
 *
 * @param transaction - The transaction object.
 * @returns The category object for the transaction.
 */
function transactionCategory(transaction: any) {
  return (
    transaction?.category ?? {
      id: "uncategorized",
      name: "Uncategorized",
      color: "#606060",
    }
  );
}

export function getPercentageIncrease(a: number, b: number) {
  return a > 0 && b > 0 ? Math.abs(((a - b) / b) * 100).toFixed() : 0;
}

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(
      `
      *,
      team:team_id(*)
    `,
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}

export async function getCurrentUserTeamQuery(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }
  return getUserQuery(supabase, session.user?.id);
}

export async function getBankAccountByAccountIdAndTeamQuery(
  supabase: Client,
  accountId: string,
  teamId: string,
) {
  return supabase
    .from("bank_accounts")
    .select("*")
    .eq("account_id", accountId)
    .eq("team_id", teamId)
    .single()
    .throwOnError();
}

export async function getBankConnectionsByTeamIdQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("bank_connections")
    .select("*")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getBankConnectionByIdQuery(
  supabase: Client,
  connectionId: string,
) {
  return supabase
    .from("bank_connections")
    .select("*, accounts:bank_accounts(*)")
    .eq("id", connectionId)
    .single()
    .throwOnError();
}

export type GetTeamBankAccountsParams = {
  teamId: string;
  enabled?: boolean;
};

export async function getTeamBankAccountsQuery(
  supabase: Client,
  params: GetTeamBankAccountsParams,
) {
  const { teamId, enabled } = params;

  const query = supabase
    .from("bank_accounts")
    .select("*, bank:bank_connections(*)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .order("name", { ascending: false })
    .throwOnError();

  if (enabled) {
    query.eq("enabled", enabled);
  }

  return query;
}

export async function getTeamMembersQuery(supabase: Client, teamId: string) {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team_id,
      user:users(id, full_name, avatar_url, email)
    `,
    )
    .eq("team_id", teamId)
    .order("created_at")
    .throwOnError();

  return {
    data,
  };
}

type GetTeamUserParams = {
  teamId: string;
  userId: string;
};

export async function getTeamUserQuery(
  supabase: Client,
  params: GetTeamUserParams,
) {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team_id,
      user:users(id, full_name, avatar_url, email)
    `,
    )
    .eq("team_id", params.teamId)
    .eq("user_id", params.userId)
    .throwOnError()
    .single();

  return {
    data,
  };
}

export type GetSpendingParams = {
  from: string;
  to: string;
  teamId: string;
  currency?: string;
};

export async function getSpendingQuery(
  supabase: Client,
  params: GetSpendingParams,
) {
  return supabase.rpc("get_spending_v3", {
    team_id: params.teamId,
    date_from: params.from,
    date_to: params.to,
    base_currency: params.currency,
  });
}

export type GetTransactionsParams = {
  teamId: string;
  to: number;
  from: number;
  sort?: string[];
  searchQuery?: string;
  filter?: {
    statuses?: string[];
    attachments?: "include" | "exclude";
    categories?: string[];
    accounts?: string[];
    assignees?: string[];
    type?: "income" | "expense";
    start?: string;
    end?: string;
    recurring?: string[];
  };
};

export async function getTransactionsQuery(
  supabase: Client,
  params: GetTransactionsParams,
) {
  const { from = 0, to, filter, sort, teamId, searchQuery } = params;

  const {
    statuses,
    attachments,
    categories,
    type,
    accounts,
    start,
    end,
    assignees,
    recurring,
  } = filter || {};

  const columns = [
    "id",
    "date",
    "amount",
    "currency",
    "method",
    "status",
    "note",
    "manual",
    "recurring",
    "frequency",
    "name",
    "description",
    "assigned:assigned_id(*)",
    "category:transaction_categories(id, name, color, slug)",
    "bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url))",
    "attachments:transaction_attachments(id, name, size, path, type)",
    "vat:calculated_vat",
  ];

  const query = supabase
    .from("transactions")
    .select(columns.join(","), { count: "exact" })
    .eq("team_id", teamId);

  if (sort) {
    const [column, value] = sort;
    const ascending = value === "asc";

    if (column === "attachment") {
      query.order("is_fulfilled", { ascending });
    } else if (column === "assigned") {
      query.order("assigned(full_name)", { ascending });
    } else if (column === "bank_account") {
      query.order("bank_account(name)", { ascending });
    } else if (column === "category") {
      query.order("category(name)", { ascending });
    } else {
      query.order(column, { ascending });
    }
  } else {
    query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (start && end) {
    const fromDate = new UTCDate(start);
    const toDate = new UTCDate(end);

    query.gte("date", fromDate.toISOString());
    query.lte("date", toDate.toISOString());
  }

  if (searchQuery) {
    if (!Number.isNaN(Number.parseInt(searchQuery))) {
      query.like("amount_text", `%${searchQuery}%`);
    } else {
      query.textSearch("fts_vector", `'${searchQuery}'`);
    }
  }

  if (statuses?.includes("fullfilled") || attachments === "include") {
    query.eq("is_fulfilled", true);
  }

  if (statuses?.includes("unfulfilled") || attachments === "exclude") {
    query.eq("is_fulfilled", false);
  }

  if (statuses?.includes("excluded")) {
    query.eq("status", "excluded");
  } else {
    query.or("status.eq.pending,status.eq.posted,status.eq.completed");
  }

  if (categories) {
    const matchCategory = categories
      .map((category) => {
        if (category === "uncategorized") {
          return "category_slug.is.null";
        }
        return `category_slug.eq.${category}`;
      })
      .join(",");

    query.or(matchCategory);
  }

  if (recurring) {
    if (recurring.includes("all")) {
      query.eq("recurring", true);
    } else {
      query.in("frequency", recurring);
    }
  }

  if (type === "expense") {
    query.lt("amount", 0);
    query.neq("category_slug", "transfer");
  }

  if (type === "income") {
    query.eq("category_slug", "income");
  }

  if (accounts?.length) {
    query.in("bank_account_id", accounts);
  }

  if (assignees?.length) {
    query.in("assigned_id", assignees);
  }

  const { data, count } = await query.range(from, to);

  const totalAmount = data
    ?.reduce((acc, { amount, currency }) => {
      const existingCurrency = acc.find((item) => item.currency === currency);

      if (existingCurrency) {
        existingCurrency.amount += amount;
      } else {
        acc.push({ amount, currency });
      }
      return acc;
    }, [])
    .sort((a, b) => a?.amount - b?.amount);

  return {
    meta: {
      totalAmount,
      count,
    },
    data: data?.map((transaction) => ({
      ...transaction,
      category: transactionCategory(transaction),
    })),
  };
}

export async function getTransactionQuery(supabase: Client, id: string) {
  const columns = [
    "*",
    "assigned:assigned_id(*)",
    "category:category_slug(id, name, vat)",
    "attachments:transaction_attachments(*)",
    "bank_account:bank_accounts(id, name, currency, bank_connection:bank_connections(id, logo_url))",
    "vat:calculated_vat",
  ];

  const { data } = await supabase
    .from("transactions")
    .select(columns.join(","))
    .eq("id", id)
    .single()
    .throwOnError();

  return {
    ...data,
    category: transactionCategory(data),
  };
}

type GetSimilarTransactionsParams = {
  name: string;
  teamId: string;
  categorySlug?: string;
};

export async function getSimilarTransactions(
  supabase: Client,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug } = params;

  return supabase
    .from("transactions")
    .select("id, amount, team_id", { count: "exact" })
    .eq("team_id", teamId)
    .neq("category_slug", categorySlug)
    .textSearch("fts_vector", `'${name}'`)
    .throwOnError();
}

// gets all the similar transactions with detailed information
export async function getSimilarTransactionsDetailedQuery(
  supabase: Client,
  params: GetSimilarTransactionsParams,
) {
  const { name, teamId, categorySlug } = params;

  return supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("team_id", teamId)
    .neq("category_slug", categorySlug)
    .textSearch("fts_vector", `'${name}'`)
    .throwOnError();
}

type GetBankAccountsCurrenciesParams = {
  teamId: string;
};

export async function getBankAccountsCurrenciesQuery(
  supabase: Client,
  params: GetBankAccountsCurrenciesParams,
) {
  return supabase.rpc("get_bank_account_currencies", {
    team_id: params.teamId,
  });
}

export type GetBurnRateQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getBurnRateQuery(
  supabase: Client,
  params: GetBurnRateQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const { data } = await supabase.rpc("get_burn_rate_v3", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });

  return {
    data,
    currency: data?.at(0)?.currency,
  };
}

export type GetRunwayQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getRunwayQuery(
  supabase: Client,
  params: GetRunwayQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  return supabase.rpc("get_runway_v3", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });
}

export type GetMetricsParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  type?: "revenue" | "profit";
};

export async function getMetricsQuery(
  supabase: Client,
  params: GetMetricsParams,
) {
  const { teamId, from, to, type = "profit", currency } = params;

  const rpc = type === "profit" ? "get_profit_v3" : "get_revenue_v3";

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const [{ data: prevData }, { data: currentData }] = await Promise.all([
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: subYears(startOfMonth(fromDate), 1).toDateString(),
      date_to: subYears(endOfMonth(toDate), 1).toDateString(),
      base_currency: currency,
    }),
    supabase.rpc(rpc, {
      team_id: teamId,
      date_from: startOfMonth(fromDate).toDateString(),
      date_to: endOfMonth(toDate).toDateString(),
      base_currency: currency,
    }),
  ]);

  const prevTotal = prevData?.reduce((value, item) => item.value + value, 0);
  const currentTotal = currentData?.reduce(
    (value, item) => item.value + value,
    0,
  );

  const baseCurrency = currentData?.at(0)?.currency;

  return {
    summary: {
      currentTotal,
      prevTotal,
      currency: baseCurrency,
    },
    meta: {
      type,
      currency: baseCurrency,
    },
    result: currentData?.map((record, index) => {
      const prev = prevData?.at(index);

      return {
        date: record.date,
        precentage: {
          value: getPercentageIncrease(
            Math.abs(prev?.value),
            Math.abs(record.value),
          ),
          status: record.value > prev?.value ? "positive" : "negative",
        },
        current: {
          date: record.date,
          value: record.value,
          currency,
        },
        previous: {
          date: prev?.date,
          value: prev?.value,
          currency,
        },
      };
    }),
  };
}

export type GetExpensesQueryParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export async function getExpensesQuery(
  supabase: Client,
  params: GetExpensesQueryParams,
) {
  const { teamId, from, to, currency } = params;

  const fromDate = new UTCDate(from);
  const toDate = new UTCDate(to);

  const { data } = await supabase.rpc("get_expenses", {
    team_id: teamId,
    date_from: startOfMonth(fromDate).toDateString(),
    date_to: endOfMonth(toDate).toDateString(),
    base_currency: currency,
  });

  const averageExpense =
    data && data.length > 0
      ? data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length
      : 0;

  return {
    summary: {
      averageExpense,
      currency: data?.at(0)?.currency,
    },
    meta: {
      type: "expense",
      currency: data?.at(0)?.currency,
    },
    result: data.map((item) => ({
      ...item,
      value: item.value,
      recurring: item.recurring_value,
      total: item.value + item.recurring_value,
    })),
  };
}

export type GetVaultParams = {
  teamId: string;
  parentId?: string;
  limit?: number;
  searchQuery?: string;
  filter?: {
    start?: string;
    end?: string;
    owners?: string[];
    tags?: string[];
  };
};

export async function getVaultQuery(supabase: Client, params: GetVaultParams) {
  const { teamId, parentId, limit = 10000, searchQuery, filter } = params;

  const { start, end, owners, tags } = filter || {};

  const isSearch =
    (filter !== undefined &&
      Object.values(filter).some(
        (value) => value !== undefined && value !== null,
      )) ||
    Boolean(searchQuery);

  const query = supabase
    .from("documents")
    .select(
      "id, name, path_tokens, created_at, team_id, metadata, tag, owner:owner_id(*)",
    )
    .eq("team_id", teamId)
    .limit(limit)
    .order("created_at", { ascending: true });

  if (owners?.length) {
    query.in("owner_id", owners);
  }

  if (tags?.length) {
    query.in("tag", tags);
  }

  if (start && end) {
    query.gte("created_at", start);
    query.lte("created_at", end);
  }

  if (!isSearch) {
    // if no search query, we want to get the default folders
    if (parentId === "inbox") {
      query
        .or(`parent_id.eq.${parentId || teamId},parent_id.eq.uploaded`)
        .not("path_tokens", "cs", '{"uploaded",".folderPlaceholder"}');
    } else {
      query.or(`parent_id.eq.${parentId || teamId}`);
    }
  }

  if (searchQuery) {
    query.textSearch("fts", `'${searchQuery}'`);
  }

  const { data } = await query;

  const defaultFolders =
    parentId || isSearch
      ? []
      : [
          { name: "exports", isFolder: true },
          { name: "inbox", isFolder: true },
          { name: "imports", isFolder: true },
          { name: "transactions", isFolder: true },
        ];

  const filteredData = (data ?? []).map((item) => ({
    ...item,
    name:
      item.path_tokens?.at(-1) === ".folderPlaceholder"
        ? item.path_tokens?.at(-2)
        : item.path_tokens?.at(-1),
    isFolder: item.path_tokens?.at(-1) === ".folderPlaceholder",
  }));

  const mergedMap = new Map(
    [...defaultFolders, ...filteredData].map((obj) => [obj.name, obj]),
  );

  const mergedArray = Array.from(mergedMap.values());

  return {
    data: mergedArray,
  };
}

export async function getVaultActivityQuery(supabase: Client, teamId: string) {
  return supabase
    .from("documents")
    .select("id, name, metadata, path_tokens, tag, team_id")
    .eq("team_id", teamId)
    .limit(20)
    .not("name", "ilike", "%.folderPlaceholder")
    .order("created_at", { ascending: false });
}

type GetVaultRecursiveParams = {
  teamId: string;
  path?: string;
  folder?: string;
  limit?: number;
  offset?: number;
};

export async function getVaultRecursiveQuery(
  supabase: Client,
  params: GetVaultRecursiveParams,
) {
  const { teamId, path, folder, limit = 10000 } = params;

  let basePath = teamId;

  if (path) {
    basePath = `${basePath}/${path}`;
  }

  if (folder) {
    basePath = `${basePath}/${folder}`;
  }

  const items = [];
  let folderContents: any = [];

  for (;;) {
    const { data } = await supabase.storage.from("vault").list(basePath);

    folderContents = folderContents.concat(data);
    // offset += limit;
    if ((data || []).length < limit) {
      break;
    }
  }

  const subfolders = folderContents?.filter((item) => item.id === null) ?? [];
  const folderItems = folderContents?.filter((item) => item.id !== null) ?? [];

  folderItems.forEach((item) => items.push({ ...item, basePath }));

  const subFolderContents = await Promise.all(
    subfolders.map((folder: any) =>
      getVaultRecursiveQuery(supabase, {
        ...params,
        folder: decodeURIComponent(folder.name),
      }),
    ),
  );

  subFolderContents.map((subfolderContent) => {
    subfolderContent.map((item) => items.push(item));
  });

  return items;
}

export async function getTeamsByUserIdQuery(supabase: Client, userId: string) {
  return supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      team:team_id(*)`,
    )
    .eq("user_id", userId)
    .throwOnError();
}

export async function getTeamInvitesQuery(supabase: Client, teamId: string) {
  return supabase
    .from("user_invites")
    .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
    .eq("team_id", teamId)
    .throwOnError();
}

export async function getUserInvitesQuery(supabase: Client, email: string) {
  return supabase
    .from("user_invites")
    .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
    .eq("email", email)
    .throwOnError();
}

type GetUserInviteQueryParams = {
  code: string;
  email: string;
};

export async function getUserInviteQuery(
  supabase: Client,
  params: GetUserInviteQueryParams,
) {
  return supabase
    .from("user_invites")
    .select("*")
    .eq("code", params.code)
    .eq("email", params.email)
    .single();
}

type GetInboxQueryParams = {
  teamId: string;
  from?: number;
  to?: number;
  done?: boolean;
  todo?: boolean;
  ascending?: boolean;
  searchQuery?: string;
};

export async function getInboxQuery(
  supabase: Client,
  params: GetInboxQueryParams,
) {
  const {
    from = 0,
    to = 10,
    teamId,
    done,
    todo,
    searchQuery,
    ascending = false,
  } = params;

  const columns = [
    "id",
    "file_name",
    "file_path",
    "display_name",
    "transaction_id",
    "amount",
    "currency",
    "content_type",
    "date",
    "status",
    "forwarded_to",
    "created_at",
    "website",
    "description",
    "transaction:transactions(id, amount, currency, name, date)",
  ];

  const query = supabase
    .from("inbox")
    .select(columns.join(","))
    .eq("team_id", teamId)
    .order("created_at", { ascending })
    .neq("status", "deleted");

  if (done) {
    query.not("transaction_id", "is", null);
  }

  if (todo) {
    query.is("transaction_id", null);
  }

  if (searchQuery) {
    if (!Number.isNaN(Number.parseInt(searchQuery))) {
      query.like("inbox_amount_text", `%${searchQuery}%`);
    } else {
      query.textSearch("fts", `${searchQuery}:*`);
    }
  }

  const { data } = await query.range(from, to);

  return {
    data: data?.map((item) => {
      const pending = isWithinInterval(new Date(), {
        start: new Date(item.created_at),
        end: addDays(new Date(item.created_at), 45),
      });

      return {
        ...item,
        pending,
        review: !pending && !item.transaction_id,
      };
    }),
  };
}

export type GetTrackerProjectsQueryParams = {
  teamId: string;
  to: number;
  from?: number;
  sort?: {
    column: string;
    value: "asc" | "desc";
  };
  search?: {
    query?: string;
    fuzzy?: boolean;
  };
  filter?: {
    status?: "in_progress" | "completed";
  };
};

export async function getTrackerProjectsQuery(
  supabase: Client,
  params: GetTrackerProjectsQueryParams,
) {
  const { from = 0, to = 10, filter, sort, teamId, search } = params;
  const { status } = filter || {};

  const query = supabase
    .from("tracker_projects")
    .select("*, total_duration", { count: "exact" })
    .eq("team_id", teamId);

  if (status) {
    query.eq("status", status);
  }

  if (search?.query && search?.fuzzy) {
    query.ilike("name", `%${search.query}%`);
  }

  if (sort) {
    const [column, value] = sort;
    if (column === "time") {
      query.order("total_duration", { ascending: value === "asc" });
    } else {
      query.order(column, { ascending: value === "asc" });
    }
  } else {
    query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(from, to);

  return {
    meta: {
      count,
    },
    data,
  };
}

export type GetTrackerRecordsByRangeParams = {
  teamId: string;
  from: string;
  to: string;
  projectId: string;
};

export async function getTrackerRecordsByRangeQuery(
  supabase: Client,
  params: GetTrackerRecordsByRangeParams,
) {
  if (!params.teamId) {
    return null;
  }

  const query = supabase
    .from("tracker_entries")
    .select(
      "*, assigned:assigned_id(id, full_name, avatar_url), project:project_id(id, name)",
    )
    .eq("team_id", params.teamId)
    .gte("date", params.from)
    .lte("date", params.to)
    .order("created_at");

  if (params.projectId) {
    query.eq("project_id", params.projectId);
  }

  const { data } = await query;
  const result = data?.reduce((acc, item) => {
    const key = item.date;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const totalDuration = data?.reduce(
    (duration, item) => item.duration + duration,
    0,
  );

  return {
    meta: {
      totalDuration,
      from: params.from,
      to: params.to,
    },
    data: result,
  };
}

export type GetCategoriesParams = {
  teamId: string;
  limit?: number;
};

export async function getCategoriesQuery(
  supabase: Client,
  params: GetCategoriesParams,
) {
  const { teamId, limit = 1000 } = params;

  return supabase
    .from("transaction_categories")
    .select("id, name, color, slug, description, system, vat")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .range(0, limit);
}

type GetInboxSearchParams = {
  teamId: string;
  limit?: number;
  q: string;
};

export async function getInboxSearchQuery(
  supabase: Client,
  params: GetInboxSearchParams,
) {
  const { teamId, q, limit = 10 } = params;

  const query = supabase
    .from("inbox")
    .select(
      "id, created_at, file_name, amount, currency, file_path, content_type, date, display_name, size, description",
    )
    .eq("team_id", teamId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (!Number.isNaN(Number.parseInt(q))) {
    query.like("inbox_amount_text", `%${q}%`);
  } else {
    query.textSearch("fts", `${q}:*`);
  }

  const { data } = await query.range(0, limit);

  return data;
}

export async function getTeamSettingsQuery(supabase: Client, teamId: string) {
  return supabase.from("teams").select("*").eq("id", teamId).single();
}

// Schema and type for getTransactionsByBankAccountQuery
const getTransactionsByBankAccountQueryParamsSchema = z.object({
  bankAccountId: z.string(),
  limit: z.number().optional().default(5),
});
export type GetTransactionsByBankAccountQueryParams = z.infer<
  typeof getTransactionsByBankAccountQueryParamsSchema
>;

export const getTransactionsByBankAccountQuery = async (
  supabase: Client,
  params: GetTransactionsByBankAccountQueryParams,
) => {
  const { bankAccountId, limit } =
    getTransactionsByBankAccountQueryParamsSchema.parse(params);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("bank_account_id", bankAccountId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return null;
  }

  return data;
};

/**
 * Fetches the subscription data for a given user.
 * @param supabase - The Supabase client.
 * @param userId - The ID of the user.
 * @returns The subscription data.
 */
export async function getUserSubscriptionsQuery(
  supabase: Client,
  userId: string,
) {
  return await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .throwOnError();
}

type AssociatedTransactionsResponse = {
  id: string;
  recurring_transaction_id: string | null;
  transaction_id: string | null;
};

/**
 * Retrieves all associated transactions for a given recurring transaction ID.
 *
 * @param supabase - The Supabase client instance.
 * @param recurringTransactionId - The UUID of the recurring transaction.
 *
 * @returns A Promise that resolves to an array of transaction IDs.
 *
 * @throws Will throw an error if the retrieval operation fails.
 *
 * @example
 * const transactionIds = await getAssociatedTransactions(supabase, '123e4567-e89b-12d3-a456-426614174000');
 *
 * @remarks
 * This function uses a custom RPC (Remote Procedure Call) named 'get_associated_transactions'
 * to retrieve the associated transaction IDs.
 */
export async function getAssociatedTransactionsQuery(
  supabase: Client,
  recurringTransactionId: string,
): Promise<Array<AssociatedTransactionsResponse>> {
  let { data, error } = await supabase
    .from("transaction_ids")
    .select("*")
    .eq("recurring_transaction_id", recurringTransactionId);

  if (error) {
    throw new Error(
      `Error retrieving associated transactions: ${error.message}`,
    );
  }

  return data || [];
}

/**
 * Parameters for querying recurring transactions.
 */
export type GetRecurringTransactionsParams = {
  /** Unique identifier for the transaction stream */
  streamId?: string;
  /** Identifier for the associated bank account */
  accountId?: string;
  /** Name of the merchant for filtering transactions */
  merchantName?: string;
  /** Start date for filtering transactions (inclusive) */
  startDate?: string;
  /** End date for filtering transactions based on their last occurrence (inclusive) */
  lastTransactionDate?: string;
  /** Maximum number of records to return (default: 100) */
  limit?: number;
  /** Number of records to skip for pagination (default: 0) */
  offset?: number;
};

/**
 * Retrieves recurring transactions based on specified criteria.
 *
 * @param supabase - The Supabase client instance for database operations.
 * @param params - An object containing query parameters for filtering and pagination.
 * @returns A promise that resolves to an array of RecurringTransactionSchema objects.
 *
 * @throws Will throw an error if the database query fails.
 *
 * @example
 * const recurringTransactions = await getRecurringTransactions(supabase, {
 *   accountId: 'acc123',
 *   merchantName: 'Netflix',
 *   limit: 10
 * });
 *
 * @remarks
 * - This function queries the 'recurring_transactions' table in the database.
 * - It applies filters based on the provided parameters.
 * - Results are ordered by last_date (descending) and then first_date (descending).
 * - Pagination is supported through limit and offset parameters.
 */
export async function getRecurringTransactions(
  supabase: Client,
  params: GetRecurringTransactionsParams,
): Promise<RecurringTransactionSchema[]> {
  const {
    streamId,
    accountId,
    merchantName,
    startDate,
    lastTransactionDate,
    limit = 100,
    offset = 0,
  } = params;

  let query = supabase.from("recurring_transactions").select("*");

  // Apply filters based on provided parameters
  if (streamId) {
    query = query.eq("stream_id", streamId);
  }

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  if (merchantName) {
    query = query.ilike("merchant_name", `%${merchantName}%`);
  }

  if (startDate) {
    query = query.gte("first_date", startDate);
  }

  if (lastTransactionDate) {
    query = query.lte("last_date", lastTransactionDate);
  }

  // Apply ordering and pagination
  query = query
    .order("last_date", { ascending: false })
    .order("first_date", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Error retrieving recurring transactions: ${error.message}`,
    );
  }

  return data || [];
}
