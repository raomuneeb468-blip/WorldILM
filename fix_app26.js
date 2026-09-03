import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = '{m.content}\n                          </div>\n                          </div></div>) : (';
if (content.includes(target1)) {
  content = content.replace(target1, '{m.content}\n                          </div>\n                          </div></div></div>) : (');
  console.log("Fixed 1");
}

const target2 = '<RefreshCw size={12} />\n                                          Regenerate\n                                        </button>\n                                      </div>\n                                      </div></div>) : (';
if (content.includes(target2)) {
  content = content.replace(target2, '<RefreshCw size={12} />\n                                          Regenerate\n                                        </button>\n                                      </div>\n                                      </div></div></div></div>) : (');
  console.log("Fixed 2");
}

fs.writeFileSync('src/App.tsx', content);
