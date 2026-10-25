const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const cookieValues = new Map();
let storedDocument;
let currentUser;
let providerStatus;
let requests;
let files;
let forgedHeaders;
const savedFetch = global.fetch;
const envNames=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ADMIN_EMAIL','NODE_ENV'];
const savedEnv=Object.fromEntries(envNames.map(key=>[key,process.env[key]]));

function load(relative) {
  let filename=path.resolve(root,relative);
  if (!existsSync(filename)) filename=['.ts','.tsx'].map(ext=>filename+ext).find(existsSync);
  if (!filename) throw new Error('Module not found: '+relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module={exports:{}};cache.set(filename,module);
  const result=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:filename,reportDiagnostics:true});
  assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,filename+' syntax');
  function localRequire(spec) {
    if(spec==='server-only')return {};
    if(spec==='next/headers')return{cookies:async()=>({get:name=>cookieValues.has(name)?{value:cookieValues.get(name)}:undefined}),headers:async()=>forgedHeaders};
    if(spec==='next/navigation')return{redirect:to=>{throw Error('REDIRECT:'+to);}};
    if(spec.startsWith('.'))return load(path.resolve(path.dirname(filename),spec));
    return require(spec);
  }
  new Function('require','module','exports',result.outputText)(localRequire,module,module.exports);
  return module.exports;
}
const {initialContent,contentSchema}=load('lib/portfolio-data.ts');
const {readContent,writeContent}=load('lib/content.ts');
const auth=load('lib/admin-auth.ts');
const backend=load('lib/supabase.ts');
const admin=load('app/api/admin/route.ts');
const upload=load('app/api/upload/route.ts');
const media=load('app/api/media/[key]/route.ts');
const login=load('app/api/auth/login/route.ts');
const refresh=load('app/api/auth/refresh/route.ts');
const logout=load('app/api/auth/logout/route.ts');
const home=load('app/page.tsx');
const adminPage=load('app/admin/page.tsx');
function signedIn(email='2005shirsho@gmail.com') {cookieValues.set(auth.ACCESS_COOKIE,'valid-access');cookieValues.set(auth.REFRESH_COOKIE,'valid-refresh');currentUser={id:'admin-id',email,email_confirmed_at:'2026-10-01T00:00:00Z'};}
function session(){return{access_token:'new-access',refresh_token:'new-refresh',expires_in:3600,user:currentUser};}
function request(endpoint,body,origin='https://portfolio.test',method='POST'){return new Request('https://portfolio.test'+endpoint,{method,headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});}
function saveRequest(content,origin='https://portfolio.test'){return request('/api/admin',content,origin,'PUT');}
async function uploadFile(file,origin='https://portfolio.test') {const form=new FormData();form.append('file',file);return upload.POST(new Request('https://portfolio.test/api/upload',{method:'POST',headers:{origin},body:form}));}

