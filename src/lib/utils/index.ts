export function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return new Response(JSON.stringify({ error: message, details }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function parseSearchParams(url: string) {
  const { searchParams } = new URL(url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!['page', 'limit', 'search'].includes(key)) {
      filters[key] = value;
    }
  }

  return { page, limit, search, offset, filters };
}

export function paginatedResponse(data: unknown[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export function generateCode(prefix: string, id: number): string {
  return `${prefix}${String(id).padStart(6, '0')}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}
