import withPWA from "next-pwa";

const pwaConfig = withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
});

const nextConfig = {
    // nextConfig options
    turbopack: {},
};

export default pwaConfig(nextConfig);