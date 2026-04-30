'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  EmptyState,
  ErrorAlert,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { CosmeticItem, CosmeticType, PaginatedList } from '@/types';

const TYPES: CosmeticType[] = [
  'frame',
  'vehicle',
  'theme',
  'ring',
  'medal',
  'title',
  'room_card',
  'room_chat_bubble',
  'room_list_border',
  'mic_wave',
  'mic_skin',
  'special_gift_notification',
  'profile_background',
  'ludo_dice_skin',
  'dynamic_avatar',
];

export default function CosmeticsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'cosmetics.manage');

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<CosmeticType | ''>('');
  const [active, setActive] = useState('');

  const [data, setData] = useState<PaginatedList<CosmeticItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (active) params.set('active', active);
      const res = await api<PaginatedList<CosmeticItem>>(`/admin/cosmetics?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, active]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Cosmetics"
        subtitle="Master catalog of frames, vehicles, themes, badges, chat bubbles, etc. Used by both SVIP grants and the Store."
        actions={canManage && <Button href="/cosmetics/new">+ New Cosmetic</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="col-span-2"
        >
          <Input
            placeholder="Search code or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as CosmeticType | '');
            setPage(1);
          }}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <Select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No cosmetics yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Preview</Th>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Asset</Th>
                <Th>Rarity</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/cosmetics/${c.id}`}>
                      {c.previewUrl ? (
                        <img
                          src={c.previewUrl}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-slate-100" />
                      )}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/cosmetics/${c.id}`}>
                      <code className="text-xs font-semibold text-brand">{c.code}</code>
                    </Link>
                  </Td>
                  <Td>
                    <div className="font-medium text-slate-900">{c.name.en}</div>
                    {c.name.bn && <div className="text-xs text-slate-500">{c.name.bn}</div>}
                  </Td>
                  <Td className="text-xs">
                    <Badge tone="brand">{c.type.replace(/_/g, ' ')}</Badge>
                  </Td>
                  <Td className="text-xs">{c.assetType}</Td>
                  <Td className="text-xs">{'★'.repeat(c.rarity)}</Td>
                  <Td>
                    {c.active ? <Badge tone="green">active</Badge> : <Badge tone="amber">inactive</Badge>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