beforeEach(()=>{
  process.env.NODE_ENV=savedEnv.NODE_ENV || "test";
  process.env.SUPABASE_URL='https://test.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test_placeholder';
  process.env.SUPABASE_SECRET_KEY='sb_secret_test_placeholder';
  process.env.ADMIN_EMAIL='2005shirsho@gmail.com';
  delete process.env.SUPABASE_ANON_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  cookieValues.clear();storedDocument=undefined;requests=[];files=new Map();providerStatus=0;
  forgedHeaders=new Headers();
  currentUser={id:'admin-id',email:'2005shirsho@gmail.com',email_confirmed_at:'2026-10-01T00:00:00Z'};
  global.fetch=async(url,options={})=>{
    const parsed=new URL(url);const headers=new Headers(options.headers);const method=options.method||'GET';
    assert.equal(parsed.origin,'https://test.supabase.co','No unexpected external service request');
    requests.push({url:parsed,headers,method,body:options.body});
    if(providerStatus)return Response.json({error:'Provider unavailable'},{status:providerStatus});
    if(parsed.pathname==='/auth/v1/user')return headers.get('authorization')?.match(/^Bearer (valid-access|new-access)$/)?Response.json(currentUser):Response.json({error:'Invalid token'},{status:401});
    if(parsed.pathname==='/auth/v1/token'){
      const body=JSON.parse(options.body);
      const valid=parsed.searchParams.get('grant_type')==='password'?body.email.toLowerCase()==='2005shirsho@gmail.com'&&body.password==='test-password':body.refresh_token==='valid-refresh';
      return valid?Response.json(session()):Response.json({error:'Invalid credentials'},{status:400});
    }
    if(parsed.pathname==='/auth/v1/logout')return new Response(null,{status:204});
    if(parsed.pathname==='/rest/v1/portfolio_content'){
      assert.equal(headers.get('apikey'),'sb_secret_test_placeholder');
      assert.equal(headers.has('authorization'),false,'New secret keys must not be sent as bearer JWTs');
      if(method==='GET')return Response.json(storedDocument?[{data:storedDocument}]:[]);
      assert.equal(parsed.searchParams.get('on_conflict'),'id');
      const row=JSON.parse(options.body);assert.equal(row.id,'portfolio');storedDocument=row.data;
      return new Response(null,{status:201});
    }
    if(parsed.pathname.startsWith('/storage/v1/object/')){
      assert.equal(headers.get('apikey'),'sb_secret_test_placeholder');
      const key=parsed.pathname.split('/').at(-1);
      if(method==='POST'){files.set(key,{body:options.body,type:headers.get('content-type')});return Response.json({Key:key});}
      const file=files.get(key);return file?new Response(file.body,{headers:{'content-type':file.type}}):Response.json({error:'not found'},{status:404});
    }
    throw Error('Unexpected endpoint: '+parsed.pathname);
  };
});
after(()=>{global.fetch=savedFetch;for(const name of envNames){if(savedEnv[name]===undefined)delete process.env[name];else process.env[name]=savedEnv[name];}});

