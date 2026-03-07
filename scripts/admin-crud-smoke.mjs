const API_BASE = (
  process.env.API_BASE ||
  (process.env.BACKEND_URL ? `${String(process.env.BACKEND_URL).replace(/\/+$/, '')}/api` : '') ||
  'http://127.0.0.1:3001/api'
).replace(/\/+$/, '');
const API_ROOT = API_BASE.replace(/\/api$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BOOTSTRAP_ADMIN_SECRET = process.env.BOOTSTRAP_ADMIN_SECRET;
const CANONICAL_BASE_URL = process.env.CANONICAL_BASE_URL || 'https://example.com';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function request(path, { method = 'GET', body, token, expected = [200] } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!expected.includes(res.status)) {
    const msg = typeof data === 'object' && data?.error ? data.error : text || `HTTP ${res.status}`;
    throw new Error(`${method} ${path} failed: ${res.status} - ${msg}`);
  }

  return { status: res.status, data };
}

async function run() {
  requireEnv('ADMIN_EMAIL', ADMIN_EMAIL);
  requireEnv('ADMIN_PASSWORD', ADMIN_PASSWORD);
  const runId = Date.now();
  const ar = 'اختبار عربي';
  const results = [];
  const created = {
    productId: null,
    supplyId: null,
    articleId: null,
    heroId: null,
    offerId: null,
    policyId: null,
    serviceId: null,
    pageId: null,
    mediaId: null,
  };
  const originalSettings = {
    contact: null,
    seo: null,
    company: null,
  };

  const pass = (name) => results.push({ name, status: 'PASS' });
  const fail = (name, error) => results.push({ name, status: 'FAIL', error: error.message });

  // Login
  let token = '';
  try {
    const tryLogin = async () =>
      request('/auth/login', {
        method: 'POST',
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        expected: [200],
      });

    let login;
    try {
      login = await tryLogin();
    } catch {
      if (BOOTSTRAP_ADMIN_SECRET) {
        await request('/auth/bootstrap-admin', {
          method: 'POST',
          body: { name: 'Owner', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, secret: BOOTSTRAP_ADMIN_SECRET },
          expected: [200, 201, 409],
        }).catch(() => null);
      }
      login = await tryLogin();
    }

    token = login.data?.token || '';
    assert(token, 'No token received from login');
    pass('Admin login');
  } catch (error) {
    fail('Admin login', error);
    printSummary(results);
    process.exitCode = 1;
    return;
  }

  try {
    const [contact, seo, company] = await Promise.all([
      request('/settings/contact', { expected: [200] }),
      request('/settings/seo', { expected: [200] }),
      request('/settings/company', { expected: [200] }),
    ]);

    originalSettings.contact = contact.data;
    originalSettings.seo = seo.data;
    originalSettings.company = company.data;
  } catch {
    // Keep smoke coverage running even if the environment lacks one of the singleton settings rows.
  }

  // MEDIA multipart upload + managed cleanup
  try {
    const uploadMultipartFile = async ({ base64, fileName, category, expectedMimeType }) => {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', new Blob([Buffer.from(base64, 'base64')]), fileName);

      const uploadRes = await fetch(`${API_BASE}/media/upload-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadText = await uploadRes.text();
      const uploadData = uploadText ? JSON.parse(uploadText) : null;

      if (!uploadRes.ok) {
        throw new Error(`Multipart upload failed: ${uploadRes.status} - ${uploadData?.error || uploadText}`);
      }

      assert(uploadData?.url?.startsWith('/uploads/media/'), 'Upload URL is not managed by the project');
      assert(uploadData?.mimeType === expectedMimeType, `Unexpected MIME type for ${fileName}: ${uploadData?.mimeType}`);

      const served = await fetch(`${API_ROOT}${uploadData.url}`);
      assert(served.ok, `Uploaded file ${fileName} was not served from /uploads`);

      return uploadData;
    };

    const registerManagedMedia = async (uploadData, id, category) => {
      const createdMedia = await request('/media', {
        method: 'POST',
        token,
        expected: [201],
        body: {
          id,
          url: uploadData.url,
          name: uploadData.name,
          size: uploadData.size,
          fileType: uploadData.fileType,
          mimeType: uploadData.mimeType,
          category,
          date: new Date().toLocaleDateString('ar-SY'),
        },
      });

      assert(createdMedia.data?.id, `Media record ${id} was not created`);
      return createdMedia.data.id;
    };

    const imageUpload = await uploadMultipartFile({
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=',
      fileName: `smoke-${runId}.heic`,
      category: 'smoke-heic',
      expectedMimeType: 'image/heic',
    });
    const imageMediaId = await registerManagedMedia(imageUpload, `img-smoke-image-${runId}`, 'smoke-heic');

    const documentUpload = await uploadMultipartFile({
      base64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0Y=',
      fileName: `smoke-${runId}.pdf`,
      category: 'smoke-docs',
      expectedMimeType: 'application/pdf',
    });
    created.mediaId = await registerManagedMedia(documentUpload, `img-smoke-doc-${runId}`, 'smoke-docs');

    await request(`/media/${imageMediaId}`, { method: 'DELETE', token, expected: [204] });
    const imageServedAfterDelete = await fetch(`${API_ROOT}${imageUpload.url}`);
    assert(imageServedAfterDelete.status === 404, 'Managed uploaded image still exists after media delete');

    await request(`/media/${created.mediaId}`, { method: 'DELETE', token, expected: [204] });
    created.mediaId = null;

    const documentServedAfterDelete = await fetch(`${API_ROOT}${documentUpload.url}`);
    assert(documentServedAfterDelete.status === 404, 'Managed uploaded document still exists after media delete');

    pass('Media multipart upload + cleanup');
  } catch (error) {
    fail('Media multipart upload + cleanup', error);
  }

  // SETTINGS (frontend control surfaces)
  try {
    const marker = `Smoke-${runId}-${ar}`;
    await request('/settings/contact', {
      method: 'PUT',
      token,
      expected: [200],
      body: {
        phone: `+9639${String(runId).slice(-8)}`,
        email: `smoke-${runId}@example.com`,
        address: `Address ${marker}`,
        city: 'دمشق',
        country: 'سوريا',
        workingHours: 'السبت - الخميس: 10-18',
        socialMedia: { facebook: `https://facebook.com/${marker}` },
      },
    });
    const contact = await request('/settings/contact', { expected: [200] });
    assert(String(contact.data?.email || '').includes(`smoke-${runId}`), 'Contact settings email not updated');
    assert(String(contact.data?.address || '').includes(ar), 'Contact settings Arabic text not preserved');
    pass('Settings contact update/read');
  } catch (error) {
    fail('Settings contact update/read', error);
  }

  try {
    const title = `SEO Title ${runId}`;
    await request('/settings/seo', {
      method: 'PUT',
      token,
      expected: [200],
      body: {
        defaultTitle: title,
        defaultDescription: `SEO Desc ${runId}`,
        canonicalBaseUrl: CANONICAL_BASE_URL,
      },
    });
    const seo = await request('/settings/seo', { expected: [200] });
    assert(seo.data?.defaultTitle === title, 'SEO settings not updated');
    pass('Settings SEO update/read');
  } catch (error) {
    fail('Settings SEO update/read', error);
  }

  try {
    const companyName = `Reptile House ${runId}`;
    await request('/settings/company', {
      method: 'PUT',
      token,
      expected: [200],
      body: {
        name: companyName,
        nameEnglish: companyName,
        description: `Company ${runId}`,
      },
    });
    const company = await request('/settings/company', { expected: [200] });
    assert(company.data?.name === companyName, 'Company settings not updated');
    pass('Settings company update/read');
  } catch (error) {
    fail('Settings company update/read', error);
  }

  // PRODUCT CRUD
  try {
    const createdProduct = await request('/products', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        name: `منتج ${ar} ${runId}`,
        species: 'Test Species',
        description: `CRUD smoke product ${ar}`,
        price: 199,
        imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
        rating: 4.9,
        isAvailable: true,
        status: 'available',
        category: 'lizard',
      },
    });
    created.productId = createdProduct.data?.id;
    assert(created.productId, 'Product create did not return id');

    await request(`/products/${created.productId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { price: 299, name: `منتج محدث ${ar} ${runId}` },
    });
    const list = await request('/products', { expected: [200] });
    assert(Array.isArray(list.data) && list.data.some((p) => p.id === created.productId), 'Product not found in list');
    assert(
      list.data.some((p) => p.id === created.productId && String(p.name || '').includes(ar)),
      'Product Arabic text not preserved'
    );

    await request(`/products/${created.productId}`, { method: 'DELETE', token, expected: [204] });
    const listAfterDelete = await request('/products', { expected: [200] });
    assert(!listAfterDelete.data.some((p) => p.id === created.productId), 'Product still exists after delete');
    created.productId = null;
    pass('Products CRUD');
  } catch (error) {
    fail('Products CRUD', error);
  }

  // SUPPLIES CRUD
  try {
    const createdSupply = await request('/supplies', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        name: `مستلزم ${ar} ${runId}`,
        category: 'heating',
        description: `CRUD smoke supply ${ar}`,
        price: 89,
        imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
        rating: 4.8,
        isAvailable: true,
        status: 'متوفر',
      },
    });
    created.supplyId = createdSupply.data?.id;
    assert(created.supplyId, 'Supply create did not return id');

    await request(`/supplies/${created.supplyId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: {
        price: 99,
        name: `مستلزم محدث ${ar} ${runId}`,
        status: 'غير متوفر',
        isAvailable: false,
      },
    });
    const list = await request('/supplies', { expected: [200] });
    assert(Array.isArray(list.data) && list.data.some((s) => s.id === created.supplyId), 'Supply not found in list');
    assert(
      list.data.some((s) => s.id === created.supplyId && String(s.name || '').includes(ar)),
      'Supply Arabic text not preserved',
    );

    await request(`/supplies/${created.supplyId}`, { method: 'DELETE', token, expected: [204] });
    const listAfterDelete = await request('/supplies', { expected: [200] });
    assert(!listAfterDelete.data.some((s) => s.id === created.supplyId), 'Supply still exists after delete');
    created.supplyId = null;
    pass('Supplies CRUD');
  } catch (error) {
    fail('Supplies CRUD', error);
  }

  // ARTICLE CRUD
  try {
    const createdArticle = await request('/articles', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        title: `مقال ${ar} ${runId}`,
        excerpt: `Excerpt ${ar}`,
        content: `Content ${ar}`,
        category: 'educational',
        date: '2026-03-05',
        author: 'Smoke',
        image: '/assets/photo_2026-02-04_07-13-35.jpg',
      },
    });
    created.articleId = createdArticle.data?.id;
    assert(created.articleId, 'Article create did not return id');

    await request(`/articles/${created.articleId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { title: `مقال محدث ${ar} ${runId}` },
    });
    await request(`/articles/${created.articleId}`, { method: 'DELETE', token, expected: [204] });
    created.articleId = null;
    pass('Articles CRUD');
  } catch (error) {
    fail('Articles CRUD', error);
  }

  // HERO CRUD
  try {
    const heroId = `smoke-hero-${runId}`;
    const createdHero = await request('/hero', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        id: heroId,
        image: '/assets/photo_2026-02-04_07-13-35.jpg',
        title: `Hero ${runId}`,
        subtitle: 'Sub',
        buttonText: 'Go',
        link: 'showcase',
        active: true,
      },
    });
    created.heroId = createdHero.data?.id || heroId;
    await request(`/hero/${created.heroId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { title: `Hero Updated ${runId}` },
    });
    await request(`/hero/${created.heroId}`, { method: 'DELETE', token, expected: [204] });
    created.heroId = null;
    pass('Hero slides CRUD');
  } catch (error) {
    fail('Hero slides CRUD', error);
  }

  // OFFERS CRUD
  try {
    const offerId = `smoke-offer-${runId}`;
    const createdOffer = await request('/offers', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        id: offerId,
        title: `عرض ${ar} ${runId}`,
        description: `Offer desc ${ar}`,
        imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
        discountPercentage: 15,
        startDate: '2026-03-05',
        endDate: '2026-12-31',
        isActive: true,
        targetCategory: 'all',
        buttonText: 'Open',
        buttonLink: 'offers',
      },
    });
    created.offerId = createdOffer.data?.id || offerId;
    await request(`/offers/${created.offerId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { title: `عرض محدث ${ar} ${runId}` },
    });
    await request(`/offers/${created.offerId}`, { method: 'DELETE', token, expected: [204] });
    created.offerId = null;
    pass('Offers CRUD');
  } catch (error) {
    fail('Offers CRUD', error);
  }

  // POLICIES CRUD
  try {
    const policyId = `smoke-policy-${runId}`;
    const createdPolicy = await request('/policies', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        id: policyId,
        type: 'custom',
        title: `سياسة ${ar} ${runId}`,
        content: `<p>Policy content ${ar}</p>`,
        lastUpdated: '2026-03-05',
        isActive: true,
      },
    });
    created.policyId = createdPolicy.data?.id || policyId;
    await request(`/policies/${created.policyId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { title: `سياسة محدثة ${ar} ${runId}` },
    });
    await request(`/policies/${created.policyId}`, { method: 'DELETE', token, expected: [204] });
    created.policyId = null;
    pass('Policies CRUD');
  } catch (error) {
    fail('Policies CRUD', error);
  }

  // SERVICES CRUD + reorder
  try {
    const serviceId = `smoke-service-${runId}`;
    const createdService = await request('/services', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        id: serviceId,
        title: `خدمة ${ar} ${runId}`,
        description: `Service description ${ar}`,
        imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
        icon: 'reptile',
        price: 50,
        sortOrder: 5,
        isPublished: true,
      },
    });
    created.serviceId = createdService.data?.id || serviceId;
    await request(`/services/${created.serviceId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: {
        id: created.serviceId,
        title: `خدمة محدثة ${ar} ${runId}`,
        description: `Service description updated ${ar}`,
        imageUrl: '/assets/photo_2026-02-04_07-13-35.jpg',
        icon: 'reptile',
        price: 70,
        sortOrder: 6,
        isPublished: true,
      },
    });
    await request('/services/reorder', {
      method: 'POST',
      token,
      expected: [200],
      body: { items: [{ id: created.serviceId, sortOrder: 1 }] },
    });
    await request(`/services/${created.serviceId}`, { method: 'DELETE', token, expected: [204] });
    created.serviceId = null;
    pass('Services CRUD + reorder');
  } catch (error) {
    fail('Services CRUD + reorder', error);
  }

  // PAGE CONTENT CRUD + frontend slug fetch
  try {
    const slug = `smoke-page-${runId}`;
    const createdPage = await request('/page-contents', {
      method: 'POST',
      token,
      expected: [201],
      body: {
        id: `page-${runId}`,
        slug,
        title: `صفحة ${ar} ${runId}`,
        excerpt: `Page excerpt ${ar}`,
        content: `<p>Page content ${ar}</p>`,
        seoTitle: `SEO ${runId}`,
        seoDescription: `SEO Desc ${runId}`,
        isActive: true,
      },
    });
    created.pageId = createdPage.data?.id;
    assert(created.pageId, 'Page content create did not return id');

    const getBySlug = await request(`/page-contents/slug/${slug}`, { expected: [200] });
    assert(getBySlug.data?.slug === slug, 'Page content slug fetch failed');
    assert(String(getBySlug.data?.title || '').includes(ar), 'Page content Arabic text not preserved');

    await request(`/page-contents/${created.pageId}`, {
      method: 'PUT',
      token,
      expected: [200],
      body: { title: `Page Updated ${runId}` },
    });
    await request(`/page-contents/${created.pageId}`, { method: 'DELETE', token, expected: [204] });
    created.pageId = null;
    pass('Page contents CRUD + slug read');
  } catch (error) {
    fail('Page contents CRUD + slug read', error);
  }

  // Cleanup safety
  await safeCleanup(token, created, originalSettings);
  printSummary(results);
  if (results.some((r) => r.status === 'FAIL')) process.exitCode = 1;
}

async function safeCleanup(token, created, originalSettings) {
  const cleanupOps = [];
  if (created.productId) cleanupOps.push(request(`/products/${created.productId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.supplyId) cleanupOps.push(request(`/supplies/${created.supplyId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.articleId) cleanupOps.push(request(`/articles/${created.articleId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.heroId) cleanupOps.push(request(`/hero/${created.heroId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.offerId) cleanupOps.push(request(`/offers/${created.offerId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.policyId) cleanupOps.push(request(`/policies/${created.policyId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.serviceId) cleanupOps.push(request(`/services/${created.serviceId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.pageId) cleanupOps.push(request(`/page-contents/${created.pageId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (created.mediaId) cleanupOps.push(request(`/media/${created.mediaId}`, { method: 'DELETE', token, expected: [204, 404] }));
  if (originalSettings?.contact) cleanupOps.push(request('/settings/contact', { method: 'PUT', token, expected: [200], body: originalSettings.contact }));
  if (originalSettings?.seo) cleanupOps.push(request('/settings/seo', { method: 'PUT', token, expected: [200], body: originalSettings.seo }));
  if (originalSettings?.company) cleanupOps.push(request('/settings/company', { method: 'PUT', token, expected: [200], body: originalSettings.company }));
  await Promise.allSettled(cleanupOps);
}

function printSummary(results) {
  console.log('\n=== Admin Dashboard CRUD Smoke Test ===');
  for (const row of results) {
    if (row.status === 'PASS') {
      console.log(`PASS - ${row.name}`);
    } else {
      console.log(`FAIL - ${row.name}: ${row.error}`);
    }
  }
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.length - passCount;
  console.log(`\nTotal: ${results.length}, PASS: ${passCount}, FAIL: ${failCount}`);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err.message);
  process.exitCode = 1;
});
