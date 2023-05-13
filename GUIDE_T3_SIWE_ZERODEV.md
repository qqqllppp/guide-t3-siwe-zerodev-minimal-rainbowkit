[for next-auth: "^4.21.0" - unsure for future versions]

-- T3 + SIWE --

1. yarn create t3-app
2. maintain next to be "^13.2.6" [not strictly related to t3+SIWE]
3. install @rainbow-me/rainbowkit >= 1.0.0 (doesn't work for ZERODEV yet, use 0.12.12)
4. install @rainbow-me/rainbowkit-siwe-next-auth >= 0.2.0
5. install "ethers": "^5.6.8",
6. install "siwe": "^2.1.4",
7. install "viem": "~0.3.19", (only for wagmi >= 1)
8. install "wagmi": "^1.0.1" (doesn't work for ZERODEV yet, use 0.12.13)
9. rmb add NEXTAUTH_SECRET in .env
10. edit `server/auth.ts` according to https://github.com/codingwithmanny/t3-app-siwe/tree/fix/next-auth-4.21.1
11. edit `pages/api/auth/[...nextauth].ts` according to https://github.com/codingwithmanny/t3-app-siwe/tree/fix/next-auth-4.21.1
12. edit `_app.tsx` and `index.tsx` as usual

-- ZERODEV --

13. install @zerodevapp/wagmi latest
14. edit `_app.tsx` as usual
15. add `transpilePackages: ["@zerodevapp", "@web3"],` to `next.config.mjs`
16. add `provider` to `siwe.verify` in `server/auth.ts`
17. check test/force signing