test('verified profile defaults and strongest skills pass validation',()=>{
  assert.equal(contentSchema.safeParse(initialContent).success,true);assert.equal(initialContent.graduationYear,'2028');
  assert.deepEqual(initialContent.skills,['React','Next.js','JavaScript','MongoDB','PostgreSQL']);
});
test('rejects script links, invalid media paths and duplicate project IDs',()=>{
  const bad=structuredClone(initialContent);bad.projects[0].repository='javascript:alert(1)';assert.equal(contentSchema.safeParse(bad).success,false);
  bad.projects[0].repository='';bad.projects[0].image='//example.com/pic.png';assert.equal(contentSchema.safeParse(bad).success,false);
  bad.projects[0].image='';bad.projects.push(bad.projects[0]);assert.equal(contentSchema.safeParse(bad).success,false);
});
test('public portfolio and resume render without any backend or identity',async()=>{
  delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SECRET_KEY;delete process.env.SUPABASE_PUBLISHABLE_KEY;
  assert.equal((await readContent()).projects.length,2);assert.equal((await home.default()).props.content.projects.length,2);
  const resume=await load('app/cv/page.tsx').default();assert.ok(resume);assert.equal(requests.length,0);
  assert.equal(await auth.isAdmin(),false);assert.ok(await adminPage.default());
});
test('default content is cloned instead of mutated across reads',async()=>{
  const first=await readContent();first.projects[0].title='changed';assert.equal((await readContent()).projects[0].title,'Chokher Alo');
});
test('anonymous visitors and forged hosting identity headers cannot edit or read drafts',async()=>{
  forgedHeaders=new Headers({'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'2005shirsho@gmail.com'});
  assert.equal((await admin.GET()).status,403);assert.equal((await admin.PUT(saveRequest(initialContent))).status,403);assert.equal(requests.length,0);
});
test('only a provider-verified, confirmed administrator is authorized',async()=>{
  signedIn();assert.equal(await auth.isAdmin(),true);assert.equal(requests.at(-1).url.pathname,'/auth/v1/user');
  currentUser.email='someone@example.com';assert.equal(await auth.isAdmin(),false);
  currentUser.email='2005shirsho@gmail.com';delete currentUser.email_confirmed_at;assert.equal(await auth.isAdmin(),false);
  signedIn();cookieValues.set(auth.ACCESS_COOKIE,'forged-token');assert.equal(await auth.isAdmin(),false);
});
test('cross-origin requests cannot save changes or initiate login',async()=>{
  signedIn();assert.equal((await admin.PUT(saveRequest(initialContent,'https://attacker.test'))).status,403);
  assert.equal((await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'test-password'},'null'))).status,403);
});
test('content persists through the data API and updates the existing record',async()=>{
  signedIn();const content=structuredClone(initialContent);content.bio='Updated introduction.';
  assert.equal((await admin.PUT(saveRequest(content))).status,200);assert.equal((await readContent()).bio,content.bio);
  content.bio='Another update.';assert.equal((await admin.PUT(saveRequest(content))).status,200);assert.equal((await readContent()).bio,content.bio);
  assert.equal((await admin.GET()).headers.get('cache-control'),'no-store');
});
test('draft projects never reach anonymous public page props',async()=>{
  const content=structuredClone(initialContent);content.projects[1].published=false;await writeContent(content);
  const page=await home.default();assert.deepEqual(page.props.content.projects.map(p=>p.title),['Chokher Alo']);
});
test('unfinished descriptions can be saved as drafts but cannot be published',async()=>{
  signedIn();const content=structuredClone(initialContent);content.projects[0].description='';content.projects[0].published=false;
  assert.equal((await admin.PUT(saveRequest(content))).status,200);content.projects[0].published=true;assert.equal((await admin.PUT(saveRequest(content))).status,400);
});
test('malformed or invalid content is rejected without writing',async()=>{
  signedIn();const malformed=new Request('https://portfolio.test/api/admin',{method:'PUT',headers:{origin:'https://portfolio.test'},body:'{'});
  assert.equal((await admin.PUT(malformed)).status,400);assert.equal((await admin.PUT(saveRequest({projects:[]}))).status,400);assert.equal(storedDocument,undefined);
});
test('password sign-in sets HttpOnly secure cookies without returning tokens',async()=>{
  process.env.NODE_ENV='production';
  const response=await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'test-password'}));
  assert.equal(response.status,200);assert.equal(response.cookies.get(auth.ACCESS_COOKIE).value,'new-access');
  const header=response.headers.get('set-cookie');assert.match(header,/HttpOnly/i);assert.match(header,/Secure/i);assert.match(header,/SameSite=lax/i);
  assert.deepEqual(await response.json(),{signedIn:true});assert.equal(requests.at(-1).headers.get('apikey'),'sb_publishable_test_placeholder');
});
test('bad credentials, non-admin and unconfirmed accounts cannot start a session',async()=>{
  assert.equal((await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'wrong'}))).status,401);
  assert.equal((await login.POST(request('/api/auth/login',{email:'other@example.com',password:'test-password'}))).status,401);
  currentUser.email='other@example.com';assert.equal((await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'test-password'}))).status,403);
  currentUser.email='2005shirsho@gmail.com';delete currentUser.email_confirmed_at;
  assert.equal((await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'test-password'}))).status,403);
});
test('expired access sessions refresh before an editor save',async()=>{
  cookieValues.set(auth.REFRESH_COOKIE,'valid-refresh');
  const response=await refresh.POST(request('/api/auth/refresh',{}));assert.equal(response.status,200);
  assert.equal(response.cookies.get(auth.ACCESS_COOKIE).value,'new-access');assert.equal(response.cookies.get(auth.REFRESH_COOKIE).value,'new-refresh');
});
test('invalid refresh sessions are cleared and cross-origin refresh is blocked',async()=>{
  cookieValues.set(auth.REFRESH_COOKIE,'invalid-refresh');
  const response=await refresh.POST(request('/api/auth/refresh',{}));assert.equal(response.status,401);assert.equal(response.cookies.get(auth.ACCESS_COOKIE).value,'');
  assert.equal((await refresh.POST(request('/api/auth/refresh',{},'https://attacker.test'))).status,403);
});
test('logout revokes the provider session and clears local cookies',async()=>{
  signedIn();const response=await logout.POST(request('/api/auth/logout',{}));assert.equal(response.status,200);assert.equal(response.cookies.get(auth.ACCESS_COOKIE).value,'');
  assert.equal(requests.at(-1).url.pathname,'/auth/v1/logout');assert.equal((await logout.POST(request('/api/auth/logout',{},'https://attacker.test'))).status,403);
});
test('uploads require admin access and reject disguised files or files over 4 MB',async()=>{
  assert.equal((await uploadFile(new File(['x'],'x.png',{type:'image/png'}))).status,403);signedIn();
  assert.equal((await uploadFile(new File(['<svg></svg>'],'x.svg',{type:'image/svg+xml'}))).status,400);
  assert.equal((await uploadFile(new File(['not png'],'x.png',{type:'image/png'}))).status,400);
  assert.equal((await uploadFile(new File([new Uint8Array(4*1024*1024+1)],'large.png',{type:'image/png'}))).status,413);
});
test('image upload persists and is served with safe content headers',async()=>{
  signedIn();const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9l0AAAAASUVORK5CYII=','base64');
  const result=await uploadFile(new File([png],'image.png',{type:'image/png'}));assert.equal(result.status,200);const body=await result.json();const key=body.path.split('/').at(-1);
  const response=await media.GET(new Request('https://portfolio.test'+body.path),{params:Promise.resolve({key})});
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
});
test('PDF uploads validate signatures and absent media returns 404',async()=>{
  signedIn();assert.equal((await uploadFile(new File(['%PDF-1.7\n'],'cv.pdf',{type:'application/pdf'}))).status,200);
  assert.equal((await uploadFile(new File(['fake'],'cv.pdf',{type:'application/pdf'}))).status,400);
  assert.equal((await media.GET(new Request('https://portfolio.test/api/media/missing'),{params:Promise.resolve({key:'missing'})})).status,404);
});
test('authentication provider failures fail closed',async()=>{
  signedIn();providerStatus=503;assert.equal(await auth.isAdmin(),false);assert.equal((await admin.GET()).status,403);
  cookieValues.clear();providerStatus=429;
  assert.equal((await login.POST(request('/api/auth/login',{email:'2005shirsho@gmail.com',password:'test-password'}))).status,429);
});
test('secret keys stay server-side and use the proper API-key header',async()=>{
  await backend.supabaseRequest('/rest/v1/portfolio_content');assert.equal(requests[0].headers.get('apikey'),'sb_secret_test_placeholder');assert.equal(requests[0].headers.has('authorization'),false);
  delete process.env.SUPABASE_SECRET_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='eyJ.legacy.test';
  await backend.supabaseRequest('/auth/v1/user');assert.equal(requests.at(-1).headers.get('authorization'),'Bearer eyJ.legacy.test');
});
test('public UI renders profile, theme controls and repository links',()=>{
  const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');const Portfolio=load('app/portfolio.tsx').default;
  const html=renderToStaticMarkup(React.createElement(Portfolio,{content:initialContent}));assert.match(html,/2028/);assert.match(html,/Dark theme/);assert.match(html,/Light theme/);assert.match(html,/System theme/);
  assert.match(html,/https:\/\/github.com\/Shirsho-Karmakar\/chokher_alo/);assert.match(html,/https:\/\/github.com\/Shirsho-Karmakar\/orbit-converter/);
  assert.doesNotMatch(html,/years of experience|Senior Developer|sb_secret_/i);
});
