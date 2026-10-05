async function verify() {
  const host = 'http://localhost:3000';
  
  console.log('=== VERIFYING / (LANDING PAGE) ===');
  const homeRes = await fetch(`${host}/`);
  const homeHtml = await homeRes.text();
  console.log('Status:', homeRes.status);
  console.log('Title:', homeHtml.match(/<title>([^<]+)<\/title>/)?.[1]);
  console.log('H1:', homeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim());
  console.log('Canonical:', homeHtml.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0]);
  console.log('OG Title:', homeHtml.match(/<meta[^>]*property="og:title"[^>]*>/)?.[0]);
  console.log('OG Image:', homeHtml.match(/<meta[^>]*property="og:image"[^>]*>/)?.[0]);
  console.log('Twitter Card:', homeHtml.match(/<meta[^>]*name="twitter:card"[^>]*>/)?.[0]);
  console.log('JSON-LD:', homeHtml.includes('application/ld+json') ? 'Present' : 'Missing');

  console.log('\n=== VERIFYING /robots.txt ===');
  const robotsRes = await fetch(`${host}/robots.txt`);
  console.log('Status:', robotsRes.status);
  console.log('Content:\n' + (await robotsRes.text()).trim());

  console.log('\n=== VERIFYING /sitemap.xml ===');
  const sitemapRes = await fetch(`${host}/sitemap.xml`);
  console.log('Status:', sitemapRes.status);
  const sitemapText = await sitemapRes.text();
  console.log('Contains /:', sitemapText.includes('https://kindle-clip.vercel.app'));
  console.log('Contains /guides:', sitemapText.includes('/guides'));
  console.log('Contains /privacy:', sitemapText.includes('/privacy'));
  console.log('Sample output (first 400 chars):\n' + sitemapText.slice(0, 400));

  console.log('\n=== VERIFYING /guides/how-to-find-my-clippings-txt ===');
  const guideRes = await fetch(`${host}/guides/how-to-find-my-clippings-txt`);
  const guideHtml = await guideRes.text();
  console.log('Status:', guideRes.status);
  console.log('Title:', guideHtml.match(/<title>([^<]+)<\/title>/)?.[1]);
  console.log('H1:', guideHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim());
  console.log('Article JSON-LD:', guideHtml.includes('"@type":"Article"') || guideHtml.includes('"@type": "Article"') ? 'Present' : 'Missing');

  console.log('\n=== VERIFYING AUTH / PRIVATE ROUTE NOINDEX ===');
  const loginRes = await fetch(`${host}/login`);
  const loginHtml = await loginRes.text();
  console.log('Login Status:', loginRes.status);
  console.log('Login Robots tag in HTML:', loginHtml.match(/<meta[^>]*name="robots"[^>]*>/)?.[0]);

  // Authenticated route test without cookies -> gets redirected by proxy
  const libRes = await fetch(`${host}/library`, { redirect: 'manual' });
  console.log('/library unauthenticated status:', libRes.status, 'Location:', libRes.headers.get('location'));
}

verify().catch(console.error);
