const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

// Metro bundles the app. withNativeWind turns our Tailwind classes (global.css) into styles.
const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { input: './global.css' })
