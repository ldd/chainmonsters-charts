module.exports = {
  webpack: (config, env) => {
    const rules = config.module.rules.find(rule => !!rule.oneOf).oneOf;
    const babelLoaderRule = rules.find(rule =>
      rule.loader.includes("babel-loader")
    );

    babelLoaderRule.options.plugins.push(
      "@babel/plugin-proposal-logical-assignment-operators"
    );

    return config;
  }
};
