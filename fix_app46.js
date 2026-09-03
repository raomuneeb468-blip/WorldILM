import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix BrandLogo (line 150)
const brandLogoBroken = '      </svg>\n    </motion.div>\n  );\n};\n\n// Custom Starburst';
const brandLogoFixed = '      </svg>\n    </div>\n  );\n};\n\n// Custom Starburst';
content = content.replace(brandLogoBroken, brandLogoFixed);

// Now properly update LogoContainer
// Wait, I already added <motion.div> to LogoContainer but didn't remove the <div ...> correctly.
// Let's just find LogoContainer by its signature:
const logoRegex = /const LogoContainer = \(\{ isThinking, isStreaming \}: \{ isThinking\?: boolean; isStreaming\?: boolean \}\) => \{[\s\S]*?className="relative flex items-center justify-center">/;
console.log(content.match(logoRegex));

