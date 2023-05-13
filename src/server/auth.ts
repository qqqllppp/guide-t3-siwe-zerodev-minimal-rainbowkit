import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
  type Session,
} from "next-auth";
import { getCsrfToken } from "next-auth/react";
import { CtxOrReq } from "next-auth/client/_utils";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { SiweMessage } from "siwe";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
// export const authOptions: NextAuthOptions = {
//   callbacks: {
//     session: ({ session, user }) => ({
//       ...session,
//       user: {
//         ...session.user,
//         id: user.id,
//       },
//     }),
//   },
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     // DiscordProvider({
//     //   clientId: env.DISCORD_CLIENT_ID,
//     //   clientSecret: env.DISCORD_CLIENT_SECRET,
//     // }),
//     /**
//      * ...add more providers here.
//      *
//      * Most other providers require a bit more work than the Discord provider. For example, the
//      * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
//      * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
//      *
//      * @see https://next-auth.js.org/providers/github
//      */
//   ],
// };

export const authOptions: (ctxReq: CtxOrReq) => NextAuthOptions = ({
  req,
}) => ({
  callbacks: {
    // token.sub will refer to the id of the wallet address
    session: ({ session, token }) =>
      ({
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      } as Session & { user: { id: string } }),
  },
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      type: "credentials", // default for Credentials
      // Default values if it was a form
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      authorize: async (credentials) => {
        try {
          const siwe = new SiweMessage(
            JSON.parse(
              (credentials?.message as string) ?? "{}"
            ) as Partial<SiweMessage>
          );
          // Fix for next-auth@4.21.1
          const nonce = await getCsrfToken({ req: { headers: req?.headers } });
          const { data } = await siwe.verify({
            signature: credentials?.signature || "",
          });

          if (data.nonce !== nonce) {
            return null;
          }

          //   // Check if user exists
          //   let user = await prisma.user.findUnique({
          //     where: {
          //       address: fields.address,
          //     },
          //   });
          //   // Create new user if doesn't exist
          //   if (!user) {
          //     user = await prisma.user.create({
          //       data: {
          //         address: fields.address,
          //       },
          //     });
          //     // create account
          //     await prisma.account.create({
          //       data: {
          //         userId: user.id,
          //         type: "credentials",
          //         provider: "Ethereum",
          //         providerAccountId: fields.address,
          //       },
          //     });
          //   }

          return {
            // Pass user id instead of address
            // id: fields.address
            // id: user.id,
            id: data.address,
          };
        } catch (error) {
          // Uncomment or add logging if needed
          console.error({ error });
          return null;
        }
      },
    }),
  ],
});

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions(ctx));
};
