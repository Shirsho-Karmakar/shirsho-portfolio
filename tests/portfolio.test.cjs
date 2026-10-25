const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { DatabaseSync } = require('node:sqlite');
const ts = require(process.env.PORTFOLIO_TYPESCRIPT || 'typescript');
const dependencyRequire = process.env.PORTFOLIO_TEST_MODULES ? createRequire(path.join(process.env.PORTFOLIO_TEST_MODULES, 'package.json')) : require;
const root = path.resolve(__dirname, '..');
const env = {};
let identity = new Headers();
const cache = new Map();
function load(relative) {
  let filename = path.resolve(root, relative);
  if (!existsSync(filename)) filename = ['.ts','.tsx'].map(ext => filename + ext).find(existsSync);
  if (!filename) throw new Error('Module not found: ' + relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const result = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename, reportDiagnostics: true });
  assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, filename + ' syntax');
  function localRequire(spec) {
    if (spec === 'cloudflare:workers') return { env };
    if (spec === 'next/headers') return { headers: async () => identity };
    if (spec === 'next/navigation') return { redirect: to => { throw new Error('REDIRECT:' + to); } };
    if (spec.startsWith('.')) return load(path.resolve(path.dirname(filename), spec));
    return dependencyRequire(spec);
  }
  new Function('require', 'module', 'exports', result.outputText)(localRequire, module, module.exports);
  return module.exports;
}
const { initialContent, contentSchema } = load('lib/portfolio-data.ts');
const { readContent, writeContent } = load('lib/content.ts');
const admin = load('app/api/admin/route.ts');
const upload = load('app/api/upload/route.ts');
const media = load('app/api/media/[key]/route.ts');
const auth = load('lib/admin-auth.ts');
const home = load('app/page.tsx');
function login(email = '2005shirsho@gmail.com') { identity = new Headers({ 'oai-authenticated-user-id': 'test-user-id', 'oai-authenticated-user-email': email }); }
function saveRequest(content, origin = 'https://portfolio.test') { return new Request('https://portfolio.test/api/admin', { method: 'PUT', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(content) }); }
beforeEach(() => {
  identity = new Headers();
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(path.join(root,'drizzle/0000_portfolio_content.sql'),'utf8'));
  env.DB = { prepare: query => ({ bind: (...args) => ({ first: async () => sqlite.prepare(query).get(...args) || null, run: async () => sqlite.prepare(query).run(...args) }) }) };
  const objects = new Map();
  env.BUCKET = { put: async (key, bytes, options) => objects.set(key,{ body: bytes, ...options }), get: async key => objects.get(key) || null };
});
test('supplied profile and repository defaults pass validation', () => {
  assert.equal(contentSchema.safeParse(initialContent).success,true);
  assert.equal(initialContent.graduationYear,'2028');
  assert.deepEqual(initialContent.skills,['React','Next.js','JavaScript','MongoDB','PostgreSQL']);
});
test('blocks script links, invalid assets and duplicate project IDs', () => {
  const bad = structuredClone(initialContent); bad.projects[0].repository = 'javascript:alert(1)';
  assert.equal(contentSchema.safeParse(bad).success,false);
  bad.projects[0].repository = ''; bad.projects[0].image = '//example.com/pic.png';
  assert.equal(contentSchema.safeParse(bad).success,false);
  bad.projects[0].image = ''; bad.projects.push(bad.projects[0]);
  assert.equal(contentSchema.safeParse(bad).success,false);
});
test('initial content is independent of later mutations', async () => {
  const first = await readContent(); first.projects[0].title = 'changed';
  assert.equal((await readContent()).projects[0].title,'Chokher Alo');
});
test('anonymous visitors and a different signed-in account cannot read or edit drafts', async () => {
  assert.equal((await admin.GET()).status,403);
  assert.equal((await admin.PUT(saveRequest(initialContent))).status,403);
  login('someone@example.com');
  assert.equal(await auth.isAdmin(),false);
  assert.equal((await admin.GET()).status,403);
});
test('admin authorization and same-origin request are both required', async () => {
  login(); assert.equal(await auth.isAdmin(),true);
  assert.equal((await admin.PUT(saveRequest(initialContent,'https://attacker.test'))).status,403);
  assert.equal((await admin.PUT(saveRequest(initialContent,'null'))).status,403);
});
test('publishing persists in SQL and updates instead of duplicating the document', async () => {
  login(); const content = structuredClone(initialContent); content.bio = 'An updated introduction.';
  assert.equal((await admin.PUT(saveRequest(content))).status,200);
  assert.equal((await readContent()).bio,content.bio);
  content.bio = 'Another update.';
  assert.equal((await admin.PUT(saveRequest(content))).status,200);
  assert.equal((await readContent()).bio,content.bio);
  assert.equal((await admin.GET()).headers.get('cache-control'),'no-store');
});
test('draft projects do not reach public page props', async () => {
  const content = structuredClone(initialContent); content.projects[1].published = false;
  await writeContent(content);
  const page = await home.default();
  assert.equal(page.props.content.projects.length,1);
  assert.equal(page.props.content.projects[0].title,'Chokher Alo');
});
test('incomplete descriptions can be saved as drafts but cannot be published', async () => {
  login();
  const content = structuredClone(initialContent);
  content.projects[0].description = '';
  content.projects[0].published = false;
  assert.equal((await admin.PUT(saveRequest(content))).status,200);
  content.projects[0].published = true;
  assert.equal((await admin.PUT(saveRequest(content))).status,400);
});
test('rejects malformed JSON and invalid portfolio data without writing', async () => {
  login();
  const malformed = new Request('https://portfolio.test/api/admin',{ method:'PUT',headers:{ origin:'https://portfolio.test'},body:'{' });
  assert.equal((await admin.PUT(malformed)).status,400);
  assert.equal((await admin.PUT(saveRequest({projects:[]}))).status,400);
  assert.equal((await readContent()).bio,initialContent.bio);
});
async function uploadFile(file, origin = 'https://portfolio.test') {
  const form = new FormData(); form.append('file',file);
  return upload.POST(new Request('https://portfolio.test/api/upload',{method:'POST',headers:{ origin },body:form}));
}
test('uploads require admin identity and reject executable or disguised files', async () => {
  assert.equal((await uploadFile(new File(['x'],'x.png',{type:'image/png'}))).status,403);
  login();
  assert.equal((await uploadFile(new File(['<svg></svg>'],'x.svg',{type:'image/svg+xml'}))).status,400);
  assert.equal((await uploadFile(new File(['not a png'],'x.png',{type:'image/png'}))).status,400);
  assert.equal((await uploadFile(new File([new Uint8Array(5*1024*1024+1)],'big.png',{type:'image/png'}))).status,413);
});
test('image upload survives in bucket and serves with safe content headers', async () => {
  login(); const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9l0AAAAASUVORK5CYII=','base64');
  const result = await uploadFile(new File([png],'image.png',{type:'image/png'}));
  assert.equal(result.status,200); const body=await result.json();
  const key=body.path.split('/').at(-1);
  const response=await media.GET(new Request('https://portfolio.test'+body.path),{params:Promise.resolve({key})});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/png');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
});
test('PDF CV upload validates its signature and missing media returns 404', async () => {
  login();
  assert.equal((await uploadFile(new File(['%PDF-1.7\n'],'cv.pdf',{type:'application/pdf'}))).status,200);
  assert.equal((await uploadFile(new File(['fake'],'cv.pdf',{type:'application/pdf'}))).status,400);
  assert.equal((await media.GET(new Request('https://portfolio.test/api/media/missing'),{params:Promise.resolve({key:'missing'})})).status,404);
});
test('public UI renders verified profile, theme labels and project links', () => {
  const React = dependencyRequire('react');
  const { renderToStaticMarkup } = dependencyRequire('react-dom/server');
  const Portfolio = load('app/portfolio.tsx').default;
  const html=renderToStaticMarkup(React.createElement(Portfolio,{content:initialContent}));
  assert.match(html,/Shirsho/); assert.match(html,/2028/);
  assert.match(html,/Dark theme/); assert.match(html,/Light theme/); assert.match(html,/System theme/);
  assert.match(html,/https:\/\/github.com\/Shirsho-Karmakar\/chokher_alo/);
  assert.match(html,/https:\/\/github.com\/Shirsho-Karmakar\/orbit-converter/);
  assert.doesNotMatch(html,/years of experience|Senior Developer|expert in/i);
});
