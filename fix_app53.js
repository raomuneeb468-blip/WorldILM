import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('                                      </div>\n                                      </div></div></div>) : (', '                                      </div>\n                                      </div></div>) : (');

fs.writeFileSync('src/App.tsx', content);
