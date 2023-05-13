import "@rainbow-me/rainbowkit/styles.css";

import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { createContext, useContext, useState, type ReactNode } from "react";

import {
  connectorsForWallets,
  RainbowKitProvider,
  type Theme,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet, polygon, polygonMumbai } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import {
  coinbaseWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import {
  RainbowKitSiweNextAuthProvider,
  GetSiweMessageOptions,
} from "@rainbow-me/rainbowkit-siwe-next-auth";
import {
  googleWallet,
  facebookWallet,
  githubWallet,
  discordWallet,
  twitchWallet,
  twitterWallet,
  enhanceWalletWithAAConnector,
} from "@zerodevapp/wagmi/rainbowkit";

import { env } from "~/env.mjs";

// eslint-disable-next-line
export interface IWalletContext {
  isEnableServerSIWE: boolean;
  setIsEnableServerSIWE: (v: boolean) => void;
}

export const WalletContext = createContext<IWalletContext>({
  isEnableServerSIWE: false,
  // eslint-disable-next-line
  setIsEnableServerSIWE: (v: boolean) => {},
});

export const useWallet = (): IWalletContext => {
  return useContext(WalletContext);
};

const ZERODEV_PROJECT_ID = env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

const { chains, provider, webSocketProvider } = configureChains(
  [
    polygonMumbai,
    // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [goerli] : []),
  ],
  [
    alchemyProvider({
      // eslint-disable-next-line
      apiKey: env.NEXT_PUBLIC_ALCHEMY_API_KEY_CLIENT,
    }),
    publicProvider(),
  ]
);
/**
 * Configure client with providers and allow for auto wallet connection
 */
const connectors = connectorsForWallets([
  {
    groupName: "Other",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    wallets: [
      //   googleWallet({
      //     chains: chains,
      //     options: { projectId: ZERODEV_PROJECT_ID },
      //   }),
      enhanceWalletWithAAConnector(metaMaskWallet({ chains }), {
        projectId: ZERODEV_PROJECT_ID,
      }),
      //   metaMaskWallet({ chains }),
    ],
  },
]);

const wagmiConfig = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: "Sign in to the RainbowKit + SIWE example app",
});

const WalletProvider = ({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) => {
  const [isEnableServerSIWE, setIsEnableServerSIWE] = useState<boolean>(false);

  const contextProvider = { isEnableServerSIWE, setIsEnableServerSIWE };

  return (
    <WalletContext.Provider value={contextProvider}>
      <SessionProvider session={session}>
        <WagmiConfig client={wagmiConfig}>
          <RainbowKitSiweNextAuthProvider
            // enabled={isEnableServerSIWE}
            getSiweMessageOptions={getSiweMessageOptions}
          >
            <RainbowKitProvider
              appInfo={{
                appName: "Rainbowkit Demo",
              }}
              chains={chains}
            >
              {children}
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </WagmiConfig>
      </SessionProvider>
    </WalletContext.Provider>
  );
};

export default WalletProvider;
