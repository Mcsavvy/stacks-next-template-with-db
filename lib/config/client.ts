import z from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default("/api"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Stacks dApp"),
  NEXT_PUBLIC_STACKS_NETWORK: z.string().default("testnet"),
});

export type AppConfig = {
  apiUrl: string;
  appName: string;
  stacksNetwork: string;
};

export const unparsedEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  stacksNetwork: process.env.NEXT_PUBLIC_STACKS_NETWORK,
};

const parsed = envSchema.safeParse(unparsedEnv);

if (!parsed.success) {
  let message = "Invalid environment variables:";
  for (const issue of parsed.error.issues) {
    message += `\n${issue.path.join(".")}: ${issue.message}`;
  }
  throw new Error(message);
}

const config: AppConfig = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  appName: parsed.data.NEXT_PUBLIC_APP_NAME,
  stacksNetwork: parsed.data.NEXT_PUBLIC_STACKS_NETWORK,
};

export default config;
