import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
    AccountsParamsSchema,
    AccountsSchema
} from "./schema";

const route = createRoute({
    tags: ["apis"],
    operationId: "accountsApi",
    method: "get",
    path: "/v1/api.accountsApi",
    security: [{ bearerAuth: [] }],
    summary: "Get Accounts",
    request: {
        query: AccountsParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: AccountsSchema,
                },
            },
            description: "Retrieve accounts",
        },
        ...ErrorResponses
    },
});


export type V1ApisGetAccountsApiRoute = typeof route;
export type V1ApisGetAccountsApiRequest = z.infer<
    (typeof route.request.query)
>;
export type V1ApisGetAccountsApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the GET /v1/api.getAccountsApi endpoint with the Hono app.
 * 
 * This endpoint retrieves account information based on the provided query parameters.
 * It uses the Provider class to fetch the account data from the specified provider.
 * 
 * @param app - The Hono app instance to register the route with.
 * 
 * @throws {Error} If there's an issue with the Provider or data retrieval.
 * 
 * @example
 * // Usage in app setup
 * const app = new Hono();
 * registerV1ApisGetAccountsApi(app);
 */
export const registerV1ApisGetAccountsApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);

        // Extract query parameters
        const { provider, accessToken, institutionId, id } = c.req.valid("query");

        // Initialize the Provider with necessary configurations
        const api = new Provider({
            provider,
            kv: c.env.KV,
            fetcher: c.env.TELLER_CERT,
            envs,
            r2: c.env.BANK_STATEMENTS,
        });

        // Fetch account data using the Provider
        const data = await api.getAccounts({
            id,
            accessToken,
            institutionId,
        });

        // Return the fetched data as a JSON response
        return c.json(
            {
                data,
            },
            200,
        );
    });
}
